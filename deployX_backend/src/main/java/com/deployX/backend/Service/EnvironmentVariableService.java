package com.deployX.backend.Service;

import com.deployX.backend.Repository.DeploymentRepository;
import com.deployX.backend.modules.DeploymentEnvironmentVariable;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EnvironmentVariableService {
    private final DeploymentEnvironmentVariable envRepository;
    private final DeploymentRepository deploymentRepository;
    private final SecretEncryptionService encryptionService;



}
