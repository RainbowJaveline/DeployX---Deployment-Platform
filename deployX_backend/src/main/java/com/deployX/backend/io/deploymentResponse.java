package com.deployX.backend.io;

import lombok.*;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class deploymentResponse {
    /*
     * Repository information
     */
    private String owner;

    private String repository;

    private String branch;


    /*
     * Overall repository classification
     */
    private String projectType;

    private String language;


    /*
     * Individual repository components
     */
    private List<DeploymentComponentDto> components;


    /*
     * Repository-level indicators
     */
    private boolean dockerfilePresent;

    private boolean packageJsonPresent;

    private boolean pomXmlPresent;

    private boolean requirementsTxtPresent;
}
