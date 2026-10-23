
package com.deployX.backend.io;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class JavaBuildConfig {

    @Pattern(regexp = "17|21|25")
    private String javaVersion;

    @Pattern(regexp = "MAVEN|GRADLE")
    private String buildTool;

    @Size(max = 300)
    private String artifactPath;
}
