package com.deployX.backend.Service;

import com.deployX.backend.Repository.UserRepository;
import com.deployX.backend.io.*;
import com.deployX.backend.modules.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.deployX.backend.Repository.DeploymentRepository;
import com.deployX.backend.modules.Deployment;
import com.deployX.backend.Enum.DeploymentStatus;
import java.util.UUID;
import com.deployX.backend.io.DeploymentCreationResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.LinkedHashMap;
import java.util.Map;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DeploymentService {

    private final UserRepository userRepository;
    private final GithubService githubService;
    private final BuildConfigurationService buildConfigurationService;
    private final DeploymentRepository deploymentRepository;
    private final EnvironmentVariableService environmentVariableService;
//    private final ObjectMapper objectMapper;


    public deploymentResponse analyzeRepository(
            String email,
            deploymentRequest request
    ) {

        // ---------------------------------------
        // 1. Find the currently logged-in user
        // ---------------------------------------

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "User not found"
                        )
                );


        // ---------------------------------------
        // 2. Validate source
        // ---------------------------------------

        if (request.getSource() == null ||
                request.getSource().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Repository source is required"
            );
        }


        String source = request.getSource().trim().toUpperCase();


        // =======================================
        // SOURCE 1: CONNECTED GITHUB ACCOUNT
        // =======================================

        if (source.equals("GITHUB")) {

            return analyzeConnectedGithubRepository(
                    user,
                    request
            );
        }


        // =======================================
        // SOURCE 2: MANUAL GITHUB URL
        // =======================================

        if (source.equals("URL")) {

            return analyzeGithubUrl(
                    user,
                    request
            );
        }


        // ---------------------------------------
        // Invalid source
        // ---------------------------------------

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Invalid repository source. Use GITHUB or URL"
        );
    }


    // =========================================================
    // CONNECTED GITHUB ACCOUNT FLOW
    // =========================================================

    private deploymentResponse analyzeConnectedGithubRepository(
            User user,
            deploymentRequest request
    ) {

        // ---------------------------------------
        // 1. Make sure GitHub is connected
        // ---------------------------------------

        String accessToken = user.getGithubAccessToken();

        if (accessToken == null ||
                accessToken.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "GitHub account is not connected"
            );
        }


        // ---------------------------------------
        // 2. Validate repository information
        // ---------------------------------------

        if (request.getOwner() == null ||
                request.getOwner().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Repository owner is required"
            );
        }

        if (request.getRepository() == null ||
                request.getRepository().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Repository name is required"
            );
        }


        // ---------------------------------------
        // 3. Get branch
        // ---------------------------------------

        String branch = request.getBranch();

        if (branch == null ||
                branch.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Repository branch is required"
            );
        }


        // ---------------------------------------
        // 4. Ask GitHub for repository details
        // ---------------------------------------

        GithubRepositoryDTO repository =
                githubService.getRepository(
                        request.getOwner(),
                        request.getRepository(),
                        accessToken
                );

        List<GithubTreeItemDto> contents =
                githubService.getRepositoryTree(
                        request.getOwner(),
                        request.getRepository(),
                        branch,
                        accessToken
                );

        // ---------------------------------------
        // 5. Build analysis
        // ---------------------------------------

        return buildAnalysis(
                repository,
                branch,
                contents,
                request.getOwner(),
                request.getRepository(),
                accessToken
        );
    }


    // =========================================================
