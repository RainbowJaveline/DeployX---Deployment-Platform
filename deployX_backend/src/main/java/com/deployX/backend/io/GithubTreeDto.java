package com.deployX.backend.io;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GithubTreeDto {
    private String sha;

    private List<GithubTreeItemDto> tree;

    private boolean truncated;
}
