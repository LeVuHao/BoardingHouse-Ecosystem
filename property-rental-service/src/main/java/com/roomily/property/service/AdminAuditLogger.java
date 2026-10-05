package com.roomily.property.service;

import com.roomily.property.client.AuthClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Ghi nhật ký thao tác của Admin (khu trọ, bài đăng, tiện ích...) vào bảng audit_logs của auth-service,
 * để trang "Nhật ký hệ thống" hiển thị đầy đủ. Lỗi ghi log không được làm hỏng thao tác chính.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminAuditLogger {

    private final AuthClient authClient;

    public void log(String adminEmail, String ipAddress, String action, String details) {
        try {
            Map<String, String> body = new HashMap<>();
            body.put("adminEmail", adminEmail);
            body.put("ipAddress", ipAddress);
            body.put("action", action);
            body.put("details", details);
            authClient.createAuditLog(body);
        } catch (Exception ex) {
            log.warn("Không ghi được audit log {}: {}", action, ex.getMessage());
        }
    }
}
