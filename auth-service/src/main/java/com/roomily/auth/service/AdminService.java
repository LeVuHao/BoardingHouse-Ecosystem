package com.roomily.auth.service;

import com.roomily.auth.client.PropertyRentalClient;
import com.roomily.auth.dto.response.UserResponse;
import com.roomily.auth.entity.LandlordRegistrationRequest;
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
    private final com.roomily.auth.repository.LandlordRegistrationRequestRepository landlordRegistrationRequestRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
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

    public Page<UserResponse> listUsers(String role, String status, String keyword, Pageable pageable) {
        String filterRole = (role == null || role.isBlank()) ? null : role.toUpperCase();
        String filterStatus = (status == null || status.isBlank()) ? null : status.toUpperCase();
        String filterKeyword = (keyword == null || keyword.isBlank()) ? null : keyword.trim();

        Page<User> page = userRepository.searchUsers(filterRole, filterStatus, filterKeyword, pageable);
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

    @Transactional
    public UserResponse createLandlordDirectly(com.roomily.auth.dto.request.AdminCreateLandlordRequest req, String adminEmail) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new com.roomily.common.exception.BadRequestException("Email này đã tồn tại trong hệ thống");
        }

        User user = User.builder()
                .email(req.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName().trim())
                .phoneNumber(req.getPhoneNumber() != null ? req.getPhoneNumber().trim() : null)
                .idCardNumber(req.getIdCardNumber() != null ? req.getIdCardNumber().trim() : null)
                .role("LANDLORD")
                .status("ACTIVE")
                .provider("LOCAL")
                .emailVerified(true)
                .build();

        User saved = userRepository.save(user);

        // Lưu bản ghi offline vào bảng request để tiện đối soát
        String paymentCode = "OFFLINE_" + System.currentTimeMillis();
        com.roomily.auth.entity.LandlordRegistrationRequest logRequest = com.roomily.auth.entity.LandlordRegistrationRequest.builder()
                .fullName(saved.getFullName())
                .email(saved.getEmail())
                .phoneNumber(saved.getPhoneNumber() != null ? saved.getPhoneNumber() : "")
                .idCardNumber(saved.getIdCardNumber())
                .paymentCode(paymentCode)
                .amount(java.math.BigDecimal.ZERO)
                .paymentStatus("PAID")
                .status("APPROVED")
                .channel("OFFLINE_DIRECT")
                .adminNote("Admin (" + (adminEmail != null ? adminEmail : "Admin") + ") tạo trực tiếp: " + (req.getAdminNote() != null ? req.getAdminNote() : "Liên hệ ngoại tuyến"))
                .build();
        landlordRegistrationRequestRepository.save(logRequest);

        return UserResponse.fromEntity(saved);
    }

    public Page<com.roomily.auth.dto.response.LandlordRegistrationResponse> listRegistrationRequests(String status, String paymentStatus, String keyword, Pageable pageable) {
        String filterStatus = (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) ? null : status.toUpperCase();
        String filterPayment = (paymentStatus == null || paymentStatus.isBlank() || "ALL".equalsIgnoreCase(paymentStatus)) ? null : paymentStatus.toUpperCase();
        String filterKeyword = (keyword == null || keyword.isBlank()) ? null : keyword.trim();

        Page<com.roomily.auth.entity.LandlordRegistrationRequest> page = landlordRegistrationRequestRepository.searchRequests(filterStatus, filterPayment, filterKeyword, pageable);
        return page.map(com.roomily.auth.dto.response.LandlordRegistrationResponse::fromEntity);
    }

    @Transactional
    public com.roomily.auth.dto.response.LandlordRegistrationResponse approveRegistrationRequest(Long requestId, String adminEmail, String note) {
        com.roomily.auth.entity.LandlordRegistrationRequest req = landlordRegistrationRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đăng ký id: " + requestId));

        if ("APPROVED".equalsIgnoreCase(req.getStatus())) {
            throw new com.roomily.common.exception.BadRequestException("Đơn đăng ký này đã được duyệt trước đó");
        }

        // Tạo hoặc cập nhật User thành LANDLORD
        User user = userRepository.findByEmail(req.getEmail().trim().toLowerCase()).orElse(null);
        if (user == null) {
            user = User.builder()
                    .email(req.getEmail().trim().toLowerCase())
                    .fullName(req.getFullName().trim())
                    .phoneNumber(req.getPhoneNumber())
                    .idCardNumber(req.getIdCardNumber())
                    .password(req.getDesiredPassword() != null ? req.getDesiredPassword() : passwordEncoder.encode("123456"))
                    .role("LANDLORD")
                    .status("ACTIVE")
                    .provider("LOCAL")
                    .emailVerified(true)
                    .build();
        } else {
            user.setRole("LANDLORD");
            user.setStatus("ACTIVE");
            if (req.getPhoneNumber() != null && !req.getPhoneNumber().isBlank()) {
                user.setPhoneNumber(req.getPhoneNumber());
            }
            if (req.getIdCardNumber() != null && !req.getIdCardNumber().isBlank()) {
                user.setIdCardNumber(req.getIdCardNumber());
            }
            if (req.getDesiredPassword() != null && !req.getDesiredPassword().isBlank()) {
                user.setPassword(req.getDesiredPassword());
            }
        }
        userRepository.save(user);

        req.setStatus("APPROVED");
        req.setPaymentStatus("PAID");
        req.setAdminNote((req.getAdminNote() != null ? req.getAdminNote() + " | " : "") + "Duyệt bởi " + (adminEmail != null ? adminEmail : "Admin") + (note != null && !note.isBlank() ? ": " + note : ""));
        LandlordRegistrationRequest savedReq = landlordRegistrationRequestRepository.save(req);

        return com.roomily.auth.dto.response.LandlordRegistrationResponse.fromEntity(savedReq);
    }

    @Transactional
    public com.roomily.auth.dto.response.LandlordRegistrationResponse rejectRegistrationRequest(Long requestId, String adminEmail, String reason) {
        com.roomily.auth.entity.LandlordRegistrationRequest req = landlordRegistrationRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đăng ký id: " + requestId));

        if ("APPROVED".equalsIgnoreCase(req.getStatus())) {
            throw new com.roomily.common.exception.BadRequestException("Không thể từ chối đơn đăng ký đã được phê duyệt");
        }

        req.setStatus("REJECTED");
        req.setRejectionReason(reason != null && !reason.isBlank() ? reason.trim() : "Thông tin thanh toán hoặc giấy tờ chưa hợp lệ");
        req.setAdminNote((req.getAdminNote() != null ? req.getAdminNote() + " | " : "") + "Từ chối bởi " + (adminEmail != null ? adminEmail : "Admin"));
        LandlordRegistrationRequest savedReq = landlordRegistrationRequestRepository.save(req);

        return com.roomily.auth.dto.response.LandlordRegistrationResponse.fromEntity(savedReq);
    }
}
