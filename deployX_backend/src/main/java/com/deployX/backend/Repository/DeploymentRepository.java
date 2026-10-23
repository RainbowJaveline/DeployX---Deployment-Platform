package com.deployX.backend.Repository;

import com.deployX.backend.modules.Deployment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeploymentRepository extends JpaRepository<Deployment, Long> {

    Optional<Deployment> findByDeploymentId(UUID deploymentId);

    boolean existsByDeploymentId(UUID deploymentId);

    Optional<Deployment> findByDeploymentIdAndUser_Email(
            UUID deploymentId,
            String email
    );

}
