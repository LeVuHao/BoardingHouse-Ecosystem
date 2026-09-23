package com.roomily.auth.controller;

import com.roomily.auth.dto.response.UserResponse;
import com.roomily.auth.service.AdminService;
import com.roomily.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import com.roomily.common.exception.BadRequestException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

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
            Pageable pageable) {
        requireAdmin(userRole);
        Page<UserResponse> users = adminService.listUsers(role, status, keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(users));
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
