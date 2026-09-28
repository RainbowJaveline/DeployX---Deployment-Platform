package com.deployX.backend.io;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DeploymentComponentDto {
    private String name;

    private String path;

    private String type;

    private String buildTool;

    private String buildCommand;
    private String outputDirectory;
}
