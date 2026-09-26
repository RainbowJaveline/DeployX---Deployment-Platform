package com.deployX.backend.Controller;

import com.deployX.backend.Repository.UserRepository;
import com.deployX.backend.Service.GithubService;
import com.deployX.backend.io.GithubRepositoryDTO;
import com.deployX.backend.modules.User;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/github")
@RequiredArgsConstructor
public class GithubController {

    private final UserRepository userRepository;
    private final GithubService githubService;

    @GetMapping("/repos")
    public List<GithubRepositoryDTO> getRepositories(
            HttpServletRequest request
    ) {

        // Get DeployX user's email from JwtFilter
        String email =
                (String) request.getAttribute("deployxUserEmail");

        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "DeployX authentication required"
            );
        }

        // Find the DeployX user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "User not found"
                        )
                );

        // Check whether GitHub is connected
        if (user.getGithubAccessToken() == null ||
                user.getGithubAccessToken().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "GitHub account is not connected"
            );
        }

        // Fetch repositories from GitHub
        return githubService.getRepositories(
                user.getGithubAccessToken()
        );
    }
}