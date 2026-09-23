# DeployX Authentication

## 1. Overview

DeployX supports two authentication entry points:

1. Email/password authentication
2. GitHub OAuth2 authentication

Both ultimately integrate with the same application authentication model: a JWT stored in an HttpOnly `jwt` cookie.

```text
Email/Password Login ───────┐
                            ▼
                         JWT Cookie
                            │
                            ▼
                      Protected APIs
                            ▲
                            │
GitHub OAuth2 ──────────────┘
```

GitHub acts as the external identity provider. After successful GitHub authentication, DeployX creates its own JWT and places it in the `jwt` cookie. Subsequent protected API requests can therefore use the same JWT-based authentication mechanism as normal login.

---

## 2. High-Level Architecture

```text
                         ┌─────────────────────┐
                         │       React         │
                         │   localhost:5173    │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
             Email/Password                    GitHub OAuth2
                    │                               │
                    │                               ▼
                    │                           GitHub
                    │                               │
                    │                               ▼
                    │                    OAuth2 callback to Spring
                    │                               │
                    │                               ▼
                    │                   CustomOAuth2UserService
                    │                               │
                    │                               ▼
                    │                         User database
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                              Generate JWT
                                    │
                                    ▼
                           HttpOnly `jwt` cookie
                                    │
                                    ▼
                              React Dashboard
                                    │
                                    ▼
                         Protected API request
                                    │
                                    ▼
                                JwtFilter
                                    │
                                    ▼
                         Spring Security Context
                                    │
                                    ▼
                             Controller / API
```

---

## 3. Application URLs

| Component | URL |
|---|---|
| React frontend | `http://localhost:5173` |
| Spring Boot backend | `http://localhost:8082` |
| Backend API context path | `/api/v1.0` |

### Authentication endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1.0/register` | Register a user |
| `POST` | `/api/v1.0/login` | Email/password login |
| `GET` | `/api/v1.0/oauth2/authorization/github` | Start GitHub OAuth2 |
| `GET` | `/api/v1.0/login/oauth2/code/github` | GitHub OAuth2 callback |
| `GET` | `/api/v1.0/profile` | Return authenticated user profile |
| `GET` | `/api/v1.0/test` | Protected authentication test |

> The OAuth authorization endpoint is a browser-navigation endpoint. It should not be treated as a normal JSON API call with `fetch()`.

---

## 4. Email/Password Authentication

```text
React Login Form
      │
      │ POST /api/v1.0/login
      ▼
Spring Boot
      │
      ▼
AuthenticationManager
      │
      ▼
UserDetailsService
      │
      ▼
Password verification
      │
      ▼
Generate JWT
      │
      ▼
Set JWT cookie
      │
      ▼
React Dashboard
```

The frontend sends JSON containing the email and password. API calls that depend on the cookie use:

```js
credentials: 'include'
```

---

## 5. Registration

Registration uses:

```text
POST /api/v1.0/register
```

Example request:

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "Test@12345"
}
```

A successful registration returns `201 Created`.

A duplicate email is handled as `409 Conflict`.

---

## 6. GitHub OAuth2 Login

The React GitHub button uses browser navigation:

```js
function handleGithubSignIn() {
  window.location.href =
    'http://localhost:8082/api/v1.0/oauth2/authorization/github'
}
```

The flow is:

```text
User
 │
 │ Click GitHub login
 ▼
React
 │
 │ GET /api/v1.0/oauth2/authorization/github
 ▼
Spring Security
 │
 │ 302
 ▼
GitHub
 │
 │ User authenticates/authorizes
 ▼
GitHub
 │
 │ authorization code + state
 ▼
Spring Boot callback
 │
 ▼
OAuth2LoginAuthenticationFilter
 │
 ▼
OAuth2LoginAuthenticationProvider
 │
 ▼
CustomOAuth2UserService
 │
 ▼
Database
 │
 ▼
OAuth2AuthenticationSuccessHandler
 │
 ├── Generate JWT
 ├── Set JWT cookie
 └── Redirect to /dashboard
 ▼
React Dashboard
```

---

## 7. Security Configuration

`SecurityConfig` is responsible for configuring Spring Security.

Important responsibilities include:

- permitting authentication and OAuth2 endpoints
- enabling OAuth2 login
- registering `CustomOAuth2UserService`
- registering `OAuth2AuthenticationSuccessHandler`
- adding `JwtFilter`
- configuring the authentication entry point
- configuring the current session policy

The relevant structure is:

```text
SecurityConfig
 ├── authorizeHttpRequests
 ├── sessionManagement
 ├── oauth2Login
 │    ├── CustomOAuth2UserService
 │    └── OAuth2AuthenticationSuccessHandler
 ├── JwtFilter
 └── exceptionHandling
