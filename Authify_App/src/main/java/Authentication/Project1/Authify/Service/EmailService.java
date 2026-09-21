package Authentication.Project1.Authify.Service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;

    @Value("${spring.mail.properties.mail.smtp.from}")
    private String fromEmail;

    public void sendWelcome(String toEmail , String name){
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Welcome Message From the Authify Team");
        message.setText("Hello" + name +",\n\n Thanks for registering wiht us! \n\n Regards \nAuthify Team");
        mailSender.send(message);
    }

    public void sendResetOtp(String toEmail , String otp){
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("OTP to reset Your Password");
        message.setText("Your Reset Password OTP is : " + otp +
                "\n\nDo not share the OTP with anyone.");
        mailSender.send(message);
    }


}
