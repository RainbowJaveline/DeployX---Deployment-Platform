package com.deployX.backend.Service;

import com.deployX.backend.Repository.UserRepository;
import com.deployX.backend.Util.JwtUtil;
import com.deployX.backend.modules.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler
        implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final AppUserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication)
            throws IOException, ServletException {

        OAuth2User oauth2User =
                (OAuth2User) authentication.getPrincipal();

        Object id = oauth2User.getAttribute("id");
        String providerId = String.valueOf(id);

        User user = userRepository
                .findByProviderAndProviderId("GITHUB", providerId)
                .orElseThrow(() ->
                        new RuntimeException("GitHub user not found"));

        // Load the same UserDetails used by normal login
        var userDetails =
                userDetailsService.loadUserByUsername(user.getEmail());

        // Generate JWT
        String jwtToken =
                jwtUtil.generateToken(userDetails);

        // Create the same cookie used by normal login
        ResponseCookie cookie = ResponseCookie.from(
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

        // Redirect to React
        response.sendRedirect("http://localhost:5173");
    }
}