package com.deployX.backend.io;

import com.deployX.backend.Enum.DeploymentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class DeploymentStatusResponse {
    private UUID deploymentId;
    private String repositoryOwner;
    private String repositoryName;
    private String branch;
    private DeploymentStatus status;
    private String failureSummary;
    private String applicationUrl;
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
}
