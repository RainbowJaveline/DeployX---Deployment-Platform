package com.deployX.backend.Service;

import com.deployX.backend.io.GithubRepositoryDTO;
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