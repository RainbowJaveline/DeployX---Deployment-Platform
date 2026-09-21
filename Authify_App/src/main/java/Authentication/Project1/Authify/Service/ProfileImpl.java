package Authentication.Project1.Authify.Service;

import Authentication.Project1.Authify.Repository.UserRepository;
import Authentication.Project1.Authify.io.ProfileRequest;
import Authentication.Project1.Authify.io.ProfileResponse;
import Authentication.Project1.Authify.modules.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Time;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class ProfileImpl implements ProfileService {


    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Override
    public ProfileResponse createProfile(ProfileRequest profileRequest) {
        User userEntity = convertToUserEntity(profileRequest);
        if(!userRepository.existsByEmail(userEntity.getEmail())){
            userRepository.save(userEntity);
            return convertToProfileResponse(userEntity);
        }

        throw new ResponseStatusException(HttpStatus.CONFLICT , "Email already Exists");
    }

    @Override
    public ProfileResponse getProfile(String email) {
        User user =  userRepository.findByEmail(email).orElseThrow(()->new UsernameNotFoundException("Email does not exists"));
        return convertToProfileResponse(user);
    }

    @Override
    public void sendResetOtp(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(()->new UsernameNotFoundException("Email does not Exist"));
        //Generate 6 Digit OTP
        String otp = String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1000000));
        long expiryTime = System.currentTimeMillis() + (15 * 60 * 1000);

        //update the profile/User
        user.setResetOtp(otp);
        user.setResetOtpExpireAt(expiryTime);

        //save into the database
        userRepository.save(user);

        try{
            // send the reset otp email
            emailService.sendResetOtp(user.getEmail() , otp);
        }catch (Exception e){
            throw new RuntimeException("Unable to Send the Email" , e);
        }
    }

    @Override
    public void resetPassword(String email, String otp, String newPassword) {
        User user = userRepository.findByEmail(email).orElseThrow(RuntimeException::new);
        if(user.getResetOtp() == null || !user.getResetOtp().equals(otp)){
            throw new RuntimeException("Invalid OTP" + otp + "\n\n Please Try again");
        }
        if(user.getResetOtpExpireAt() < System.currentTimeMillis()){
            throw new RuntimeException("OTP Expired");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetOtp(null);
        user.setResetOtpExpireAt(0L);

        userRepository.save(user);
    }

    private ProfileResponse convertToProfileResponse(User userEntity) {
        return ProfileResponse.builder()
                .email(userEntity.getEmail())
                .name(userEntity.getName())
                .userId(userEntity.getId())
                .isAccountVerified(userEntity.isAccountVerified())
                .build();
    }

    private User convertToUserEntity(ProfileRequest profileRequest) {
        return User.builder()
                .name(profileRequest.getName())
                .email(profileRequest.getEmail())
                .password(passwordEncoder.encode(profileRequest.getPassword()))
                .userId(UUID.randomUUID().toString())
                .isAccountVerified(false)
                .verifyOtp(null)
                .verifyOtpExpireAt(0L)
                .resetOtp(null)
                .build();

    }
}
