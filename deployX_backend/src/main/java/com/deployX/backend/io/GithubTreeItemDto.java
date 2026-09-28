package com.deployX.backend.io;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GithubTreeItemDto {
    private String path;

    private String mode;

    private String type;

    private String sha;

    private Long size;

    private String url;
}
