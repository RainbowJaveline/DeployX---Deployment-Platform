package com.deployX.backend.io;

import lombok.Builder;
import lombok.Data;
import tools.jackson.databind.JsonNode;

import java.util.List;

@Data
@Builder
public class DeploymentConfigurationResponse {
    private String repositoryName;
    private String projectType;
    private String componentPath;
    private tools.jackson.databind.JsonNode configuration;
    private JsonNode buildConfig;
    private List<EnvironmentVariableResponse> environmentVariables;
}
