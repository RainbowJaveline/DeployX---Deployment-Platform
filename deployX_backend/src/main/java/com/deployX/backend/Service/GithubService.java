package com.deployX.backend.Service;

import com.deployX.backend.io.*;
import com.deployX.backend.io.GithubRepositoryDTO;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

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
        GithubRepositoryDTO repositoryDTO = restClient.get()
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
        return repositoryDTO;
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

        if (repositories == null) {
            return List.of();
        }



        return Arrays.asList(repositories);
    }
}