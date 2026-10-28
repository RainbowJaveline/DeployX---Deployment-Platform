/*
 * Project: Authify (Package: com.deployX.backend.Controller)
 */

package com.deployX.backend;

// =========================================================================
// 1. JUnit 5 Framework Imports
// =========================================================================
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
// Marks methods as executable test cases in JUnit 5.

// =========================================================================
// 2. Spring Framework Core & Dependency Injection
// =========================================================================
import org.springframework.beans.factory.annotation.Autowired;
// Injects spring-managed beans (like MockMvc) into the test class.

import org.springframework.boot.test.context.SpringBootTest;
// Loads the full application context (services, security configs, repositories).

import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
// Provides standard HTTP header constants (e.g., HttpHeaders.AUTHORIZATION).

import org.springframework.http.MediaType;
// Provides media type constants (e.g., MediaType.APPLICATION_JSON).

// =========================================================================
// 3. Spring MVC Mocking Framework
// =========================================================================
import org.springframework.boot.test.autoconfigure.*;
// Autoconfigures the MockMvc instance without needing a running server.

import org.springframework.test.web.servlet.MockMvc;
// Simulates HTTP requests (GET, POST) directly against Spring's controllers.

import org.springframework.test.web.servlet.MvcResult;
// Encapsulates the HTTP response details (headers, status, body) returned by MockMvc.

// =========================================================================
// 4. Spring Security Test Utility Imports
// =========================================================================
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
// Adds valid CSRF tokens to POST requests if CSRF protection is enabled in Spring Security.

// =========================================================================
// 5. MockMvc Builders & Result Matchers (Static Imports)
// =========================================================================
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
// Constructs simulated HTTP GET requests.

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
// Constructs simulated HTTP POST requests.

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
// Asserts HTTP response status codes (e.g., 200 OK, 401 Unauthorized).


@SpringBootTest
@AutoConfigureMockMvc
class LogoutControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Should invalidate JWT token or session upon logout and deny subsequent requests")
    void testSuccessfulLogoutInvalidatesToken() throws Exception {

        // -----------------------------------------------------------------
        // Step 1: Simulate Login request with JSON payload (Matching JWT API)
        // -----------------------------------------------------------------
        String loginJsonBody = "{\"username\":\"testuser\",\"password\":\"securePassword123\"}";

        MvcResult loginResult = mockMvc.perform(post("/api/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJsonBody)
                        .with(csrf())) // Adds CSRF token if enabled in Spring Security
                .andExpect(status().isOk())
                .andReturn();

        // Extract JWT token from Authorization header or response JSON body
        String token = loginResult.getResponse().getHeader("Authorization");
        // Note: If your API returns token in body, extract using Jackson/JSON path instead.

        if (token == null) {
            token = "Bearer test-jwt-token-placeholder"; // Fallback placeholder if using custom token generator
        }

        // -----------------------------------------------------------------
        // Step 2: Access a protected endpoint using the valid token
        // -----------------------------------------------------------------
        mockMvc.perform(get("/api/dashboard")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk());

        // -----------------------------------------------------------------
        // Step 3: Perform Logout API call
        // -----------------------------------------------------------------
        mockMvc.perform(post("/api/logout")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .with(csrf()))
                .andExpect(status().isOk());

        // -----------------------------------------------------------------
        // Step 4: Attempt accessing protected endpoint again with revoked token
        // -----------------------------------------------------------------
        mockMvc.perform(get("/api/dashboard")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isUnauthorized()); // Expect 401 Unauthorized
    }
}