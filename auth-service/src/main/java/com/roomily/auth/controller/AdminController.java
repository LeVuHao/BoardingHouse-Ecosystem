package com.roomily.auth.controller;

import com.roomily.auth.dto.response.UserResponse;
import com.roomily.auth.service.AdminService;
import com.roomily.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
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
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        Map<String, Object> stats = adminService.getStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> listUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        Page<UserResponse> users = adminService.listUsers(role, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PutMapping("/users/{id}/lock")
    public ResponseEntity<ApiResponse<UserResponse>> lockUser(@PathVariable Long id) {
        UserResponse user = adminService.lockUser(id);
        return ResponseEntity.ok(ApiResponse.success("Đã khóa tài khoản thành công", user));
    }

    @PutMapping("/users/{id}/unlock")
    public ResponseEntity<ApiResponse<UserResponse>> unlockUser(@PathVariable Long id) {
        UserResponse user = adminService.unlockUser(id);
        return ResponseEntity.ok(ApiResponse.success("Đã mở khóa tài khoản thành công", user));
    }
}
