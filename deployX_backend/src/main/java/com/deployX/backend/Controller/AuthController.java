package com.deployX.backend.Controller;

import com.deployX.backend.Repository.UserRepository;
import com.deployX.backend.Service.AppUserDetailsService;
import com.deployX.backend.Service.ProfileImpl;
import com.deployX.backend.Util.JwtUtil;
import com.deployX.backend.io.AuthRequest;
import com.deployX.backend.io.AuthResponse;
import com.deployX.backend.io.ResetPasswordRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.CurrentSecurityContext;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager manager;
    private final AppUserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final ProfileImpl profile;
    private final UserRepository userRepository;

    @GetMapping("/login")
    public ResponseEntity<?> loginError() {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body("OAuth2 login failed");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest authRequest){
        try{
            authenticate(authRequest.getEmail() , authRequest.getPassword());
            final UserDetails userDetails = userDetailsService.loadUserByUsername(authRequest.getEmail());
            final String JwtToken = jwtUtil.generateToken(userDetails);
            ResponseCookie cookie = ResponseCookie.from("jwt" , JwtToken)
                    .httpOnly(true)
                    .path("/")
                    .maxAge(Duration.ofDays(1))
                    .sameSite("Strict")
                    .build();

            return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE , cookie.toString())
                    .body(new AuthResponse(authRequest.getEmail(), JwtToken));
        } catch (BadCredentialsException e) {
            Map<String , Object> map = new HashMap<>();
            map.put("error" , true);
            map.put("message" , "Email or Password is Incorrect");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(map);
        }catch (DisabledException ex){
            Map<String , Object> map = new HashMap<>();
            map.put("error" , true);
            map.put("message" , "Account is Disabled");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(map);
        }catch(Exception exception){
            Map<String , Object> map = new HashMap<>();
            map.put("error" , true);
            map.put("message" , "Authentication is Failed");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(map);
        }
    }

    private void authenticate(String email, String password) {
        manager.authenticate(new UsernamePasswordAuthenticationToken(email,password));
    }

    @GetMapping("/is-authenticated")
    public ResponseEntity<Boolean> isAuthenticated(@CurrentSecurityContext(expression = "authentication?.name") String email){
        return ResponseEntity.ok(email != null);
    }

    @PostMapping("/send-resetPassword-otp")
    public void resetPassword(@RequestParam String email){
        try {
            profile.sendResetOtp(email);
        }catch (Exception e){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR , e.getMessage());
        }
    }

    @PostMapping("/reset-Password")
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest passwordRequest){
        try{
            profile.resetPassword(passwordRequest.getEmail() , passwordRequest.getOtp(), passwordRequest.getNewPassword());
        }catch(Exception e){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR , e.getMessage());
        }
    }




}
