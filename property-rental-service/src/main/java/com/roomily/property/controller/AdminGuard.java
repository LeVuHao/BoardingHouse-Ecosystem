package com.roomily.property.controller;

import com.roomily.property.exception.ForbiddenException;
import jakarta.servlet.http.HttpServletRequest;

final class AdminGuard {

    private AdminGuard() {}

    /** API Gateway đã chặn non-admin; đây là lớp bảo vệ thứ hai (giống AdminController của auth-service). */
    static void requireAdmin(String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            throw new ForbiddenException("Bạn không có quyền thực hiện hành động này");
        }
    }

    static String clientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
