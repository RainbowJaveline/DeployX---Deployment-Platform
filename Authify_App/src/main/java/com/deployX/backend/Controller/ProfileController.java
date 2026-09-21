package com.deployX.backend.Controller;

import com.deployX.backend.Service.AppUserDetailsService;
import com.deployX.backend.Service.EmailService;
import com.deployX.backend.Service.ProfileImpl;
import com.deployX.backend.io.ProfileRequest;
import com.deployX.backend.io.ProfileResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.CurrentSecurityContext;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ProfileController {


    private final ProfileImpl profile;
    private final AppUserDetailsService userDetailsService;
    private final EmailService emailService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ProfileResponse registerUser(@Valid @RequestBody ProfileRequest request){
        ProfileResponse response =  profile.createProfile(request);
        //todo : send an welcome email
        emailService.sendWelcome(response.getEmail(), response.getName());
        return response;
    }

    @GetMapping("/profile")
    public ProfileResponse getDetails(@CurrentSecurityContext(expression = "authentication?.name") String email){
       return profile.getProfile(email);
    }



    @GetMapping("/test")
    public String test(){
        return "Auth is Working";
    }
}

