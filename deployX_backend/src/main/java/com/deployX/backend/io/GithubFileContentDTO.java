package com.deployX.backend.io;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class GithubFileContentDTO {

    private String name;

    private String path;

    private String type;

    private String content;

    private String encoding;
}