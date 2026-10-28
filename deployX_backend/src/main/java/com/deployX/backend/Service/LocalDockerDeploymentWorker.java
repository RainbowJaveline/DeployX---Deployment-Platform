package com.deployX.backend.Service;

import com.deployX.backend.Enum.DeploymentStatus;
import com.deployX.backend.Repository.DeploymentEnvironmentVariableRepository;
import com.deployX.backend.Repository.DeploymentRepository;
import com.deployX.backend.modules.Deployment;
import com.deployX.backend.modules.DeploymentEnvironmentVariable;
import com.deployX.backend.modules.User;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;
import java.util.regex.Matcher;
import com.deployX.backend.io.DeploymentStatusResponse;
import java.util.regex.Pattern;
import java.util.stream.Stream;

@Component
@RequiredArgsConstructor
public class LocalDockerDeploymentWorker {
    private final DeploymentRepository deployments;
    private final DeploymentEnvironmentVariableRepository environmentVariables;
    private final SecretEncryptionService encryptionService;
    private final DeploymentLogService logs;
    private final DeploymentStreamService streamService;
    private final ObjectMapper objectMapper;

    @Value("${deployx.deployments.workspace:${java.io.tmpdir}/deployx-workspaces}")
    private String workspaceRoot;

    @Async("deploymentTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onDeploymentStarted(DeploymentStartedEvent event) {
        UUID id = event.deploymentId();
        Path workspace = Paths.get(workspaceRoot).toAbsolutePath().normalize()
                .resolve(id.toString()).resolve(UUID.randomUUID().toString());
        String containerName = "deployx-" + id.toString().replace("-", "");
        String imageName = containerName + ":latest";
        String containerId = null;
        try {
            Deployment deployment = requireDeployment(id);
            run(List.of("docker", "info", "--format", "{{.ServerVersion}}"),
                    null, Duration.ofMinutes(2), line -> append(id, "INFO", "Docker engine " + line));
            try { run(List.of("docker", "rm", "--force", containerName), null, Duration.ofMinutes(1), ignored -> { }); }
            catch (Exception ignored) { }
            Files.createDirectories(workspace);
            Path repositoryDirectory = workspace.resolve("source");
            cloneRepository(deployment, repositoryDirectory, id);

            Path context = repositoryDirectory;
            if (deployment.getComponentPath() != null && !deployment.getComponentPath().isBlank()) {
                Path selected = repositoryDirectory.resolve(deployment.getComponentPath()).normalize();
                if (!selected.startsWith(repositoryDirectory) || !Files.isDirectory(selected)) {
                    throw new IllegalStateException("Selected project component path is invalid or missing.");
                }
                context = selected;
            }

            JsonNode config = readBuildConfig(deployment);
            int port = config.path("applicationPort").asInt(defaultPort(deployment.getProjectType()));
            if (port < 1 || port > 65535) throw new IllegalStateException("Application port must be between 1 and 65535.");
            double cpuCores = config.path("cpuCores").asDouble(1.0);
            int memoryMb = config.path("memoryMb").asInt(512);
            if (cpuCores < 0.1 || cpuCores > 4) throw new IllegalStateException("Local deployments are limited to 0.1–4 CPU cores.");
            if (memoryMb < 128 || memoryMb > 4096) throw new IllegalStateException("Local deployments are limited to 128–4096 MB of memory.");
            String runtime = config.path("runtime").asText(deployment.getProjectType());
            if (!Files.isRegularFile(context.resolve("Dockerfile"))) {
                generateDockerfile(context, runtime, port, id);
            }

            updateStatus(id, DeploymentStatus.BUILDING, null, null);
            append(id, "INFO", "Building Docker image.");
            run(List.of("docker", "build", "--tag", imageName, context.toString()),
                    workspace, Duration.ofMinutes(30), line -> append(id, "INFO", line));

            Path envFile = workspace.resolve("deployment.env");
            writeEnvironmentFile(id, envFile, port);
            updateStatus(id, DeploymentStatus.DEPLOYING, null, null);
            append(id, "INFO", "Starting application container with resource limits.");
            try {
                containerId = run(List.of("docker", "run", "--detach", "--name", containerName,
                                "--restart", "unless-stopped", "--memory", memoryMb + "m",
                                "--cpus", Double.toString(cpuCores), "--pids-limit", "256", "--init",
                                "--security-opt", "no-new-privileges:true", "--cap-drop", "ALL",
                                "--publish", "127.0.0.1::" + port, "--env-file", envFile.toString(), imageName),
                        workspace, Duration.ofMinutes(2), line -> append(id, "INFO", line)).trim();
            } finally {
                Files.deleteIfExists(envFile);
            }
            String publishedPort = run(List.of("docker", "port", containerName, port + "/tcp"),
                    workspace, Duration.ofSeconds(30), ignored -> { });
            Matcher portMatcher = Pattern.compile("127\\.0\\.0\\.1:(\\d+)").matcher(publishedPort);
            if (!portMatcher.find()) throw new IllegalStateException("Docker did not publish the application port on localhost.");
            String applicationUrl = "http://localhost:" + portMatcher.group(1);

            updateApplicationUrl(id, containerId, applicationUrl);
            waitForApplication(id, applicationUrl, config.path("healthCheckPath").asText("/"));
            append(id, "SUCCESS", "Application is responding at " + applicationUrl);
            updateStatus(id, DeploymentStatus.RUNNING, null, LocalDateTime.now());
        } catch (Exception exception) {
            String message = safeFailureMessage(exception);
            if (containerId != null && !containerId.isBlank()) {
                try { run(List.of("docker", "rm", "--force", containerId), null, Duration.ofMinutes(1), ignored -> { }); }
                catch (Exception ignored) { }
            }
            append(id, "ERROR", message);
            updateStatus(id, DeploymentStatus.FAILED, message, LocalDateTime.now());
        } finally {
            deleteWorkspace(workspace);
        }
    }

