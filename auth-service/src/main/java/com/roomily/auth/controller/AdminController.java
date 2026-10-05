package com.roomily.auth.controller;

import com.roomily.auth.dto.response.AuditLogResponse;
import com.roomily.auth.dto.response.UserResponse;
import com.roomily.auth.service.AuditLogService;
import com.roomily.auth.service.AdminService;
import com.roomily.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import com.roomily.common.exception.BadRequestException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final AuditLogService auditLogService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats(@RequestHeader("X-User-Role") String role) {
        requireAdmin(role);
        Map<String, Object> stats = adminService.getStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> listUsers(
            @RequestHeader("X-User-Role") String userRole,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        requireAdmin(userRole);
        Page<UserResponse> users = adminService.listUsers(role, status, keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> listAuditLogs(
            @RequestHeader("X-User-Role") String userRole,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        requireAdmin(userRole);
        return ResponseEntity.ok(ApiResponse.success(auditLogService.search(keyword, action, from, to, pageable)));
    }

    @GetMapping("/audit-logs/actions")
    public ResponseEntity<ApiResponse<List<String>>> listAuditActions(@RequestHeader("X-User-Role") String userRole) {
        requireAdmin(userRole);
        return ResponseEntity.ok(ApiResponse.success(auditLogService.listActions()));
    }

    @PutMapping("/users/{id}/lock")
    public ResponseEntity<ApiResponse<UserResponse>> lockUser(@RequestHeader("X-User-Role") String role, @PathVariable Long id) {
        requireAdmin(role);
        UserResponse user = adminService.lockUser(id);
        return ResponseEntity.ok(ApiResponse.success("Đã khóa tài khoản thành công", user));
    }

    @PutMapping("/users/{id}/unlock")
    public ResponseEntity<ApiResponse<UserResponse>> unlockUser(@RequestHeader("X-User-Role") String role, @PathVariable Long id) {
        requireAdmin(role);
        UserResponse user = adminService.unlockUser(id);
        return ResponseEntity.ok(ApiResponse.success("Đã mở khóa tài khoản thành công", user));
    }

    private void requireAdmin(String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            throw new BadRequestException("Bạn không có quyền thực hiện hành động này");
        }
    }
}
