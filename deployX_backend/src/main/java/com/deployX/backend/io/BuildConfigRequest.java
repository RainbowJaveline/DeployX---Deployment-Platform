
package com.deployX.backend.io;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BuildConfigRequest {

    // JAVA, NODEJS, PYTHON, GO
    private String runtime;

    // AUTO, DOCKERFILE, BUILD_PACK
    private String buildStrategy = "AUTO";

    // Common settings
    @Size(max = 200)
    private String dockerfilePath;

    @Min(1)
    @Max(65535)
    private Integer applicationPort;

    @Size(max = 200)
    private String healthCheckPath;

    // Resource limits
    @Min(1)
    @Max(64)
    private Integer cpuCores;

    @Min(128)
    @Max(65536)
    private Integer memoryMb;

    // Runtime-specific configuration
    @Valid
    private JavaBuildConfig javaConfig;

    @Valid
    private NodeBuildConfig nodeConfig;

    @Valid
    private PythonBuildConfig pythonConfig;

    @Valid
    private GoBuildConfig goConfig;
}
