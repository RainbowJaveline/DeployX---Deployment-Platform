package com.deployX.backend.Service;

import com.deployX.backend.Repository.UserRepository;
import com.deployX.backend.Util.JwtUtil;
import com.deployX.backend.modules.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.time.Duration;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler
        implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final AppUserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;

    private final OAuth2AuthorizedClientService authorizedClientService;

    @Value("${DEPLOYX_FRONTEND_URL:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication)
            throws IOException, ServletException {

        HttpSession debugSession = request.getSession(false);
        OAuth2User oauth2User =
                (OAuth2User) authentication.getPrincipal();

        Object id = oauth2User.getAttribute("id");

        String githubProviderId =
                String.valueOf(id);

        /*
         * Check whether this OAuth flow was started
         * from "Connect GitHub".
         */
        HttpSession session =
                request.getSession(false);

        Object connectUserIdObject =
                session != null
                        ? session.getAttribute(
                        "github_connect_user_id"
                )
                        : null;

        /*
         * ==========================================
         * CONNECT GITHUB FLOW
         * ==========================================
         */

        if (connectUserIdObject != null) {

            Long connectUserId =
                    ((Number) connectUserIdObject).longValue();

            User currentUser =
                    userRepository
                            .findById(connectUserId)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "DeployX user not found"
                                    )
                            );

            /*
             * Check whether this GitHub account
             * is already connected to another
             * DeployX account.
             */
            Optional<User> existingGithubUser =
                    userRepository
                            .findByGithubProviderId(
                                    githubProviderId
                            );

            if (existingGithubUser.isPresent()) {
            }





            if (existingGithubUser.isPresent()
                    && !existingGithubUser
                    .get()
                    .getId()
                    .equals(currentUser.getId())) {

                session.removeAttribute(
                        "github_connect_user_id"
                );

                response.sendRedirect(
                        frontendUrl + "/new-deployment?github=already-connected"
                );

                return;
            }

            /*
             * Get GitHub username.
             */
            String githubUsername =
                    oauth2User.getAttribute("login");

            /*
             * Get the OAuth2 access token.
             */
            OAuth2AuthenticationToken
                    oauth2Authentication =
                    (OAuth2AuthenticationToken)
                            authentication;

            OAuth2AuthorizedClient
                    authorizedClient =
                    authorizedClientService
                            .loadAuthorizedClient(
                                    oauth2Authentication
                                            .getAuthorizedClientRegistrationId(),
                                    oauth2Authentication
                                            .getName()
                            );

            if (authorizedClient != null) {
            }

            if (authorizedClient == null) {
                throw new RuntimeException(
                        "GitHub authorization information not found"
                );
            }

            String accessToken =
                    authorizedClient
                            .getAccessToken()
                            .getTokenValue();

            /*
             * Save GitHub connection details
             * against the existing DeployX user.
             */
            currentUser.setGithubProviderId(
                    githubProviderId
            );

            currentUser.setGithubUsername(
                    githubUsername
            );

            currentUser.setGithubAccessToken(
                    accessToken
            );


// DEBUG: Check values before saving to database

            userRepository.save(currentUser);

            /*
             * Generate a DeployX JWT for the existing
             * DeployX user.
             *
             * IMPORTANT:
             * We use currentUser.getEmail(), not the
             * GitHub provider ID.
             */
            var userDetails =
                    userDetailsService.loadUserByUsername(
                            currentUser.getEmail()
                    );

            String jwtToken =
                    jwtUtil.generateToken(userDetails);

            /*
             * Store the DeployX JWT in an HttpOnly cookie.
             */
            ResponseCookie cookie =
                    ResponseCookie.from(
                                    "jwt",
                                    jwtToken
                            )
                            .httpOnly(true)
                            .path("/")
                            .maxAge(Duration.ofDays(1))
                            .sameSite("Strict")
                            .build();

            response.addHeader(
                    "Set-Cookie",
                    cookie.toString()
            );

            /*
             * Connection is complete.
             */
            session.removeAttribute(
                    "github_connect_user_id"
            );

            /*
             * Send the user back to the
             * New Deployment page.
             */
            response.sendRedirect(
                    frontendUrl + "/new-deployment?github=connected"
            );

            return;
        }

        /*
         * ==========================================
         * NORMAL GITHUB LOGIN FLOW
         * ==========================================
         */

        User user =
                userRepository
                        .findByProviderAndProviderId(
                                "GITHUB",
                                githubProviderId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "GitHub user not found"
                                )
                        );

        /*
         * Load the same UserDetails used
         * by normal email/password login.
         */
        var userDetails =
                userDetailsService
                        .loadUserByUsername(
                                user.getEmail()
                        );

        /*
         * Generate DeployX JWT.
         */
        String jwtToken =
                jwtUtil.generateToken(
                        userDetails
                );

        /*
         * Store JWT in HttpOnly cookie.
         */
        ResponseCookie cookie =
                ResponseCookie.from(
                                "jwt",
                                jwtToken
                        )
                        .httpOnly(true)
                        .path("/")
                        .maxAge(
                                Duration.ofDays(1)
                        )
                        .sameSite("Strict")
                        .build();

        response.addHeader(
                "Set-Cookie",
                cookie.toString()
        );

        /*
         * Normal GitHub login goes to dashboard.
         */
        response.sendRedirect(
                frontendUrl + "/dashboard"
        );
    }
}