    private void cloneRepository(Deployment deployment, Path destination, UUID id) throws Exception {
        String url = deployment.getRepositoryUrl();
        List<String> command = new ArrayList<>(List.of("git", "clone", "--depth", "1", "--branch",
                deployment.getBranch(), url, destination.toString()));
        ProcessBuilder builder = new ProcessBuilder(command).redirectErrorStream(true);
        builder.environment().put("GIT_TERMINAL_PROMPT", "0");
        builder.environment().put("GIT_CONFIG_COUNT", "1");
        builder.environment().put("GIT_CONFIG_KEY_0", "http.https://github.com/.extraheader");
        User user = deployment.getUser();
        String token = user == null ? null : user.getGithubAccessToken();
        if (token != null && !token.isBlank()) {
            String basic = Base64.getEncoder().encodeToString(("x-access-token:" + token).getBytes(StandardCharsets.UTF_8));
            builder.environment().put("GIT_CONFIG_VALUE_0", "AUTHORIZATION: basic " + basic);
        } else {
            builder.environment().remove("GIT_CONFIG_COUNT");
            builder.environment().remove("GIT_CONFIG_KEY_0");
        }
        append(id, "INFO", "Cloning the selected repository.");
        run(builder, null, Duration.ofMinutes(10), line -> append(id, "INFO", line));
        updateStatus(id, DeploymentStatus.CLONING, null, null);
    }

