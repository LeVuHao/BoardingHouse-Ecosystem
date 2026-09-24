package com.roomily.auth.service;

import com.roomily.auth.client.PropertyRentalClient;
import com.roomily.auth.dto.response.UserResponse;
import com.roomily.auth.entity.User;
import com.roomily.auth.repository.UserRepository;
import com.roomily.common.dto.ApiResponse;
import com.roomily.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PropertyRentalClient propertyRentalClient;

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("totalUsers", userRepository.countByRole("USER"));
        stats.put("totalLandlords", userRepository.countByRole("LANDLORD"));
        stats.put("activeLandlords", userRepository.countByRoleAndStatus("LANDLORD", "ACTIVE"));
        stats.put("suspendedAccounts", userRepository.countByStatus("SUSPENDED"));

        try {
            ApiResponse<Map<String, Long>> propertyRes = propertyRentalClient.getAdminPropertyCount();
            if (propertyRes != null && propertyRes.getData() != null) {
                stats.putAll(propertyRes.getData());
            } else {
                stats.put("totalProperties", 0L);
                stats.put("totalRooms", 0L);
            }
        } catch (Exception ex) {
            log.warn("Property-Rental Service unavailable for admin stats: {}", ex.getMessage());
            stats.put("totalProperties", 0L);
            stats.put("totalRooms", 0L);
        }

        return stats;
    }

    public Page<UserResponse> listUsers(String role, String status, Pageable pageable) {
        Page<User> page;
        if ((role == null || role.isBlank()) && (status == null || status.isBlank())) {
            page = userRepository.findAll(pageable);
        } else if (role != null && !role.isBlank() && status != null && !status.isBlank()) {
            page = userRepository.findByRoleAndStatus(role.toUpperCase(), status.toUpperCase(), pageable);
        } else if (role != null && !role.isBlank()) {
            page = userRepository.findByRole(role.toUpperCase(), pageable);
        } else {
            page = userRepository.findByStatus(status.toUpperCase(), pageable);
        }
        return page.map(UserResponse::fromEntity);
    }

    @Transactional
    public UserResponse lockUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với id: " + userId));
        if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new com.roomily.common.exception.BadRequestException("Không thể khóa tài khoản quản trị viên");
        }
        user.setStatus("SUSPENDED");
        return UserResponse.fromEntity(userRepository.save(user));
    }

    @Transactional
    public UserResponse unlockUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với id: " + userId));
        user.setStatus("ACTIVE");
        return UserResponse.fromEntity(userRepository.save(user));
    }
}
