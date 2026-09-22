package com.deployX.backend.Service;

import com.deployX.backend.Repository.UserRepository;
import com.deployX.backend.modules.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest)
            throws OAuth2AuthenticationException {

        OAuth2User oauth2User = super.loadUser(userRequest);

        String provider = userRequest
                .getClientRegistration()
                .getRegistrationId()
                .toUpperCase();

        Object id = oauth2User.getAttribute("id");
        String providerId = String.valueOf(id);

        String login = oauth2User.getAttribute("login");
        String name = oauth2User.getAttribute("name");

        // GitHub can return null for name
        if (name == null || name.isBlank()) {
            name = login;
        }

        String email = oauth2User.getAttribute("email");

        // GitHub may not return email in /user
        if (email == null || email.isBlank()) {
            email = getGitHubEmail(userRequest);
        }

        System.out.println("=================================");
        System.out.println("Provider: " + provider);
        System.out.println("Provider ID: " + providerId);
        System.out.println("Login: " + login);
        System.out.println("Name: " + name);
        System.out.println("Email: " + email);
        System.out.println("=================================");

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException(
                    "GitHub account does not have an accessible email address"
            );
        }

        String finalName = name;
        String finalEmail = email;

        userRepository
                .findByProviderAndProviderId(provider, providerId)
                .orElseGet(() -> {

                    User newUser = User.builder()
                            .name(finalName)
                            .email(finalEmail)
                            .provider(provider)
                            .providerId(providerId)
                            .password(null)
                            .isAccountVerified(true)
                            .build();

                    return userRepository.save(newUser);
                });

        return oauth2User;
    }

    private String getGitHubEmail(OAuth2UserRequest userRequest) {

        String accessToken = userRequest
                .getAccessToken()
                .getTokenValue();

        RestClient restClient = RestClient.builder()
                .baseUrl("https://api.github.com")
                .defaultHeader(
                        HttpHeaders.ACCEPT,
                        MediaType.APPLICATION_JSON_VALUE
                )
                .defaultHeader(
                        HttpHeaders.AUTHORIZATION,
                        "Bearer " + accessToken
                )
                .build();

        List<Map<String, Object>> emails = restClient
                .get()
                .uri("/user/emails")
                .retrieve()
                .body(List.class);

        if (emails == null) {
            return null;
        }

        // First look for a primary + verified email
        for (Map<String, Object> emailData : emails) {

            Boolean primary = (Boolean) emailData.get("primary");
            Boolean verified = (Boolean) emailData.get("verified");

            if (Boolean.TRUE.equals(primary)
                    && Boolean.TRUE.equals(verified)) {

                return (String) emailData.get("email");
            }
        }

        // Fallback: any verified email
        for (Map<String, Object> emailData : emails) {

            Boolean verified = (Boolean) emailData.get("verified");

            if (Boolean.TRUE.equals(verified)) {
                return (String) emailData.get("email");
            }
        }

        return null;
    }
}