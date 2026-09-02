package com.roomily.auth.controller;

import com.roomily.auth.dto.response.UserResponse;
import com.roomily.auth.service.AuthService;
import com.roomily.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AuthService authService;

    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        Map<String, Object> stats = authService.getAdminStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> listUsers(
            @RequestParam(required = false) String role,
            Pageable pageable) {
        Page<UserResponse> users = authService.listUsersByRole(role, pageable);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        UserResponse user = authService.toggleUserStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công", user));
    }
}
