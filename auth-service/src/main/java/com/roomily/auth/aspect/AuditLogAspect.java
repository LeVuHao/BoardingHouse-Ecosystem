package com.roomily.auth.aspect;

import com.roomily.auth.entity.AuditLog;
import com.roomily.auth.repository.AuditLogRepository;
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

import java.util.Arrays;

@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class AuditLogAspect {

    private final AuditLogRepository auditLogRepository;

    @Pointcut("within(com.roomily.auth.controller.AdminController)")
    public void adminControllerPointcut() {
    }

    @AfterReturning(pointcut = "adminControllerPointcut()", returning = "result")
    public void logAfterAdminAction(JoinPoint joinPoint, Object result) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) return;
            HttpServletRequest request = attributes.getRequest();
            
            String method = request.getMethod();
            // Chỉ log các thao tác làm thay đổi dữ liệu (POST, PUT, DELETE, PATCH)
            if (!method.equalsIgnoreCase("GET")) {
                String action = joinPoint.getSignature().getName();
                String adminEmail = request.getHeader("X-User-Email"); // Giả định Gateway truyền xuống Header
                if (adminEmail == null) adminEmail = "SystemAdmin";
                String ipAddress = request.getRemoteAddr();
                String details = "Endpoint: " + request.getRequestURI() + " | Method: " + method + " | Args: " + Arrays.toString(joinPoint.getArgs());

                AuditLog auditLog = AuditLog.builder()
                        .adminEmail(adminEmail)
                        .action(action.toUpperCase())
                        .details(details)
                        .ipAddress(ipAddress)
                        .build();

                auditLogRepository.save(auditLog);
                log.info("Audit log saved: {} by {}", action, adminEmail);
            }
        } catch (Exception e) {
            log.error("Failed to save audit log: {}", e.getMessage());
        }
    }
}
