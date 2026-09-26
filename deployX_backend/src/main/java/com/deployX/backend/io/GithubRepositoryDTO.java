package com.deployX.backend.io;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@AllArgsConstructor
@RequiredArgsConstructor
public class GithubRepositoryDTO {
    private Long id;

    private String name;

    @JsonProperty("full_name")
    private String fullName;

    @JsonProperty("html_url")
    private String htmlUrl;

    private String description;

    private String language;

    @JsonProperty("private")
    private boolean isPrivate;

    @JsonProperty("default_branch")
    private String defaultBranch;
}

