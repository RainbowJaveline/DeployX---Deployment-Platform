package com.deployX.backend.Repository;

import com.deployX.backend.modules.DeploymentLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DeploymentLogRepository extends JpaRepository<DeploymentLog, Long> {
    List<DeploymentLog> findAllByDeployment_DeploymentIdOrderByCreatedAtAsc(UUID deploymentId);
}
