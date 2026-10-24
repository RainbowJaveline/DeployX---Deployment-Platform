package com.deployX.backend.Service;

import com.deployX.backend.Repository.UserRepository;
import com.deployX.backend.io.*;
import com.deployX.backend.modules.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import com.deployX.backend.Repository.DeploymentRepository;
import com.deployX.backend.modules.Deployment;
import com.deployX.backend.Enum.DeploymentStatus;
import java.util.UUID;
import com.deployX.backend.io.DeploymentCreationResponse;

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
                contents
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

        for (GithubTreeItemDto item : content) {
        }


        // ---------------------------------------
        // 8. Build analysis
        // ---------------------------------------

        return buildAnalysis(
                repository,
                branch,
                content
        );
    }

    // =========================================================
    // BUILD ANALYSIS RESPONSE
    // =========================================================

    private deploymentResponse buildAnalysis(
            GithubRepositoryDTO repository,
            String branch,
            List<GithubTreeItemDto> content
    ) {

        String language =
                repository.getLanguage();

        if (language == null ||
                language.isBlank()) {

            language = "UNKNOWN";
        }
        boolean Dockerfile = false;
        boolean json = false;
        boolean pom = false;
        boolean requirements = false;
        for(GithubTreeItemDto contentDto : content){
            if (contentDto.getPath().endsWith("/pom.xml")
                    || contentDto.getPath().equals("pom.xml")) {
                pom = true;
            }
            if (contentDto.getPath().endsWith("/package.json")
                    || contentDto.getPath().equals("package.json")) {
                json = true;
            }

            if (contentDto.getPath().endsWith("/Dockerfile")
                    || contentDto.getPath().equals("Dockerfile")) {
                Dockerfile = true;
            }

            if (contentDto.getPath().endsWith("/requirements.txt")
                    || contentDto.getPath().equals("requirements.txt")) {
                requirements = true;
            }
        }

        /*
         * At this stage we are only using the information
         * returned by GitHub repository metadata.
         *
         * We will later inspect the repository files
         * to detect:
         *
         * - pom.xml
         * - package.json
         * - requirements.txt
         * - Dockerfile
         * - etc.
         */

        return deploymentResponse.builder()
                .owner(extractOwner(repository.getFullName()))
                .repository(repository.getName())
                .branch(branch)
                .language(language)
                .projectType(detectProjectType(language,content))
                .components(detectComponents(content))
                .dockerfilePresent(Dockerfile)
                .packageJsonPresent(json)
                .pomXmlPresent(pom)
                .requirementsTxtPresent(requirements)
                .build();
    }


    private List<DeploymentComponentDto> detectComponents(
            List<GithubTreeItemDto> content
    ) {
        Map<String, ComponentInfo> components =
                new LinkedHashMap<>();

        for (GithubTreeItemDto item : content) {

            String path = item.getPath();

            if (path == null || path.isBlank()) {
                continue;
            }

            String fileName = path.substring(
                    path.lastIndexOf("/") + 1
            );

            String directory = getTopLevelDirectory(path);

            switch (fileName) {

                case "pom.xml" -> {
                    ComponentInfo component =
                            components.computeIfAbsent(
                                    directory,
                                    key -> new ComponentInfo()
                            );

                    component.hasMaven = true;
                }

                case "build.gradle",
                     "build.gradle.kts" -> {
                    ComponentInfo component =
                            components.computeIfAbsent(
                                    directory,
                                    key -> new ComponentInfo()
                            );

                    component.hasGradle = true;
                }

                case "package.json" -> {
                    ComponentInfo component =
                            components.computeIfAbsent(
                                    directory,
                                    key -> new ComponentInfo()
                            );

                    component.hasNode = true;
                }

                case "requirements.txt",
                     "pyproject.toml" -> {
                    ComponentInfo component =
                            components.computeIfAbsent(
                                    directory,
                                    key -> new ComponentInfo()
                            );

                    component.hasPython = true;
                }

                case "go.mod" -> {
                    ComponentInfo component =
                            components.computeIfAbsent(
                                    directory,
                                    key -> new ComponentInfo()
                            );

                    component.hasGo = true;
                }

                case "Cargo.toml" -> {
                    ComponentInfo component =
                            components.computeIfAbsent(
                                    directory,
                                    key -> new ComponentInfo()
                            );

                    component.hasRust = true;
                }
            }
        }

        return components.entrySet()
                .stream()
                .map(entry ->
                        buildComponent(
                                entry.getKey(),
                                entry.getValue()
                        )
                )
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
            ComponentInfo info
    ) {
        String type = "UNKNOWN";
        String buildTool = "UNKNOWN";

        if (info.hasMaven) {
            type = "JAVA";
            buildTool = "MAVEN";
        }
        else if (info.hasGradle) {
            type = "JAVA";
            buildTool = "GRADLE";
        }
        else if (info.hasNode) {
            type = "NODE";
            buildTool = "NPM";
        }
        else if (info.hasPython) {
            type = "PYTHON";
            buildTool = "PYTHON";
        }
        else if (info.hasGo) {
            type = "GO";
            buildTool = "GO_MODULES";
        }
        else if (info.hasRust) {
            type = "RUST";
            buildTool = "CARGO";
        }

        BuildConfiguration buildConfiguration = buildConfigurationService
                .getBuildConfiguration(type,buildTool);

        String name = path.isBlank()
                ? "root"
                : path;

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


    public DeploymentCreationResponse createDeployment(
            String email,
            deploymentRequest request) {

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

        // Analyze and validate the repository using existing logic.
        deploymentResponse analysis =
                analyzeRepository(email, request);

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

        Deployment deployment = Deployment.builder()
                .deploymentId(java.util.UUID.randomUUID())
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
        private boolean hasNode;
        private boolean hasPython;
        private boolean hasGo;
        private boolean hasRust;
    }


}