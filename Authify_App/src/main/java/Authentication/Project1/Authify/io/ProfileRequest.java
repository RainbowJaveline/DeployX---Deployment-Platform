package Authentication.Project1.Authify.io;

import jakarta.annotation.Nonnull;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.NonNull;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProfileRequest {
    @NotBlank(message = "Name should not be Empty")
    private String name;
    @Email(message = "Enter Correct Email")
    @NotNull(message = "Email should not be Empty")
    private String email;
    @Size(min = 6 , message = "password must be atleast more than 6 characters")
    private String password;
}
