package com.deployX.backend.Service;

import java.util.UUID;

public record DeploymentStartedEvent(UUID deploymentId) { }
