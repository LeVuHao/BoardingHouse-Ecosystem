package com.roomily.auth.controller;

import com.roomily.auth.dto.request.ForgotPasswordRequest;
import com.roomily.auth.dto.request.GoogleLoginRequest;
import com.roomily.auth.dto.request.LandlordRegisterRequest;
import com.roomily.auth.dto.request.LoginRequest;
import com.roomily.auth.dto.request.RegisterRequest;
import com.roomily.auth.dto.request.ResetPasswordRequest;
import com.roomily.auth.dto.response.AuthResponse;
import com.roomily.auth.dto.response.UserResponse;
import com.roomily.auth.service.AuthService;
import com.roomily.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody RegisterRequest req) {
        UserResponse res = authService.register(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký tài khoản thành công", res));
    }

    @PostMapping("/landlord/register")
    public ResponseEntity<ApiResponse<UserResponse>> registerLandlord(@Valid @RequestBody LandlordRegisterRequest req) {
        UserResponse res = authService.registerLandlord(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký chủ trọ thành công", res));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest req) {
        AuthResponse res = authService.login(req);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", res));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(@Valid @RequestBody GoogleLoginRequest req) {
        AuthResponse res = authService.loginWithGoogle(req);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập bằng Google thành công", res));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        authService.sendPasswordResetCode(req);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi mã xác thực về email của bạn", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.ok(ApiResponse.success("Đặt lại mật khẩu thành công", null));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> getProfile(@RequestHeader("X-User-Id") Long userId) {
        UserResponse res = authService.getUserProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody com.roomily.auth.dto.request.UpdateProfileRequest req) {
        UserResponse res = authService.updateProfile(userId, req);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin thành công", res));
    }

    @GetMapping("/landlord/status/{userId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> getLandlordStatus(@PathVariable Long userId) {
        Map<String, String> res = authService.getUserStatus(userId);
        return ResponseEntity.ok(ApiResponse.success(res));
    }
}