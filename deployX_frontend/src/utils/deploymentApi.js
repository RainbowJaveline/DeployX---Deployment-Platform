// src/utils/deploymentApi.js
import {
  createDeploymentDraft,
  getDeploymentConfiguration,
  saveDeploymentConfiguration,
} from './api'

export async function getDeploymentConfig(deploymentId) {
  return getDeploymentConfiguration(deploymentId)
}

export async function saveDeploymentConfig(deploymentId, config) {
  return saveDeploymentConfiguration(deploymentId, config)
}

export async function createDeploymentDraftFromRepository(repository) {
  return createDeploymentDraft(repository)
}
