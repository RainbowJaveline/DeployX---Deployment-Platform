
package com.deployX.backend.io;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GoBuildConfig {

    @Pattern(regexp = "1\\.(23|24|25)")
    private String goVersion;

    @Size(max = 200)
    private String modulePath;

    @Size(max = 200)
    private String buildTarget;
}
