
package com.deployX.backend.Repository;

import com.deployX.backend.modules.DeploymentEnvironmentVariable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DeploymentEnvironmentVariableRepository
        extends JpaRepository<DeploymentEnvironmentVariable, Long> {

    List<DeploymentEnvironmentVariable>
    findAllByDeployment_DeploymentId(
            UUID deploymentId
    );

    void deleteAllByDeployment_Id(Long deploymentId);
}