```

The current session policy is `IF_REQUIRED`.

---

## 8. CustomOAuth2UserService

`CustomOAuth2UserService` bridges the external GitHub identity and the DeployX user model.

Conceptually:

```text
GitHub user information
        │
        ▼
Extract provider information
        │
        ▼
Identify GitHub user
        │
        ▼
Find/create application user
        │
        ▼
Return OAuth2User
```

The application associates the external identity using values such as:

```text
provider   = GITHUB
providerId = GitHub user ID
```

---

## 9. OAuth2AuthenticationSuccessHandler

After OAuth2 authentication succeeds, `OAuth2AuthenticationSuccessHandler`:

1. obtains the authenticated `OAuth2User`
2. extracts the GitHub ID
3. finds the DeployX user
4. loads the application's `UserDetails`
5. generates a DeployX JWT
6. creates the `jwt` cookie
7. redirects to React

Core logic:

```java
OAuth2User oauth2User =
        (OAuth2User) authentication.getPrincipal();

Object id = oauth2User.getAttribute("id");

String providerId = String.valueOf(id);

User user = userRepository
        .findByProviderAndProviderId("GITHUB", providerId)
        .orElseThrow(() ->
                new RuntimeException("GitHub user not found"));

var userDetails =
        userDetailsService.loadUserByUsername(user.getEmail());

String jwtToken =
        jwtUtil.generateToken(userDetails);
```

The important architectural point is:

```text
GitHub OAuth authentication
          ↓
DeployX user
          ↓
DeployX UserDetails
          ↓
DeployX JWT
```

---

## 10. JWT Cookie

The success handler creates:

```java
ResponseCookie cookie = ResponseCookie.from(
        "jwt",
        jwtToken
)
.httpOnly(true)
.path("/")
.maxAge(Duration.ofDays(1))
.sameSite("Strict")
.build();
```

Then:

```java
response.addHeader(
        "Set-Cookie",
        cookie.toString()
);
```

| Property | Current value | Purpose |
|---|---|---|
| Name | `jwt` | Authentication cookie name |
| Value | JWT | DeployX authentication token |
| HttpOnly | `true` | Prevents normal JavaScript access |
| Path | `/` | Cookie applies across application paths |
| Max age | 1 day | Configured cookie lifetime |
| SameSite | `Strict` | Restricts cross-site cookie sending |

The JWT should not be stored in `localStorage` or `sessionStorage` by the React application.

---

## 11. OAuth2 Success Redirect

After setting the cookie:

```java
response.sendRedirect(
        "http://localhost:5173/dashboard"
);
```

The flow becomes:

```text
OAuth callback
     ↓
Generate JWT
     ↓
Set-Cookie: jwt=<token>
     ↓
302 Redirect
     ↓
http://localhost:5173/dashboard
```

---

## 12. Protected API Requests

Example:

```js
fetch('http://localhost:8082/api/v1.0/profile', {
  method: 'GET',
  credentials: 'include'
})
```

Flow:

```text
React
 │
 │ GET /api/v1.0/profile
 ▼
Browser
 │
 │ Cookie: jwt=<JWT>
 ▼
Spring Security
 │
 ▼
JwtFilter
 │
 ▼
JWT validation
 │
 ▼
Load user details
 │
 ▼
SecurityContext
 │
 ▼
ProfileController
 │
 ▼
Database
 │
 ▼
ProfileResponse
```

---

## 13. JwtFilter

`JwtFilter` is responsible for processing JWT authentication on protected requests.

Conceptually it:

1. reads the token
2. extracts the identity from the token
3. validates the JWT
4. loads the corresponding user
5. creates authentication
6. stores authentication in the `SecurityContext`

```text
HTTP Request
     │
     ▼
JwtFilter
     │
     ├── JWT missing → continue / unauthenticated
     ├── JWT invalid → authentication fails
     └── JWT valid
             │
             ▼
       Load UserDetails
             │
             ▼
       Create Authentication
             │
             ▼
       SecurityContext
```

---

## 14. Profile Endpoint

The protected profile endpoint uses the authenticated Spring Security identity:

```java
@GetMapping("/profile")
public ProfileResponse getDetails(
        @CurrentSecurityContext(
            expression = "authentication?.name"
        )
        String email
) {
    return profile.getProfile(email);
}
```

The controller does not need the frontend to send the authenticated email in the request body.

The identity comes from:

```text
JWT
 ↓
