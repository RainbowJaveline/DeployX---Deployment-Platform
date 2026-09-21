# 🔐 Authify

> A secure, production-oriented authentication and user management REST API built with **Spring Boot**, **Spring Security**, **JWT**, and **PostgreSQL**.

Authify is a backend authentication service that demonstrates modern authentication and authorization practices using JSON Web Tokens (JWT). It provides secure user login, profile management, password encryption, and stateless authentication while following a clean layered architecture.

---

# ✨ Features

* 🔑 User Authentication using JWT
* 🔒 Password Encryption with BCrypt
* 👤 User Profile Management
* 🛡️ Spring Security Integration
* 🍪 JWT Authentication using Authorization Header and HttpOnly Cookies
* 📦 RESTful API Design
* 🗄️ PostgreSQL Database Integration
* ✅ Request Validation
* 🏗️ Layered Architecture (Controller → Service → Repository)
* 📄 DTO-based Request/Response Models

---

# 🛠️ Tech Stack

| Technology         | Purpose                        |
| ------------------ | ------------------------------ |
| Java               | Programming Language           |
| Spring Boot        | Backend Framework              |
| Spring Security    | Authentication & Authorization |
| Spring Data JPA    | Database Access                |
| PostgreSQL         | Relational Database            |
| JWT                | Stateless Authentication       |
| Maven              | Dependency Management          |
| Lombok             | Boilerplate Code Reduction     |
| Jakarta Validation | Input Validation               |

---

# 🏛️ Project Architecture

```
Client
   │
   ▼
Security Filter Chain
   │
   ▼
JwtFilter
   │
   ▼
Controller
   │
   ▼
Service
   │
   ▼
Repository
   │
   ▼
PostgreSQL
```

---

# 📂 Project Structure

```
Authify
│
├── config
│   ├── SecurityConfig
│   └── CustomAuthenticationEntryPoint
│
├── controller
│   ├── AuthController
│   └── ProfileController
│
├── service
│   ├── AppUserDetailsService
│   ├── ProfileService
│   └── ProfileImpl
│
├── repository
│   └── UserRepository
│
├── filter
│   └── JwtFilter
│
├── util
│   └── JwtUtil
│
├── entity
│   └── User
│
├── dto
│   ├── AuthRequest
│   ├── AuthResponse
│   ├── ProfileRequest
│   └── ProfileResponse
│
└── resources
    └── application.properties
```

---

# 🔄 Authentication Flow

```
Client
   │
POST /login
   │
   ▼
AuthController
   │
   ▼
AuthenticationManager
   │
   ▼
AppUserDetailsService
   │
   ▼
UserRepository
   │
   ▼
PostgreSQL
   │
Password Verified
   │
   ▼
JwtUtil
   │
Generate JWT
   │
   ▼
JWT Returned to Client
```

For protected APIs:

```
Client
   │
Bearer Token / HttpOnly Cookie
   │
   ▼
JwtFilter
   │
Validate JWT
   │
   ▼
SecurityContext
   │
   ▼
Controller
   │
   ▼
Service
   │
   ▼
Repository
```

---

# 📌 REST API Endpoints

| Method | Endpoint    | Description                           |
| ------ | ----------- | ------------------------------------- |
| POST   | `/register` | Register a new user                   |
| POST   | `/login`    | Authenticate user and generate JWT    |
| POST   | `/logout`   | Logout user                           |
| GET    | `/profile`  | Retrieve authenticated user's profile |
| PUT    | `/profile`  | Update authenticated user's profile   |

> Replace the endpoint names above if they differ in your implementation.

---

# 🔐 Security Features

* BCrypt password hashing
* Stateless JWT Authentication
* Spring Security Filter Chain
* Custom Authentication Entry Point
* Protected REST APIs
* Request Validation
* HttpOnly Cookie Support
* Secure Authentication Flow

---

# 🚀 Getting Started

## Prerequisites

* Java 21+ (or your project's configured version)
* Maven
* PostgreSQL

## Clone the Repository

```bash
git clone https://github.com/<your-username>/Authify.git
cd Authify
```

## Configure Database

Update `application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/authify
spring.datasource.username=YOUR_USERNAME
spring.datasource.password=YOUR_PASSWORD
```

## Run the Application

```bash
mvn spring-boot:run
```

The application will start on:

```
http://localhost:8080
```

---

# 🧪 Testing the API

You can test the API using:

* Postman
* Insomnia
* curl
* Swagger UI (if enabled)

---

# 📈 Future Enhancements

* Refresh Token Support
* Role-Based Access Control (RBAC)
* Email Verification
* Password Reset
* OAuth2 / Google Login
* Docker Support
* Kubernetes Deployment
* Jenkins CI/CD Pipeline
* GitHub Actions
* Unit & Integration Testing
* Redis Token Blacklisting
* API Documentation using Swagger/OpenAPI

---

# 💡 What I Learned

This project strengthened my understanding of:

* Spring Security Architecture
* JWT Authentication
* REST API Design
* Layered Backend Architecture
* Password Encryption
* Spring Boot Dependency Injection
* PostgreSQL Integration
* Request Validation
* Authentication & Authorization
* Secure Backend Development

---

# 📜 License

This project is created for learning, portfolio, and educational purposes.
