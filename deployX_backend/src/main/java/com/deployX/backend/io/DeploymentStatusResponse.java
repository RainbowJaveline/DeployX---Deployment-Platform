package com.deployX.backend.io;

import com.deployX.backend.Enum.DeploymentStatus;
import com.deployX.backend.modules.Deployment;
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
    private String repositoryUrl;
    private String branch;
    private String projectType;
    private String environment;
    private String commitHash;
    private DeploymentStatus status;
    private String failureSummary;
    private String applicationUrl;
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;

    public static DeploymentStatusResponse from(Deployment deployment) {
        if (deployment == null) {
            return null;
        }
        return DeploymentStatusResponse.builder()
                .deploymentId(deployment.getDeploymentId())
                .repositoryOwner(deployment.getRepositoryOwner())
                .repositoryName(deployment.getRepositoryName())
                .repositoryUrl(deployment.getRepositoryUrl())
                .branch(deployment.getBranch())
                .projectType(deployment.getProjectType())
                .commitHash(deployment.getCommitHash())
                .status(deployment.getStatus())
                .failureSummary(deployment.getFailureSummary())
                .applicationUrl(deployment.getApplicationUrl())
                .createdAt(deployment.getCreatedAt())
                .startedAt(deployment.getStartedAt())
                .finishedAt(deployment.getFinishedAt())
                .build();
    }
}
