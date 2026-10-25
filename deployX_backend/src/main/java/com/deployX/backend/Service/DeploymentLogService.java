package com.deployX.backend.Service;

import com.deployX.backend.Repository.DeploymentLogRepository;
import com.deployX.backend.modules.Deployment;
import com.deployX.backend.modules.DeploymentLog;
import com.deployX.backend.io.DeploymentLogResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeploymentLogService {
    private final DeploymentLogRepository logRepository;

    public void append(Deployment deployment, String level, String message) {
        logRepository.save(DeploymentLog.builder()
                .deployment(deployment)
                .level(level)
                .message(message)
                .build());
    }

    public List<DeploymentLogResponse> getLogs(UUID deploymentId) {
        return logRepository.findAllByDeployment_DeploymentIdOrderByCreatedAtAsc(deploymentId)
                .stream()
                .map(log -> DeploymentLogResponse.builder()
                        .timestamp(log.getCreatedAt())
                        .level(log.getLevel())
                        .message(log.getMessage())
                        .build())
                .toList();
    }
}
