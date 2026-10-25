package com.deployX.backend.io;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DeploymentLogResponse {
    private LocalDateTime timestamp;
    private String level;
    private String message;
}