JwtFilter
 ↓
Authentication
 ↓
SecurityContext
 ↓
authentication.name
 ↓
email
```

---

## 15. End-to-End Verification

The OAuth2 implementation was tested end-to-end.

After GitHub login:

```text
GET /api/v1.0/profile
```

returned:

```text
200 OK
```

with a profile response containing the authenticated GitHub user's application record.

This verifies:

```text
GitHub authentication
        ↓
OAuth2 callback
        ↓
DeployX user lookup
        ↓
JWT generation
        ↓
JWT cookie
        ↓
Protected profile request
        ↓
JwtFilter
        ↓
SecurityContext
        ↓
Database
        ↓
200 OK
```

---

## 16. Important Backend Classes

| Class | Responsibility |
|---|---|
| `SecurityConfig` | Spring Security and OAuth2 configuration |
| `JwtFilter` | JWT extraction and authentication |
| `JwtUtil` | JWT generation/validation |
| `CustomOAuth2UserService` | Processes GitHub user information |
| `OAuth2AuthenticationSuccessHandler` | Converts successful OAuth authentication into the DeployX JWT flow |
| `AppUserDetailsService` | Loads application users |
| `ProfileController` | Authentication/profile endpoints |
| `UserRepository` | Database access |

---

## 17. CORS

The development backend allows:

```text
http://localhost:5173
```

The configured methods include:

```text
GET
POST
PUT
DELETE
PATCH
OPTIONS
```

Credentials are allowed so browser cookies can participate in frontend/backend requests.

---

## 18. Troubleshooting

### OAuth endpoint returns 404

Verify the backend context path:

```text
http://localhost:8082/api/v1.0/oauth2/authorization/github
```

not:

```text
http://localhost:8082/oauth2/authorization/github
```

### OAuth endpoint returns 302

A `302` is expected during OAuth.

For example:

```text
Spring Boot
    ↓
302
    ↓
GitHub
```

After successful authentication:

```text
OAuth callback
    ↓
302
    ↓
React /dashboard
```

### Dashboard loads but `/profile` returns 401

Check:

1. Is the `jwt` cookie present?
2. Is `credentials: 'include'` used?
3. Is `JwtFilter` processing the request?
4. Is the JWT valid?
5. Does the JWT subject map to an existing user?
6. Is authentication placed in the `SecurityContext`?

---

## 19. Authentication Testing Checklist

### Registration

- [ ] New user can register.
- [ ] Empty fields are rejected.
- [ ] Short password is rejected.
- [ ] Password confirmation mismatch is rejected.
- [ ] Duplicate email returns `409 Conflict`.
- [ ] Backend-unavailable condition is handled.

### Normal Login

- [ ] Valid credentials authenticate.
- [ ] JWT is generated.
- [ ] JWT cookie is created.
- [ ] Dashboard loads.
- [ ] `/api/v1.0/test` returns `200`.
- [ ] `/api/v1.0/profile` returns `200`.

### GitHub OAuth2

- [ ] GitHub button starts browser navigation.
- [ ] Spring Security receives the authorization request.
- [ ] Spring redirects to GitHub.
- [ ] GitHub authentication succeeds.
- [ ] OAuth callback reaches Spring Boot.
- [ ] OAuth2 authentication succeeds.
- [ ] Application user is found/created according to the implemented service logic.
- [ ] JWT is generated.
- [ ] `jwt` cookie is created.
- [ ] Browser redirects to `/dashboard`.
- [ ] `/api/v1.0/profile` returns `200`.
- [ ] Returned profile belongs to the authenticated GitHub user.

---

## 20. Security Notes

Never commit:

- GitHub client secrets
- JWT signing secrets
- database passwords
- user passwords
- authorization codes
- JWT values
- session IDs

For production, review:

- HTTPS
- `Secure` cookie configuration
- production CORS origins
- OAuth redirect URIs
- secret management
- JWT expiration/rotation
- CSRF strategy for cookie-based authentication
- authentication logging

---

## 21. Quick Mental Model

```text
WHO ARE YOU?
     │
     ├── Email/password
     │
     └── GitHub OAuth2
              │
              ▼
        Spring Security
              │
              ▼
       DeployX User
              │
              ▼
          Generate JWT
              │
              ▼
        HttpOnly Cookie
              │
              ▼
       Protected API Calls
              │
              ▼
           JwtFilter
              │
              ▼
      SecurityContext
              │
              ▼
          Controller
```

**Core idea:**

> GitHub authenticates the external identity; DeployX creates its own JWT and uses that JWT to authenticate subsequent application API requests.