    private void generateDockerfile(Path context, String runtime, int port, UUID id) throws Exception {
        String normalized = runtime == null ? "" : runtime.toUpperCase();
        String dockerfile;
        if (normalized.equals("NODE") || normalized.equals("NODEJS") || normalized.equals("JAVASCRIPT")) {
            Path manifest = context.resolve("package.json");
            if (!Files.isRegularFile(manifest)) throw new IllegalStateException("Node deployment needs a package.json or a Dockerfile.");
            JsonNode packageJson = objectMapper.readTree(manifest.toFile());
            JsonNode scripts = packageJson.path("scripts");
            boolean hasStart = scripts.hasNonNull("start");
            boolean hasBuild = scripts.hasNonNull("build");
            boolean vite = packageJson.path("dependencies").has("vite") || packageJson.path("devDependencies").has("vite");
            if (!hasStart && !(hasBuild && vite)) {
                throw new IllegalStateException("Node app needs an npm start script, or a Vite build script, or a repository Dockerfile.");
            }
            String command = hasStart
                    ? "CMD [\"npm\",\"start\"]"
                    : "CMD [\"npx\",\"vite\",\"preview\",\"--host\",\"0.0.0.0\",\"--port\",\"" + port + "\"]";
            String build = !hasStart ? "RUN npm run build\n" : "";
            dockerfile = "FROM node:22-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\n" + build +
                    "ENV PORT=" + port + "\nEXPOSE " + port + "\n" + command + "\n";
        } else if (normalized.equals("JAVA") || normalized.equals("SPRING") || normalized.equals("SPRING_BOOT")) {
            if (!Files.isRegularFile(context.resolve("pom.xml"))) throw new IllegalStateException("Java deployment without a Dockerfile currently requires Maven (pom.xml).");
            String wrapper = Files.isRegularFile(context.resolve("mvnw")) ? "RUN chmod +x mvnw && ./mvnw -B -DskipTests package" : "RUN mvn -B -DskipTests package";
            String copy = Files.isRegularFile(context.resolve("mvnw")) ? "COPY . .\n" : "COPY . .\n";
            dockerfile = "FROM maven:3.9-eclipse-temurin-21 AS build\nWORKDIR /app\n" + copy + wrapper +
                    " && jar_file=$(find target -maxdepth 1 -name '*.jar' ! -name '*-sources.jar' ! -name '*-javadoc.jar' | head -n 1) && test -n \"$jar_file\" && cp \"$jar_file\" /app/app.jar\n" +
                    "FROM eclipse-temurin:21-jre\nWORKDIR /app\nCOPY --from=build /app/app.jar ./app.jar\nENV PORT=" + port +
                    "\nEXPOSE " + port + "\nENTRYPOINT [\"java\",\"-jar\",\"/app/app.jar\"]\n";
        } else {
            throw new IllegalStateException("This project type needs its own Dockerfile. Automatic local builds currently support Node and Maven Java projects.");
        }
        Files.writeString(context.resolve("Dockerfile"), dockerfile, StandardCharsets.UTF_8);
        append(id, "INFO", "Generated a Node or Java Dockerfile for this component.");
    }

    private JsonNode readBuildConfig(Deployment deployment) throws Exception {
        if (deployment.getBuildConfigJson() == null) throw new IllegalStateException("Save deployment build settings first.");
        return objectMapper.readTree(deployment.getBuildConfigJson());
    }

    private int defaultPort(String projectType) {
        return projectType != null && projectType.toUpperCase().contains("NODE") ? 3000 : 8080;
    }

    private void writeEnvironmentFile(UUID id, Path envFile, int port) throws Exception {
        List<DeploymentEnvironmentVariable> variables = environmentVariables.findAllByDeployment_DeploymentId(id);
        StringBuilder content = new StringBuilder("PORT=").append(port).append('\n');
        for (DeploymentEnvironmentVariable variable : variables) {
            if (variable.getName().equalsIgnoreCase("PORT")) continue;
            String value = encryptionService.decrypt(variable.getEncryptedValue());
            if (value.contains("\n") || value.contains("\r")) throw new IllegalStateException("Multiline environment variable values are not supported by the local worker.");
            content.append(variable.getName()).append('=').append(value).append('\n');
        }
        Files.writeString(envFile, content, StandardCharsets.UTF_8);
    }

