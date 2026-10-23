
package com.deployX.backend.Repository;

import com.deployX.backend.modules.DeploymentEnvironmentVariable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeploymentEnvironmentVariableRepository
        extends JpaRepository<DeploymentEnvironmentVariable, Long> {

    List<DeploymentEnvironmentVariable>
    findAllByDeployment_DeploymentId(
            java.util.UUID deploymentId
    );

    void deleteAllByDeployment_Id(Long deploymentId);
}
