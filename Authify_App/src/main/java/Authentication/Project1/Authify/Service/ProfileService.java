package Authentication.Project1.Authify.Service;

import Authentication.Project1.Authify.io.ProfileRequest;
import Authentication.Project1.Authify.io.ProfileResponse;
import Authentication.Project1.Authify.modules.User;

public interface ProfileService {
    ProfileResponse createProfile(ProfileRequest profileRequest);

    ProfileResponse getProfile(String email);

    void sendResetOtp(String email);

    void resetPassword(String email , String otp , String newPassword);
}
