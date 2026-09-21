package Authentication.Project1.Authify.io;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ResetPasswordRequest {
    @NotBlank(message = "Password is Required")
    String email;
    @NotBlank(message = "OTP is Required")
    String otp;
    @NotBlank(message = "Password is Required")
    String newPassword;
}
