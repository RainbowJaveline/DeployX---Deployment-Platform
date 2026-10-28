package com.deployX.backend.Repository;

import com.deployX.backend.modules.Deployment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
import java.util.Collection;
import com.deployX.backend.Enum.DeploymentStatus;

@Repository
public interface DeploymentRepository extends JpaRepository<Deployment, Long> {

    Optional<Deployment> findByDeploymentId(UUID deploymentId);

    boolean existsByDeploymentId(UUID deploymentId);

    Optional<Deployment> findByDeploymentIdAndUser_Email(
            UUID deploymentId,
            String email
    );

    java.util.List<Deployment> findAllByStatusIn(Collection<DeploymentStatus> statuses);

    java.util.List<Deployment> findAllByUser_EmailAndStatusNotOrderByCreatedAtDesc(
            String email,
            DeploymentStatus status
    );

}
