
package com.deployX.backend.io;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class EnvironmentVariableRequest {

    @NotBlank(message = "Environment variable name is required")
    @Pattern(
            regexp = "[A-Za-z_][A-Za-z0-9_]*",
            message = "Invalid environment variable name"
    )
    private String name;

    @NotBlank(message = "Environment variable value is required")
    @Size(max = 10000, message = "Environment variable value is too long")
    private String value;

    private boolean secret;
}
