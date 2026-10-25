package com.deployX.backend.Service;

import com.deployX.backend.Enum.DeploymentStatus;
import com.deployX.backend.Repository.DeploymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DeploymentRecoveryService {
    private final DeploymentRepository deployments;
    private final ApplicationEventPublisher events;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void resumeInterruptedJobs() {
        deployments.findAllByStatusIn(List.of(
                        DeploymentStatus.CLONING,
                        DeploymentStatus.BUILDING,
                        DeploymentStatus.DEPLOYING))
                .forEach(deployment -> events.publishEvent(
                        new DeploymentStartedEvent(deployment.getDeploymentId())));
    }
}
