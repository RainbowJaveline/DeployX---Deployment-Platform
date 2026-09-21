package com.deployX.backend.Service;

import com.deployX.backend.io.ProfileRequest;
import com.deployX.backend.io.ProfileResponse;

public interface ProfileService {
    ProfileResponse createProfile(ProfileRequest profileRequest);

    ProfileResponse getProfile(String email);

    void sendResetOtp(String email);

    void resetPassword(String email , String otp , String newPassword);
}