// MANUAL GITHUB URL FLOW
// =========================================================

    private deploymentResponse analyzeGithubUrl(
            User user,
            deploymentRequest request
    ) {

        // ---------------------------------------
        // 1. Get GitHub access token
        // ---------------------------------------

        String accessToken =
                user.getGithubAccessToken();

        if (accessToken == null || accessToken.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "GitHub account is not connected"
            );
        }

        // ---------------------------------------
        // 2. Validate URL
        // ---------------------------------------

        if (request.getRepositoryUrl() == null ||
                request.getRepositoryUrl().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "GitHub repository URL is required"
            );
        }


        // ---------------------------------------
        // 3. Extract owner + repository
        // ---------------------------------------

        GithubTarget target =
                parseGithubUrl(
                        request.getRepositoryUrl()
                );


        // ---------------------------------------
        // 4. Get repository information
        //
        // Now using the authenticated user's
        // GitHub access token.
        // ---------------------------------------

        GithubRepositoryDTO repository =
                githubService.getRepository(
                        target.owner(),
                        target.repository(),
                        accessToken
                );


        // ---------------------------------------
        // 5. GitHub gives us the default branch
        // ---------------------------------------

        String branch =
                repository.getDefaultBranch();


        // ---------------------------------------
        // 6. Get repository tree
        // ---------------------------------------

        List<GithubTreeItemDto> content =
                githubService.getRepositoryTree(
                        target.owner(),
                        target.repository(),
                        branch,
                        accessToken
                );


        // ---------------------------------------
        // 7. Debug repository tree
        // ---------------------------------------

        // ---------------------------------------
        // 8. Build analysis
        // ---------------------------------------

        return buildAnalysis(
                repository,
                branch,
                content,
                target.owner(),
                target.repository(),
                accessToken
        );
    }

    // =========================================================
    // BUILD ANALYSIS RESPONSE
    // =========================================================

    private deploymentResponse buildAnalysis(
            GithubRepositoryDTO repository,
            String branch,
            List<GithubTreeItemDto> content,
            String owner,
            String repositoryName,
            String accessToken
    ) {

        Map<String, Map<String, String>> scriptsByPath =
                extractPackageScripts(
                        owner,
                        repositoryName,
                        branch,
                        accessToken,
                        content
                );

        String language =
                repository.getLanguage();

        if (language == null ||
                language.isBlank()) {

            language = "UNKNOWN";
        }
        boolean dockerfilePresent = false;
        boolean packageJsonPresent = false;
        boolean pomXmlPresent = false;
        boolean requirementsTxtPresent = false;

        if (content != null) {
            for (GithubTreeItemDto item : content) {
                if (item == null || item.getPath() == null) {
                    continue;
                }

                String path = item.getPath().replace('\\', '/');

                if (path.equals("Dockerfile") || path.endsWith("/Dockerfile")) {
                    dockerfilePresent = true;
                }

                if (path.equals("package.json") || path.endsWith("/package.json")) {
                    packageJsonPresent = true;
                }

                if (path.equals("pom.xml") || path.endsWith("/pom.xml")) {
                    pomXmlPresent = true;
                }

                if (path.equals("requirements.txt")
                        || path.endsWith("/requirements.txt")) {
                    requirementsTxtPresent = true;
                }
            }
        }


        return deploymentResponse.builder()
                .owner(extractOwner(repository.getFullName()))
                .repository(repository.getName())
                .branch(branch)
                .language(language)
                .projectType(detectProjectType(language,content))
                .components(detectComponents(content, scriptsByPath))
                .dockerfilePresent(dockerfilePresent)
                .packageJsonPresent(packageJsonPresent)
                .pomXmlPresent(pomXmlPresent)
                .requirementsTxtPresent(requirementsTxtPresent)
                .build();
    }


    private List<DeploymentComponentDto> detectComponents(
            List<GithubTreeItemDto> content,
             Map<String, Map<String, String>> scriptsByPath
    ) {
        Map<String, ComponentInfo> components = new LinkedHashMap<>();

        if (content == null || content.isEmpty()) {
            return List.of();
        }

        for (GithubTreeItemDto item : content) {
            if (item == null) {
                continue;
            }

            String filePath = item.getPath();

            if (filePath == null || filePath.isBlank()) {
                continue;
            }

            // Normalize separators to make path handling consistent.
            filePath = filePath.replace('\\', '/');

            // Remove leading and trailing separators.
            filePath = filePath.replaceAll("^/+|/+$", "");

            if (filePath.isBlank()) {
                continue;
            }

            int lastSlash = filePath.lastIndexOf('/');
            String fileName = filePath.substring(lastSlash + 1);

            // Use the manifest's parent directory as the component path.
            String directory = lastSlash < 0
                    ? ""
                    : filePath.substring(0, lastSlash);

            // Ignore files that do not define a component.
            boolean recognized = switch (fileName) {
                case "pom.xml",
                     "build.gradle",
                     "build.gradle.kts",
                     "package.json",
                     "requirements.txt",
                     "pyproject.toml",
                     "go.mod",
                     "Cargo.toml",
                     "Dockerfile",
                     "mvnw",
                     "gradlew" -> true;

                default -> false;
            };

            if (!recognized) {
                continue;
            }

            // Retrieve the existing component or create it.
            ComponentInfo info = components.computeIfAbsent(
                    directory,
                    key -> new ComponentInfo()
            );

            // Record the detected manifest or build file.
            switch (fileName) {
                case "pom.xml" -> info.hasMaven = true;

                case "build.gradle" -> info.hasGradle = true;

                case "build.gradle.kts" -> {
                    info.hasGradle = true;
                    info.hasGradleKotlin = true;
                }

                case "package.json" -> info.hasNode = true;

                case "requirements.txt" -> {
                    info.hasPython = true;
                    info.hasRequirements = true;
                }

                case "pyproject.toml" -> {
                    info.hasPython = true;
                    info.hasPyProject = true;
                }

                case "go.mod" -> info.hasGo = true;

                case "Cargo.toml" -> info.hasRust = true;

                case "Dockerfile" -> info.hasDockerfile = true;

                case "mvnw" -> info.hasMavenWrapper = true;

                case "gradlew" -> info.hasGradleWrapper = true;
            }
        }

        return components.entrySet()
                .stream()
                .map(entry -> buildComponent(
                        entry.getKey(),
                        entry.getValue(),
                        scriptsByPath.getOrDefault(
                                entry.getKey(),
                                Map.of()
                        ),
                        content
                ))
                .toList();
    }



    private String getTopLevelDirectory(String path) {

        int slashIndex = path.indexOf("/");

        if (slashIndex == -1) {
            return "";
        }

        return path.substring(0, slashIndex);
    }


    private DeploymentComponentDto buildComponent(
            String path,
            ComponentInfo info,
            Map<String, String> packageScripts,
            List<GithubTreeItemDto> content
    ) {
        String type = "UNKNOWN";
        String buildTool = "UNKNOWN";

        // Determine the component type and build tool.
        if (info.hasMaven && info.hasGradle) {
            // Both Java build systems exist in this directory.
            // Do not silently choose one.
            type = "JAVA";
            buildTool = "AMBIGUOUS";
        } else if (info.hasMaven) {
            type = "JAVA";
            buildTool = "MAVEN";
        } else if (info.hasGradle) {
            type = "JAVA";
            buildTool = "GRADLE";
        } else if (info.hasNode) {
            type = "NODE";
            buildTool = detectNodePackageManager(path, content);
        } else if (info.hasPython) {
            type = "PYTHON";
            buildTool = "PYTHON";
        } else if (info.hasGo) {
            type = "GO";
            buildTool = "GO_MODULES";
        } else if (info.hasRust) {
            type = "RUST";
            buildTool = "CARGO";
        }

        Map<String, Boolean> manifestFiles = new LinkedHashMap<>();

        manifestFiles.put("pom.xml", info.hasMaven);
        manifestFiles.put("build.gradle",
                info.hasGradle && !info.hasGradleKotlin);
        manifestFiles.put("build.gradle.kts", info.hasGradleKotlin);
        manifestFiles.put("package.json", info.hasNode);
        manifestFiles.put("requirements.txt", info.hasRequirements);
        manifestFiles.put("pyproject.toml", info.hasPyProject);
        manifestFiles.put("go.mod", info.hasGo);
        manifestFiles.put("Cargo.toml", info.hasRust);
        manifestFiles.put("Dockerfile", info.hasDockerfile);
        manifestFiles.put("mvnw", info.hasMavenWrapper);
        manifestFiles.put("gradlew", info.hasGradleWrapper);

        BuildConfiguration buildConfiguration;

        if ("AMBIGUOUS".equals(buildTool)) {
            buildConfiguration = BuildConfiguration.builder()
                    .buildCommand(null)
                    .outputDirectory(null)
                    .build();
        } else {
            buildConfiguration = buildConfigurationService.getBuildConfiguration(
                    type,
                    buildTool,
                    manifestFiles,
                    packageScripts
            );
        }

        String name = path.isBlank() ? "root" : path;

        return DeploymentComponentDto.builder()
                .name(name)
                .path(path)
                .type(type)
                .buildTool(buildTool)
                .buildConfiguration(buildConfiguration)
                .build();
    }


    // =========================================================
    // PROJECT TYPE DETECTION
    // =========================================================

    private String detectProjectType(
            String language,
            List<GithubTreeItemDto> content
    ) {
        boolean hasPackageJson = false;
        boolean hasJavaBuild = false;
        boolean hasPythonBuild = false;
        boolean hasGoModule = false;
        boolean hasCargo = false;

        for (GithubTreeItemDto item : content) {

            String path = item.getPath();

            if (path == null) {
                continue;
            }

            String fileName = path.substring(
                    path.lastIndexOf("/") + 1
            );

            switch (fileName) {

                case "package.json" ->
                        hasPackageJson = true;

                case "pom.xml",
                     "build.gradle",
                     "build.gradle.kts" ->
                        hasJavaBuild = true;

                case "requirements.txt",
                     "pyproject.toml" ->
                        hasPythonBuild = true;

                case "go.mod" ->
                        hasGoModule = true;

                case "Cargo.toml" ->
                        hasCargo = true;
            }
        }

        /*
         * Multiple major ecosystems detected.
         */
        if (hasPackageJson && hasJavaBuild) {
            return "FULL_STACK";
        }

        /*
         * Single ecosystem detection.
         */
        if (hasJavaBuild) {
            return "JAVA";
        }

        if (hasPackageJson) {
            return "NODE";
        }

        if (hasPythonBuild) {
            return "PYTHON";
        }

        if (hasGoModule) {
            return "GO";
        }

        if (hasCargo) {
            return "RUST";
        }

        /*
         * Fall back to GitHub's language.
         */
        return detectProjectTypeFromLanguage(language);
    }

    private String detectProjectTypeFromLanguage(
            String language
    ) {
        if (language == null || language.isBlank()) {
            return "UNKNOWN";
        }

        return switch (language.toLowerCase()) {
            case "java" -> "JAVA";
            case "javascript",
                 "typescript" -> "NODE";
            case "python" -> "PYTHON";
            case "c++" -> "CPP";
            case "c" -> "C";
            case "go" -> "GO";
            case "rust" -> "RUST";
            case "ruby" -> "RUBY";
            case "php" -> "PHP";
            default -> "UNKNOWN";
        };
    }


    // =========================================================
    // BUILD TOOL DETECTION
    // =========================================================

