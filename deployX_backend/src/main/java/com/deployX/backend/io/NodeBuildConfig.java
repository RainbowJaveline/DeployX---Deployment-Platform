
package com.deployX.backend.io;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class NodeBuildConfig {

    @Pattern(regexp = "20|22|24")
    private String nodeVersion;

    @Pattern(regexp = "NPM|PNPM|YARN")
    private String packageManager;

    @Size(max = 200)
    private String buildCommand;

    @Size(max = 200)
    private String startCommand;
}
