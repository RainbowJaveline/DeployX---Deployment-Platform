package com.deployX.backend.io;

import lombok.Data;

@Data
public class DeploymentEnvironmentVariableInput {
    private String name;
    private String value;
    private boolean secret;
    private boolean stored;
}