    private void waitForApplication(UUID id, String applicationUrl, String healthPath) throws Exception {
        String path = healthPath == null || healthPath.isBlank() ? "/" : healthPath;
        if (!path.startsWith("/")) path = "/" + path;
        URI uri = URI.create(applicationUrl + path);
        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3))
                .followRedirects(HttpClient.Redirect.NORMAL).build();
        append(id, "INFO", "Waiting for the configured health URL to respond.");
        long deadline = System.nanoTime() + Duration.ofMinutes(2).toNanos();
        while (System.nanoTime() < deadline) {
            try {
                HttpResponse<Void> response = client.send(HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(5)).GET().build(), HttpResponse.BodyHandlers.discarding());
                if (response.statusCode() >= 200 && response.statusCode() < 400) return;
            } catch (Exception ignored) { }
            Thread.sleep(2000);
        }
        throw new IllegalStateException("Application did not pass its health check within two minutes.");
    }

    private String run(List<String> command, Path directory, Duration timeout, Consumer<String> output) throws Exception {
        return run(new ProcessBuilder(command).redirectErrorStream(true), directory, timeout, output);
    }

    private String run(ProcessBuilder builder, Path directory, Duration timeout, Consumer<String> output) throws Exception {
        if (directory != null) builder.directory(directory.toFile());
        Process process = builder.start();
        StringBuilder captured = new StringBuilder();
        CompletableFuture<Void> reader = CompletableFuture.runAsync(() -> {
            try (BufferedReader input = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = input.readLine()) != null) {
                    String limited = line.length() > 2000 ? line.substring(0, 2000) : line;
                    synchronized (captured) { captured.append(limited).append('\n'); }
                    output.accept(limited);
                }
            } catch (IOException ignored) { }
        });
        if (!process.waitFor(timeout.toMillis(), TimeUnit.MILLISECONDS)) {
            process.descendants().forEach(ProcessHandle::destroyForcibly);
            process.destroyForcibly();
            throw new IllegalStateException("Command timed out: " + commandName(builder));
        }
        reader.get(10, TimeUnit.SECONDS);
        if (process.exitValue() != 0) {
            String details;
            synchronized (captured) {
                String[] lines = captured.toString().strip().split("\\R");
                int start = Math.max(0, lines.length - 6);
                details = String.join(" | ", java.util.Arrays.copyOfRange(lines, start, lines.length));
            }
            throw new IllegalStateException(commandName(builder) + " failed (exit " + process.exitValue() + ")" +
                    (details.isBlank() ? "." : ": " + details));
        }
        synchronized (captured) { return captured.toString(); }
    }

    private String commandName(ProcessBuilder builder) {
        List<String> command = builder.command();
        return command.isEmpty() ? "Process" : command.get(0);
    }

    private Deployment requireDeployment(UUID id) {
        return deployments.findByDeploymentId(id).orElseThrow(() -> new IllegalStateException("Deployment record was not found."));
    }

    private void updateStatus(UUID id, DeploymentStatus status, String failure, LocalDateTime finishedAt) {
        Deployment deployment = requireDeployment(id);
        deployment.setStatus(status);
        deployment.setFailureSummary(failure);
        if (finishedAt != null) deployment.setFinishedAt(finishedAt);
        deployments.save(deployment);
        streamService.publishStatus(id, DeploymentStatusResponse.from(deployment));
    }

    private void updateApplicationUrl(UUID id, String containerId, String applicationUrl) {
        Deployment deployment = requireDeployment(id);
        deployment.setContainerId(containerId);
        deployment.setApplicationUrl(applicationUrl);
        deployments.save(deployment);
        streamService.publishStatus(id, DeploymentStatusResponse.from(deployment));
    }

    private void append(UUID id, String level, String message) {
        Deployment deployment = requireDeployment(id);
        logs.append(deployment, level, message);
    }

    private String safeFailureMessage(Exception exception) {
        String message = exception.getMessage();
        if (message == null || message.isBlank()) message = "Local Docker deployment failed.";
        message = message.replaceAll("(?i)(authorization: basic )\\S+", "$1[redacted]");
        return message.length() > 1900 ? message.substring(0, 1900) : message;
    }

    private void deleteWorkspace(Path workspace) {
        try (Stream<Path> files = Files.walk(workspace)) {
            files.sorted(java.util.Comparator.reverseOrder()).forEach(path -> {
                try { Files.deleteIfExists(path); } catch (IOException ignored) { }
            });
        } catch (IOException ignored) { }
    }
}
