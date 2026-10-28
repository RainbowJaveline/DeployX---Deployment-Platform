package com.deployX.backend.Service;

import com.deployX.backend.exceptions.GitHubReauthRequiredException;
import com.deployX.backend.io.*;
import com.deployX.backend.io.GithubRepositoryDTO;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import java.util.Arrays;
import java.util.List;

@Service
public class GithubService {

    private final RestClient restClient;

    public GithubService() {
        this.restClient = RestClient.builder()
                .baseUrl("https://api.github.com")
                .build();
    }

    public GithubRepositoryDTO getRepository(
            String owner,
            String repository,
            String accessToken
    )
    {
        return restClient.get()
                .uri(uriBuilder ->
                        uriBuilder.path("/repos/{owner}/{repository}")
                                .build(owner , repository))
                .headers(
                        httpHeaders -> {
                            if(accessToken != null && !accessToken.isBlank()) {
                                httpHeaders.setBearerAuth(accessToken);
                            }
                        }
                )
                .retrieve()
                .body(GithubRepositoryDTO.class);
    }

    public List<GithubContentDto> getRepositoryContents(
            String owner,
            String repository,
            String accessToken
    ) {
        // your implementation
        GithubContentDto[] githubContentDto = restClient.get()
                .uri( uriBuilder -> uriBuilder
                        .path("/repos/{owner}/{repository}/contents")
                        .build(owner,repository)
                )
                .headers(httpHeaders -> {
                    if(accessToken!=null && !accessToken.isBlank()){
                        httpHeaders.setBearerAuth(accessToken);
                    }
                })
                .retrieve()
                .body(GithubContentDto[].class);
        if (githubContentDto == null) {
            return List.of();
        }


        return Arrays.asList(githubContentDto);
    }

    public List<GithubTreeItemDto> getRepositoryTree(
            String owner,
            String repository,
            String branch,
            String accessToken
    ) {

        GithubTreeDto response =
                restClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/repos/{owner}/{repository}/git/trees/{branch}")
                                .queryParam("recursive", "true")
                                .build(
                                        owner,
                                        repository,
                                        branch
                                )
                        )
                        .headers(headers -> {

                            headers.set(
                                    HttpHeaders.ACCEPT,
                                    "application/vnd.github+json"
                            );

                            headers.set(
                                    "X-GitHub-Api-Version",
                                    "2026-03-10"
                            );

                            if (accessToken != null &&
                                    !accessToken.isBlank()) {

                                headers.setBearerAuth(accessToken);
                            }
                        })
                        .retrieve()
                        .body(GithubTreeDto.class);

        if (response == null ||
                response.getTree() == null) {

            return List.of();
        }

        return response.getTree();
    }

    public List<GithubRepositoryDTO> getRepositories(String accessToken) {

        try{
        GithubRepositoryDTO[] repositories =
                restClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/user/repos")
                                .queryParam("per_page", 100)
                                .queryParam("sort", "updated")
                                .build())
                        .header(
                                HttpHeaders.AUTHORIZATION,
                                "Bearer " + accessToken
                        )
                        .header(
                                HttpHeaders.ACCEPT,
                                "application/vnd.github+json"
                        )
                        .header(
                                "X-GitHub-Api-Version",
                                "2026-03-10"
                        )
                        .retrieve()
                        .body(GithubRepositoryDTO[].class);

            return repositories == null
                    ? List.of()
                    : Arrays.asList(repositories);
        } catch (RestClientResponseException ex) {
            if(ex.getStatusCode().value() == 401){
                throw new GitHubReauthRequiredException(
                    "Your GitHub connection has expired. Please reconnect your GitHub account.",
                            ex
                );
            }
            throw ex;
        }
    }

    public String getRepositoryFileContent(
            String owner,
            String repository,
            String branch,
            String filePath,
            String accessToken
    ) {
        if (owner == null || owner.isBlank()
                || repository == null || repository.isBlank()
                || branch == null || branch.isBlank()
                || filePath == null || filePath.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Repository owner, repository, branch, and file path are required"
            );
        }

        String normalizedPath = filePath
                .replace('\\', '/')
                .replaceAll("^/+", "");

        if (normalizedPath.isBlank()
                || normalizedPath.contains("//")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid repository file path"
            );
        }

        GithubFileContentDTO response;

        try {
            response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .pathSegment(
                                    "repos",
                                    owner,
                                    repository,
                                    "contents"
                            )
                            .pathSegment(normalizedPath.split("/"))
                            .queryParam("ref", branch)
                            .build()
                    )
                    .headers(headers -> {
                        headers.set(
                                HttpHeaders.ACCEPT,
                                "application/vnd.github+json"
                        );
                        headers.set(
                                "X-GitHub-Api-Version",
                                "2026-03-10"
                        );

                        if (accessToken != null
                                && !accessToken.isBlank()) {
                            headers.setBearerAuth(accessToken);
                        }
                    })
                    .retrieve()
                    .body(GithubFileContentDTO.class);

        } catch (org.springframework.web.client.RestClientResponseException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "GitHub could not retrieve repository file: "
                            + normalizedPath,
                    e
            );
        }

        if (response == null
                || !"file".equalsIgnoreCase(response.getType())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "GitHub did not return a file for path: "
                            + normalizedPath
            );
        }

        if (!"base64".equalsIgnoreCase(response.getEncoding())
                || response.getContent() == null
                || response.getContent().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "GitHub returned missing or unsupported file content for: "
                            + normalizedPath
            );
        }

        try {
            byte[] decodedBytes = Base64.getMimeDecoder()
                    .decode(response.getContent());

            return new String(
                    decodedBytes,
                    StandardCharsets.UTF_8
            );

        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "GitHub returned invalid Base64 content for: "
                            + normalizedPath,
                    e
            );
        }
    }
}