package com.deployX.backend.Service;

import com.deployX.backend.Enum.DeploymentStatus;
import com.deployX.backend.io.DeploymentLogResponse;
import com.deployX.backend.io.DeploymentStatusResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
public class DeploymentStreamService {

    // 30-minute timeout for active deployment log streams
    private static final long SSE_TIMEOUT_MS = 30 * 60 * 1000L;

    private final Map<UUID, List<SseEmitter>> activeEmitters = new ConcurrentHashMap<>();

    /**
     * Subscribes a client to real-time logs and status events for a deployment.
     * Replays the initial status snapshot and accumulated logs upon connection.
     */
    public SseEmitter subscribe(UUID deploymentId, DeploymentStatusResponse currentStatus, List<DeploymentLogResponse> initialLogs) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);

        Runnable cleanup = () -> removeEmitter(deploymentId, emitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        activeEmitters.computeIfAbsent(deploymentId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        try {
            // 1. Send initial state snapshot
            Map<String, Object> initPayload = new LinkedHashMap<>();
            initPayload.put("status", currentStatus);
            initPayload.put("logs", initialLogs != null ? initialLogs : List.of());
            emitter.send(SseEmitter.event().name("init").data(initPayload));

            // If the deployment is already in a terminal state, complete the stream
            if (currentStatus != null && isTerminal(currentStatus.getStatus())) {
                emitter.send(SseEmitter.event().name("complete").data(currentStatus.getStatus().name()));
                emitter.complete();
                removeEmitter(deploymentId, emitter);
            }
        } catch (IOException ex) {
            log.debug("Failed to deliver initial SSE state for deployment {}: {}", deploymentId, ex.getMessage());
            cleanup.run();
        }

        return emitter;
    }

    /**
     * Broadcasts a single new log line to all active SSE subscribers for this deployment.
     */
    public void publishLog(UUID deploymentId, DeploymentLogResponse logResponse) {
        List<SseEmitter> emitters = activeEmitters.get(deploymentId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        List<SseEmitter> deadEmitters = new ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("log").data(logResponse));
            } catch (Exception ex) {
                deadEmitters.add(emitter);
            }
        }

        if (!deadEmitters.isEmpty()) {
            emitters.removeAll(deadEmitters);
            if (emitters.isEmpty()) {
                activeEmitters.remove(deploymentId);
            }
        }
    }

    /**
     * Broadcasts updated deployment status to all active SSE subscribers.
     */
    public void publishStatus(UUID deploymentId, DeploymentStatusResponse statusResponse) {
        List<SseEmitter> emitters = activeEmitters.get(deploymentId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        boolean terminal = statusResponse != null && isTerminal(statusResponse.getStatus());
        List<SseEmitter> deadEmitters = new ArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("status").data(statusResponse));
                if (terminal) {
                    emitter.send(SseEmitter.event().name("complete").data(statusResponse.getStatus().name()));
                    emitter.complete();
                }
            } catch (Exception ex) {
                deadEmitters.add(emitter);
            }
        }

        if (terminal) {
            activeEmitters.remove(deploymentId);
        } else if (!deadEmitters.isEmpty()) {
            emitters.removeAll(deadEmitters);
            if (emitters.isEmpty()) {
                activeEmitters.remove(deploymentId);
            }
        }
    }

    /**
     * Periodic heartbeat comment to keep SSE connections alive through reverse proxies and browsers.
     */
    @Scheduled(fixedRate = 20000)
    public void sendHeartbeat() {
        if (activeEmitters.isEmpty()) return;

        activeEmitters.forEach((id, emitters) -> {
            List<SseEmitter> dead = new ArrayList<>();
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event().comment("ping"));
                } catch (Exception ex) {
                    dead.add(emitter);
                }
            }
            if (!dead.isEmpty()) {
                emitters.removeAll(dead);
            }
        });
        activeEmitters.entrySet().removeIf(entry -> entry.getValue().isEmpty());
    }

    private void removeEmitter(UUID deploymentId, SseEmitter emitter) {
        List<SseEmitter> emitters = activeEmitters.get(deploymentId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                activeEmitters.remove(deploymentId);
            }
        }
    }

    private boolean isTerminal(DeploymentStatus status) {
        return status == DeploymentStatus.RUNNING
                || status == DeploymentStatus.FAILED
                || status == DeploymentStatus.TERMINATED;
    }
}
