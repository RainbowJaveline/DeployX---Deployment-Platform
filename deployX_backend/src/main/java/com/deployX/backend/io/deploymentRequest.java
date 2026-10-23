
package com.deployX.backend.io;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class deploymentRequest {

    // Existing repository selection fields
    private String source;
    private String owner;
    private String repository;
    private String branch;
    private String repositoryUrl;

    // Selected component inside the repository, if applicable
    private String componentPath;

    // Build and runtime configuration
    @Valid
    private BuildConfigRequest buildConfig;

    // Environment variables for the deployed application
    @Valid
    @Size(max = 100, message = "Maximum 100 environment variables are allowed")
    private List<EnvironmentVariableRequest> environmentVariables =
            new ArrayList<>();
}
