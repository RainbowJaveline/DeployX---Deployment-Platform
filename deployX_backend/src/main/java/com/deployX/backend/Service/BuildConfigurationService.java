package com.deployX.backend.Service;

import com.deployX.backend.io.BuildConfiguration;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class BuildConfigurationService {

    /**
     * Generates a build configuration using information discovered
     * from the repository.
     *
     * @param type             Detected project type
     * @param buildTool        Detected build tool
     * @param manifestFiles    Files found in the component directory
     * @param packageScripts   Scripts found in package.json
     * @return Generated build configuration
     */
    public BuildConfiguration getBuildConfiguration(
            String type,
            String buildTool,
            Map<String, Boolean> manifestFiles,
            Map<String, String> packageScripts
    ) {

        if (type == null) {
            return unsupportedConfiguration();
        }

        String normalizedType = type.trim().toUpperCase();
        String normalizedBuildTool =
                buildTool == null ? "" : buildTool.trim().toUpperCase();

        manifestFiles = manifestFiles == null
                ? Map.of()
                : manifestFiles;

        packageScripts = packageScripts == null
                ? Map.of()
                : packageScripts;

        // Prefer an existing Dockerfile when the caller has detected it.
        if (Boolean.TRUE.equals(manifestFiles.get("Dockerfile"))) {
            return BuildConfiguration.builder()
                    .buildCommand("docker build")
                    .outputDirectory(null)
                    .build();
        }

        switch (normalizedType) {

            case "JAVA":

                if ("MAVEN".equals(normalizedBuildTool)
                        && Boolean.TRUE.equals(manifestFiles.get("mvnw"))) {

                    return BuildConfiguration.builder()
                            .buildCommand("./mvnw clean package")
                            .outputDirectory("target")
                            .build();
                }

                if ("MAVEN".equals(normalizedBuildTool)
                        && Boolean.TRUE.equals(manifestFiles.get("pom.xml"))) {

                    return BuildConfiguration.builder()
                            .buildCommand("mvn clean package")
                            .outputDirectory("target")
                            .build();
                }

                if ("GRADLE".equals(normalizedBuildTool)
                        && Boolean.TRUE.equals(manifestFiles.get("gradlew"))) {

                    return BuildConfiguration.builder()
                            .buildCommand("./gradlew build")
                            .outputDirectory("build/libs")
                            .build();
                }

                if ("GRADLE".equals(normalizedBuildTool)
                        && (Boolean.TRUE.equals(manifestFiles.get("build.gradle"))
                        || Boolean.TRUE.equals(manifestFiles.get("build.gradle.kts")))) {

                    return BuildConfiguration.builder()
                            .buildCommand("gradle build")
                            .outputDirectory("build/libs")
                            .build();
                }

                return unsupportedConfiguration();

            case "NODE":

                if (!"NPM".equals(normalizedBuildTool)
                        && !"YARN".equals(normalizedBuildTool)
                        && !"PNPM".equals(normalizedBuildTool)) {

                    return unsupportedConfiguration();
                }

                String buildScript = packageScripts.get("build");

                if (buildScript != null && !buildScript.isBlank()) {
                    String command = switch (normalizedBuildTool) {
                        case "YARN" -> "yarn build";
                        case "PNPM" -> "pnpm build";
                        default -> "npm run build";
                    };

                    return BuildConfiguration.builder()
                            .buildCommand(command)
                            .outputDirectory(null)
                            .build();
                }

                String startScript = packageScripts.get("start");

                if (startScript != null && !startScript.isBlank()) {
                    String command = switch (normalizedBuildTool) {
                        case "YARN" -> "yarn start";
                        case "PNPM" -> "pnpm start";
                        default -> "npm start";
                    };

                    return BuildConfiguration.builder()
                            .buildCommand(command)
                            .outputDirectory(null)
                            .build();
                }

                return unsupportedConfiguration();

            case "PYTHON":

                if (Boolean.TRUE.equals(manifestFiles.get("requirements.txt"))) {

                    return BuildConfiguration.builder()
                            .buildCommand("pip install -r requirements.txt")
                            .outputDirectory(null)
                            .build();
                }

                if (Boolean.TRUE.equals(manifestFiles.get("pyproject.toml"))) {

                    return BuildConfiguration.builder()
                            .buildCommand("pip install .")
                            .outputDirectory(null)
                            .build();
                }

                return unsupportedConfiguration();

            case "GO":

                if (Boolean.TRUE.equals(manifestFiles.get("go.mod"))) {

                    return BuildConfiguration.builder()
                            .buildCommand("go build ./...")
                            .outputDirectory(null)
                            .build();
                }

                return unsupportedConfiguration();

            // NEW: Rust project support
            case "RUST":

                if ("CARGO".equals(normalizedBuildTool)
                        && Boolean.TRUE.equals(manifestFiles.get("Cargo.toml"))) {

                    return BuildConfiguration.builder()
                            .buildCommand("cargo build --release")
                            .outputDirectory("target/release")
                            .build();
                }

                return unsupportedConfiguration();

            default:
                return unsupportedConfiguration();
        }

    }

    /**
     * Compatibility overload for existing callers.
     *
     * This method cannot verify repository files or scripts, so it should
     * only be used until callers are migrated to the metadata-aware method.
     */
    @Deprecated
    public BuildConfiguration getBuildConfiguration(
            String type,
            String buildTool
    ) {

        if (type == null) {
            return unsupportedConfiguration();
        }

        if ("JAVA".equalsIgnoreCase(type)
                && "MAVEN".equalsIgnoreCase(buildTool)) {

            return BuildConfiguration.builder()
                    .buildCommand("./mvnw clean package")
                    .outputDirectory("target")
                    .build();
        }

        if ("JAVA".equalsIgnoreCase(type)
                && "GRADLE".equalsIgnoreCase(buildTool)) {

            return BuildConfiguration.builder()
                    .buildCommand("./gradlew build")
                    .outputDirectory("build/libs")
                    .build();
        }

        // Do not assume a Node.js build or start script exists.
        if ("NODE".equalsIgnoreCase(type)) {
            return unsupportedConfiguration();
        }

        if ("PYTHON".equalsIgnoreCase(type)) {
            return BuildConfiguration.builder()
                    .buildCommand("pip install -r requirements.txt")
                    .outputDirectory(null)
                    .build();
        }

        return unsupportedConfiguration();
    }

    private BuildConfiguration unsupportedConfiguration() {
        return BuildConfiguration.builder()
                .buildCommand(null)
                .outputDirectory(null)
                .build();
    }
}
