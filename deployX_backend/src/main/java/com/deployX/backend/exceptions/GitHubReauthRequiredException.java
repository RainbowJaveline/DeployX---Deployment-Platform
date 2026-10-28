package com.deployX.backend.exceptions;

public class GitHubReauthRequiredException extends RuntimeException{
    public GitHubReauthRequiredException(String mesaage , Throwable cause){
        super(mesaage , cause);
    }
}
