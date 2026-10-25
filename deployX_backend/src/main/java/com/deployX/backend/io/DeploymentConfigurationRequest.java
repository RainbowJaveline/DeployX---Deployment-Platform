package com.deployX.backend.io;

import lombok.Data;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;

@Data
public class DeploymentConfigurationRequest {
    private JsonNode configuration;
    private BuildConfigRequest buildConfig;
    private List<DeploymentEnvironmentVariableInput> environmentVariables = new ArrayList<>();
}
