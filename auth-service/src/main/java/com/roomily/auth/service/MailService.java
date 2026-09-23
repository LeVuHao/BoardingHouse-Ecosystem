package com.roomily.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class MailService {

    private final JavaMailSender mailSender;
    private final String mailFrom;

    public MailService(JavaMailSender mailSender,
                       @Value("${spring.mail.username:roomily@localhost}") String mailFrom) {
        this.mailSender = mailSender;
        this.mailFrom = mailFrom;
    }

    public void sendPasswordResetCode(String to, String code) {
        // Luôn ghi mã ra log để dễ test khi chưa cấu hình SMTP
        log.info("[DEV-PASSWORD-RESET] email={} code={}", to, code);

        if (mailFrom == null || mailFrom.isBlank() || mailFrom.startsWith("YOUR_")) {
            log.warn("SMTP chưa được cấu hình, bỏ qua gửi email thật cho {}", to);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(to);
            message.setSubject("Roomily - Đặt lại mật khẩu");
            message.setText("Mã xác thực đặt lại mật khẩu của bạn là: " + code
                    + "\n\nMã có hiệu lực trong 10 phút.\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.");
            mailSender.send(message);
        } catch (MailException ex) {
            log.error("Gửi email đặt lại mật khẩu thất bại cho {}", to, ex);
            throw new com.roomily.common.exception.BadRequestException("Không thể gửi email, vui lòng thử lại sau");
        }
    }
}