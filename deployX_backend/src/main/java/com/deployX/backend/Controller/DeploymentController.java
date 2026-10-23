package com.deployX.backend.Controller;

import com.deployX.backend.Service.DeploymentService;
import com.deployX.backend.io.DeploymentCreationResponse;
import com.deployX.backend.io.deploymentRequest;
import com.deployX.backend.io.deploymentResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/deployment")
@RequiredArgsConstructor
public class DeploymentController {
    private final DeploymentService deploymentService;
    @PostMapping("/analyze")
    public deploymentResponse analyze(@RequestBody deploymentRequest request , HttpServletRequest httpServletRequest){

        String email = (String) httpServletRequest.getAttribute("deployxUserEmail");

        if(email == null){
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User not Found"
            );
        }
        return deploymentService.analyzeRepository( email , request);
    }



    @PostMapping("/create")
    @ResponseStatus(HttpStatus.CREATED)
    public DeploymentCreationResponse createDeployment(
            deploymentRequest request,
            HttpServletRequest httpServletRequest) {

        String email = (String) httpServletRequest
                .getAttribute("deployxUserEmail");

        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User not found"
            );
        }

        return deploymentService.createDeployment(email , request);
    }

}
