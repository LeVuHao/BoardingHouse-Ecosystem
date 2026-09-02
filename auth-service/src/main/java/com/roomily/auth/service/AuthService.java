package com.roomily.auth.service;

import com.roomily.auth.dto.request.LandlordRegisterRequest;
import com.roomily.auth.dto.request.LoginRequest;
import com.roomily.auth.dto.request.RegisterRequest;
import com.roomily.auth.dto.response.AuthResponse;
import com.roomily.auth.dto.response.UserResponse;
import com.roomily.auth.entity.User;
import com.roomily.auth.repository.UserRepository;
import com.roomily.auth.security.JwtUtil;
import com.roomily.common.exception.BadRequestException;
import com.roomily.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public UserResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new BadRequestException("Email đã được sử dụng");
        }

        User user = User.builder()
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .phoneNumber(req.getPhoneNumber())
                .role("USER")
                .status("ACTIVE")
                .build();

        User savedUser = userRepository.save(user);
        return UserResponse.fromEntity(savedUser);
    }

    @Transactional
    public UserResponse registerLandlord(LandlordRegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new BadRequestException("Email đã được sử dụng");
        }

        User user = User.builder()
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .phoneNumber(req.getPhoneNumber())
                .idCardNumber(req.getIdCardNumber())
                .role("LANDLORD")
                .status("PENDING_PAYMENT")
                .build();

        User savedUser = userRepository.save(user);
        return UserResponse.fromEntity(savedUser);
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadRequestException("Email hoặc mật khẩu không chính xác"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new BadRequestException("Email hoặc mật khẩu không chính xác");
        }

        if ("SUSPENDED".equalsIgnoreCase(user.getStatus())) {
            throw new BadRequestException("Tài khoản của bạn đã bị khóa do vi phạm quy định");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole(), user.getFullName());

        return AuthResponse.builder()
                .token(token)
                .user(UserResponse.fromEntity(user))
                .build();
    }

    public UserResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        return UserResponse.fromEntity(user);
    }

    @Transactional
    public UserResponse activateLandlord(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chủ trọ"));
        user.setStatus("ACTIVE");
        return UserResponse.fromEntity(userRepository.save(user));
    }

    // Admin Features
    public Map<String, Object> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.countByRole("USER"));
        stats.put("totalLandlords", userRepository.countByRole("LANDLORD"));
        stats.put("activeLandlords", userRepository.findAll().stream().filter(u -> "LANDLORD".equals(u.getRole()) && "ACTIVE".equals(u.getStatus())).count());
        stats.put("pendingLandlords", userRepository.findAll().stream().filter(u -> "LANDLORD".equals(u.getRole()) && "PENDING_PAYMENT".equals(u.getStatus())).count());
        stats.put("suspendedAccounts", userRepository.countByStatus("SUSPENDED"));
        return stats;
    }

    public Page<UserResponse> listUsersByRole(String role, Pageable pageable) {
        if (role == null || role.isBlank()) {
            return userRepository.findAll(pageable).map(UserResponse::fromEntity);
        }
        return userRepository.findByRole(role.toUpperCase(), pageable).map(UserResponse::fromEntity);
    }

    @Transactional
    public UserResponse toggleUserStatus(Long userId, String newStatus) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        user.setStatus(newStatus);
        return UserResponse.fromEntity(userRepository.save(user));
    }
}
