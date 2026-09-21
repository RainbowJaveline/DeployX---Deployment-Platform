package Authentication.Project1.Authify.Controller;

import Authentication.Project1.Authify.Service.AppUserDetailsService;
import Authentication.Project1.Authify.Service.EmailService;
import Authentication.Project1.Authify.Service.ProfileImpl;
import Authentication.Project1.Authify.io.ProfileRequest;
import Authentication.Project1.Authify.io.ProfileResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.CurrentSecurityContext;
import org.springframework.security.core.userdetails.UserDetails;
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

