
package com.deployX.backend.modules;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "deployment_environment_variables",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_deployment_environment_variable",
                        columnNames = {"deployment_id", "variable_name"}
                )
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeploymentEnvironmentVariable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "deployment_id", nullable = false)
    private Deployment deployment;

    @Column(name = "variable_name", nullable = false, length = 255)
    private String name;

    @Column(name = "encrypted_value", nullable = false, columnDefinition = "TEXT")
    private String encryptedValue;

    @Builder.Default
    @Column(nullable = false)
    private boolean secret = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
