package com.deployX.backend.Service;

import com.deployX.backend.Repository.DeploymentEnvironmentVariableRepository;
import com.deployX.backend.Repository.DeploymentRepository;
import com.deployX.backend.io.EnvironmentVariableRequest;
import com.deployX.backend.io.EnvironmentVariableResponse;
import com.deployX.backend.modules.Deployment;
import com.deployX.backend.modules.DeploymentEnvironmentVariable;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EnvironmentVariableService {
    private final DeploymentEnvironmentVariableRepository envRepository;
    private final DeploymentRepository deploymentRepository;
    private final SecretEncryptionService encryptionService;

    @Transactional
    public List<EnvironmentVariableResponse> replaceVariable(
            String email,
            UUID deploymentId,
            List<EnvironmentVariableRequest> variables
    ){
        Deployment deployment = getOwnedDeployment(email , deploymentId);
        if(variables == null){
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Environment variables list cannot be null"
            );
        }

        Set<String> names = new HashSet<>();

        for (EnvironmentVariableRequest variable : variables) {

            if (variable == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Environment variable cannot be null"
                );
            }

            String name = variable.getName();

            if (name == null
                    || !name.matches("[A-Za-z_][A-Za-z0-9_]*")) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid environment variable name"
                );
            }

            if (variable.getValue() == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Environment variable value cannot be null: " + name
                );
            }

            if (!names.add(name)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Duplicate environment variable name: " + name
                );
            }
        }

        List<DeploymentEnvironmentVariable> encryptedVariables =
                variables.stream()
                        .map(variable -> DeploymentEnvironmentVariable.builder()
                                .deployment(deployment)
                                .name(variable.getName())
                                .encryptedValue(
                                        encryptionService.encrypt(
                                                variable.getValue()
                                        )
                                )
                                .secret(variable.isSecret())
                                .build())
                        .toList();

        envRepository.deleteAllByDeployment_Id(deployment.getId());
        List<DeploymentEnvironmentVariable> savedVariables =
                envRepository.saveAll(encryptedVariables);

        return savedVariables.stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public List<EnvironmentVariableResponse> getVariables(
            String email,
            UUID deploymentId) {

        getOwnedDeployment(email, deploymentId);

        return envRepository
                .findAllByDeployment_DeploymentId(deploymentId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private Deployment getOwnedDeployment(
            String email,
            UUID deploymentId) {

        return deploymentRepository
                .findByDeploymentIdAndUser_Email(deploymentId, email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Deployment not found"
                ));
    }

    private EnvironmentVariableResponse toResponse(
            DeploymentEnvironmentVariable variable) {

        return EnvironmentVariableResponse.builder()
                .name(variable.getName())
                .secret(variable.isSecret())
                .build();
    }



}
