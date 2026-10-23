
package com.deployX.backend.io;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PythonBuildConfig {

    @Pattern(regexp = "3\\.(10|11|12|13)")
    private String pythonVersion;

    @Size(max = 200)
    private String requirementsFile;

    @Size(max = 200)
    private String entryPoint;
}
