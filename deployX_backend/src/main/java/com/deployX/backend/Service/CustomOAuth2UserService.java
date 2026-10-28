package com.deployX.backend.Service;

import com.deployX.backend.Repository.UserRepository;
import com.deployX.backend.modules.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

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

        /*
         * If this is the "Connect GitHub" flow,
         * do NOT create/login a DeployX user here.
         *
         * The SuccessHandler will handle the
         * actual GitHub connection.
         */

        if(isGithubConnectFlow()){
            return oauth2User;
        }

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

        // Only use a verified address. This is the proof that allows OAuth
        // login to safely link to an existing password-based DeployX account.
        String email = getGitHubEmail(userRequest);

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException(
                    "GitHub account does not have an accessible email address"
            );
        }

        String githubName = name;
        User user = userRepository
                .findByProviderAndProviderId(provider, providerId)
                .orElseGet(() -> userRepository.findByEmailIgnoreCase(email)
                        .orElseGet(() -> User.builder()
                                .name(githubName)
                                .email(email)
                                .password(null)
                                .build()));

        // Do not silently replace an existing external identity on an account.
        if ((user.getProviderId() != null && !user.getProviderId().equals(providerId))
                || (user.getGithubProviderId() != null
                && !user.getGithubProviderId().equals(providerId))) {
            throw new OAuth2AuthenticationException(
                    "This DeployX account is already linked to a different GitHub account"
            );
        }

        user.setName(user.getName() == null || user.getName().isBlank() ? githubName : user.getName());
        user.setEmail(user.getEmail() == null ? email : user.getEmail());
        user.setProvider(provider);
        user.setProviderId(providerId);
        user.setGithubProviderId(providerId);
        user.setGithubUsername(login);
        user.setGithubAccessToken(userRequest.getAccessToken().getTokenValue());
        user.setAccountVerified(true);
        userRepository.save(user);

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

    private boolean isGithubConnectFlow(){
        ServletRequestAttributes servletRequestAttributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        if(servletRequestAttributes == null){
            return false;
        }
        HttpServletRequest request = servletRequestAttributes.getRequest();
        HttpSession session = request.getSession(false);

        return session!=null && session.getAttribute("github_connect_user_id") != null;

    }
}
