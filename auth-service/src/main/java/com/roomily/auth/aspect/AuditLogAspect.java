package com.roomily.auth.aspect;

import com.roomily.auth.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class AuditLogAspect {

    private static final Pattern USER_ID = Pattern.compile("/users/(\\d+)");

    private final AuditLogService auditLogService;

    @Pointcut("within(com.roomily.auth.controller.AdminController)")
    public void adminControllerPointcut() {
    }

    @AfterReturning(pointcut = "adminControllerPointcut()")
    public void logAfterAdminAction(JoinPoint joinPoint) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) return;
            HttpServletRequest request = attributes.getRequest();

            // Chỉ log các thao tác làm thay đổi dữ liệu (không log GET)
            if (request.getMethod().equalsIgnoreCase("GET")) return;

            // lockUser -> LOCK_USER
            String action = joinPoint.getSignature().getName()
                    .replaceAll("([a-z0-9])([A-Z])", "$1_$2").toUpperCase();

            String adminEmail = request.getHeader("X-User-Email");
            String xff = request.getHeader("X-Forwarded-For");
            String ip = (xff != null && !xff.isBlank()) ? xff.split(",")[0].trim() : request.getRemoteAddr();

            Matcher m = USER_ID.matcher(request.getRequestURI());
            String userId = m.find() ? m.group(1) : null;
            String details = switch (action) {
                case "LOCK_USER" -> "Khóa tài khoản ID: " + userId;
                case "UNLOCK_USER" -> "Mở khóa tài khoản ID: " + userId;
                default -> request.getMethod() + " " + request.getRequestURI();
            };

            auditLogService.record(adminEmail, action, details, ip);
        } catch (Exception e) {
            log.error("Failed to save audit log: {}", e.getMessage());
        }
    }
}