//    private String detectBuildTool(
//            List<GithubTreeItemDto> content
//    ) {
//        boolean hasMaven = false;
//        boolean hasGradle = false;
//        boolean hasNode = false;
//        boolean hasPythonRequirements = false;
//        boolean hasPythonProject = false;
//        boolean hasGo = false;
//        boolean hasRust = false;
//        boolean hasPhp = false;
//        boolean hasRuby = false;
//
//        for (GithubTreeItemDto item : content) {
//
//            String path = item.getPath();
//
//            if (path == null) {
//                continue;
//            }
//
//            String fileName = path.substring(
//                    path.lastIndexOf("/") + 1
//            );
//
//            switch (fileName) {
//
//                case "pom.xml" ->
//                        hasMaven = true;
//
//                case "build.gradle",
//                     "build.gradle.kts" ->
//                        hasGradle = true;
//
//                case "package.json" ->
//                        hasNode = true;
//
//                case "requirements.txt" ->
//                        hasPythonRequirements = true;
//
//                case "pyproject.toml" ->
//                        hasPythonProject = true;
//
//                case "go.mod" ->
//                        hasGo = true;
//
//                case "Cargo.toml" ->
//                        hasRust = true;
//
//                case "composer.json" ->
//                        hasPhp = true;
//
//                case "Gemfile" ->
//                        hasRuby = true;
//            }
//        }
//
//        if (hasMaven && hasGradle) {
//            return "MAVEN_AND_GRADLE";
//        }
//
//        if (hasMaven) {
//            return "MAVEN";
//        }
//
//        if (hasGradle) {
//            return "GRADLE";
//        }
//
//        if (hasNode) {
//            return "NPM";
//        }
//
//        if (hasPythonRequirements) {
//            return "PIP";
//        }
//
//        if (hasPythonProject) {
//            return "PYPROJECT";
//        }
//
//        if (hasGo) {
//            return "GO_MODULES";
//        }
//
//        if (hasRust) {
//            return "CARGO";
//        }
//
//        if (hasPhp) {
//            return "COMPOSER";
//        }
//
//        if (hasRuby) {
//            return "BUNDLER";
//        }
//
//        return "UNKNOWN";
//    }

    // =========================================================
    // GITHUB URL PARSER
    // =========================================================

    private GithubTarget parseGithubUrl(
            String repositoryUrl
    ) {

        try {

            URI uri =
                    URI.create(
                            repositoryUrl.trim()
                    );


            // ---------------------------------------
            // Only HTTPS GitHub URLs
            // ---------------------------------------

            if (!"https".equalsIgnoreCase(
                    uri.getScheme()
            )) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Only HTTPS GitHub URLs are supported"
                );
            }


            // ---------------------------------------
            // Only github.com
            // ---------------------------------------

            if (!"github.com".equalsIgnoreCase(
                    uri.getHost()
            )) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Only GitHub repository URLs are supported"
                );
            }


            // ---------------------------------------
            // Extract path
            // ---------------------------------------

            String path =
                    uri.getPath();

            if (path == null ||
                    path.isBlank()) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid GitHub repository URL"
                );
            }


            // Remove leading/trailing /
            path =
                    path.replaceAll(
                            "^/+|/+$",
                            ""
                    );


            String[] parts =
                    path.split("/");


            // We currently support:
            //
            // https://github.com/owner/repository
            //
            // Not:
            //
            // /owner/repository/issues
            // /owner/repository/tree/main
            // etc.

            if (parts.length != 2) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Use a GitHub repository URL like https://github.com/owner/repository"
                );
            }


            String owner =
                    parts[0];

            String repository =
                    parts[1];


            // ---------------------------------------
            // Handle .git URLs
            // ---------------------------------------

            if (repository.endsWith(".git")) {

                repository =
                        repository.substring(
                                0,
                                repository.length() - 4
                        );
            }


            if (owner.isBlank() ||
                    repository.isBlank()) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid GitHub repository URL"
                );
            }


            return new GithubTarget(
                    owner,
                    repository
            );

        } catch (IllegalArgumentException e) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid GitHub repository URL"
            );
        }
    }


    // =========================================================
    // EXTRACT OWNER
    // =========================================================

    private String extractOwner(
            String fullName
    ) {

        if (fullName == null ||
                fullName.isBlank()) {

            return "UNKNOWN";
        }

        String[] parts =
                fullName.split("/");

        return parts.length > 0
                ? parts[0]
                : "UNKNOWN";
    }


    @Transactional
    public DeploymentCreationResponse createDeployment(
            String email,
            deploymentRequest request
    ) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "User not found"
                        )
                );

        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Deployment request is required"
            );
        }

        // Step 1: Analyze and validate the repository.
        deploymentResponse analysis =
                analyzeRepository(email, request);

        // Step 2: Determine the repository URL.
        String repositoryUrl;

        if (request.getSource() != null
                && request.getSource().trim().equalsIgnoreCase("URL")) {

            repositoryUrl = request.getRepositoryUrl().trim();

        } else {
            repositoryUrl = "https://github.com/"
                    + analysis.getOwner()
                    + "/"
                    + analysis.getRepository();
        }

        // Step 3: Create the deployment record.
        Deployment deployment = Deployment.builder()
                .deploymentId(UUID.randomUUID())
                .repositoryOwner(analysis.getOwner())
                .repositoryName(analysis.getRepository())
                .repositoryUrl(repositoryUrl)
                .branch(analysis.getBranch())
                .projectType(analysis.getProjectType())
                .componentPath(request.getComponentPath())
                .status(DeploymentStatus.CREATED)
                .user(user)
                .build();

        Deployment savedDeployment =
                deploymentRepository.save(deployment);

        // Step 4: Save environment variables if supplied.
        if (request.getEnvironmentVariables() != null
                && !request.getEnvironmentVariables().isEmpty()) {

            environmentVariableService.replaceVariable(
                    email,
                    savedDeployment.getDeploymentId(),
                    request.getEnvironmentVariables()
            );
        }

        // Step 5: Return the deployment creation response.
        return DeploymentCreationResponse.builder()
                .deploymentId(savedDeployment.getDeploymentId())
                .status(savedDeployment.getStatus().name())
                .createdAt(savedDeployment.getCreatedAt())
                .build();
    }

    // =========================================================
    // INTERNAL RECORD
    // =========================================================

    private record GithubTarget(
            String owner,
            String repository
    ) {
    }

    private static class ComponentInfo {

        private boolean hasMaven;
        private boolean hasGradle;
        private boolean hasGradleKotlin;
        private boolean hasNode;
        private boolean hasPython;
        private boolean hasRequirements;
        private boolean hasPyProject;
        private boolean hasGo;
        private boolean hasRust;
        private boolean hasDockerfile;
        private boolean hasMavenWrapper;
        private boolean hasGradleWrapper;
    }

    private Map<String, Map<String, String>> extractPackageScripts(
            String owner,
            String repository,
            String branch,
            String accessToken,
            List<GithubTreeItemDto> content
    ) {
        Map<String, Map<String, String>> scriptsByPath =
                new LinkedHashMap<>();

        if (content == null || content.isEmpty()) {
            return scriptsByPath;
        }

        for (GithubTreeItemDto item : content) {
            if (item == null || item.getPath() == null) {
                continue;
            }

            String filePath = item.getPath()
                    .replace('\\', '/')
                    .replaceAll("^/+|/+$", "");

            if (filePath.isBlank()) {
                continue;
            }

            String fileName = filePath.substring(
                    filePath.lastIndexOf('/') + 1
            );

            if (!"package.json".equals(fileName)) {
                continue;
            }

            String directory = filePath.contains("/")
                    ? filePath.substring(
                    0,
                    filePath.lastIndexOf('/')
            )
                    : "";

            String fileContent = githubService.getRepositoryFileContent(
                    owner,
                    repository,
                    branch,
                    filePath,
                    accessToken
            );

            try {
                JsonNode root = new ObjectMapper().readTree(fileContent);
                JsonNode scriptsNode = root.get("scripts");

                Map<String, String> scripts = new LinkedHashMap<>();

                if (scriptsNode != null && scriptsNode.isObject()) {
                    scriptsNode.fields().forEachRemaining(entry -> {
                        if (entry.getValue().isTextual()) {
                            scripts.put(
                                    entry.getKey(),
                                    entry.getValue().asText()
                            );
                        }
                    });
                }

                scriptsByPath.put(directory, scripts);

            } catch (Exception e) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Unable to parse package.json: " + filePath,
                        e
                );
            }
        }

        return scriptsByPath;
    }


    private String detectNodePackageManager(
            String directory,
            List<GithubTreeItemDto> content
    ) {
        boolean hasNpmLock = false;
        boolean hasYarnLock = false;
        boolean hasPnpmLock = false;

        String normalizedDirectory = directory == null ? "" : directory;

        if (content == null) {
            return "NPM";
        }

        for (GithubTreeItemDto item : content) {
            if (item == null || item.getPath() == null) {
                continue;
            }

            String path = item.getPath()
                    .replace('\\', '/')
                    .replaceAll("^/+|/+$", "");

            int lastSlash = path.lastIndexOf('/');
            String fileName = path.substring(lastSlash + 1);
            String parentDirectory = lastSlash < 0
                    ? ""
                    : path.substring(0, lastSlash);

            if (!parentDirectory.equals(normalizedDirectory)) {
                continue;
            }

            switch (fileName) {
                case "package-lock.json" -> hasNpmLock = true;
                case "yarn.lock" -> hasYarnLock = true;
                case "pnpm-lock.yaml" -> hasPnpmLock = true;
            }
        }

        // Prefer an explicit package-manager lockfile.
        if (hasPnpmLock) {
            return "PNPM";
        }

        if (hasYarnLock) {
            return "YARN";
        }

        return "NPM";
    }

}