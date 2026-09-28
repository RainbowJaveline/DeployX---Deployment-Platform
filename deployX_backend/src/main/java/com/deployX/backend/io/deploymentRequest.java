package com.deployX.backend.io;

import lombok.Data;

@Data
public class deploymentRequest {
    private String source;
    private String owner;
    private String repository;
    private String branch;
    private String repositoryUrl;
}
