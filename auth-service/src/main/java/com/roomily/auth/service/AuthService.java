package com.roomily.auth.service;

import com.roomily.auth.dto.request.ForgotPasswordRequest;
import com.roomily.auth.dto.request.GoogleLoginRequest;
import com.roomily.auth.dto.request.LandlordRegisterRequest;
import com.roomily.auth.dto.request.LoginRequest;
import com.roomily.auth.dto.request.RegisterRequest;
import com.roomily.auth.dto.request.ResetPasswordRequest;
import com.roomily.auth.dto.response.AuthResponse;
import com.roomily.auth.dto.response.UserResponse;
import com.roomily.auth.entity.User;
import com.roomily.auth.entity.VerificationCode;
import com.roomily.auth.repository.UserRepository;
import com.roomily.auth.repository.VerificationCodeRepository;
import com.roomily.auth.security.JwtUtil;
import com.roomily.common.exception.BadRequestException;
import com.roomily.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    public static final String CODE_TYPE_RESET_PASSWORD = "PASSWORD_RESET";
    private static final List<String> VALID_ROLES = List.of("USER", "LANDLORD");
    private static final int CODE_EXPIRE_MINUTES = 10;

    private final UserRepository userRepository;
    private final com.roomily.auth.repository.LandlordRegistrationRequestRepository landlordRegistrationRequestRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final VerificationCodeRepository verificationCodeRepository;
    private final MailService mailService;

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public com.roomily.auth.dto.response.LandlordRegistrationResponse createLandlordRequest(com.roomily.auth.dto.request.CreateLandlordApplicationRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            User existing = userRepository.findByEmail(req.getEmail()).orElse(null);
            if (existing != null && "LANDLORD".equalsIgnoreCase(existing.getRole())) {
                throw new BadRequestException("Email này đã có tài khoản chủ trọ trong hệ thống");
            }
        }

        // Sinh mã thanh toán độc nhất: SEPAY_<timestamp 6 so cuoi>_<random 3 chu>
        String randomSuffix = String.format("%04d", secureRandom.nextInt(10000));
        String code = "SEPAY_LL_" + System.currentTimeMillis() % 1000000 + "_" + randomSuffix;

        java.math.BigDecimal reqAmount = (req.getAmount() != null && req.getAmount().compareTo(java.math.BigDecimal.ZERO) > 0)
                ? req.getAmount()
                : java.math.BigDecimal.valueOf(5000);

        com.roomily.auth.entity.LandlordRegistrationRequest request = com.roomily.auth.entity.LandlordRegistrationRequest.builder()
                .fullName(req.getFullName().trim())
                .email(req.getEmail().trim().toLowerCase())
                .phoneNumber(req.getPhoneNumber().trim())
                .idCardNumber(req.getIdCardNumber() != null ? req.getIdCardNumber().trim() : null)
                .desiredPassword(passwordEncoder.encode(req.getDesiredPassword()))
                .amount(reqAmount)
                .paymentCode(code)
                .paymentStatus("PENDING")
                .status("PENDING")
                .channel("ONLINE_QR")
                .build();

        com.roomily.auth.entity.LandlordRegistrationRequest saved = landlordRegistrationRequestRepository.save(request);
        return com.roomily.auth.dto.response.LandlordRegistrationResponse.fromEntity(saved);
    }

    public com.roomily.auth.dto.response.LandlordRegistrationResponse getLandlordRequestByCode(String code) {
        com.roomily.auth.entity.LandlordRegistrationRequest req = landlordRegistrationRequestRepository.findByPaymentCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu đăng ký với mã: " + code));
        return com.roomily.auth.dto.response.LandlordRegistrationResponse.fromEntity(req);
    }

    @Transactional
    public boolean processSepayWebhook(com.roomily.auth.dto.request.SepayWebhookRequest webhook) {
        if (webhook == null) return false;
        
        // Kiểm tra loại giao dịch: chỉ xử lý tiền vào (in) hoặc transferAmount > 0
        if (webhook.getTransferAmount() == null || webhook.getTransferAmount().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            log.info("[SePay Webhook] Bỏ qua giao dịch không phải nạp tiền: {}", webhook);
            return false;
        }

        String content = webhook.getContent() != null ? webhook.getContent().toUpperCase() : "";
        String code = webhook.getCode() != null ? webhook.getCode().toUpperCase() : "";
        String normalizedContent = content.replaceAll("[^A-Z0-9]", "");
        String normalizedCode = code.replaceAll("[^A-Z0-9]", "");

        // Tìm kiếm tất cả đơn PENDING để đối soát nội dung
        java.util.List<com.roomily.auth.entity.LandlordRegistrationRequest> pendingRequests = 
                landlordRegistrationRequestRepository.findAll().stream()
                        .filter(r -> "PENDING".equalsIgnoreCase(r.getStatus()))
                        .collect(java.util.stream.Collectors.toList());

        com.roomily.auth.entity.LandlordRegistrationRequest matchedRequest = null;

        for (com.roomily.auth.entity.LandlordRegistrationRequest req : pendingRequests) {
            String pCode = req.getPaymentCode() != null ? req.getPaymentCode().toUpperCase() : "";
            String normalizedPCode = pCode.replaceAll("[^A-Z0-9]", "");

            if (!pCode.isBlank() && (
                    content.contains(pCode) || 
                    code.contains(pCode) || 
                    (!normalizedPCode.isEmpty() && (normalizedContent.contains(normalizedPCode) || normalizedCode.contains(normalizedPCode)))
            )) {
                matchedRequest = req;
                break;
            }
        }

        if (matchedRequest == null) {
            log.warn("[SePay Webhook] Không tìm thấy đơn đăng ký PENDING nào khớp với nội dung: {}", content);
            return false;
        }

        log.info("[SePay Webhook] Khớp đơn đăng ký ID: {}, Email: {}, Số tiền: {}", 
                matchedRequest.getId(), matchedRequest.getEmail(), webhook.getTransferAmount());

        // Kích hoạt User thành LANDLORD
        String email = matchedRequest.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            user = User.builder()
                    .email(email)
                    .fullName(matchedRequest.getFullName().trim())
                    .phoneNumber(matchedRequest.getPhoneNumber())
                    .idCardNumber(matchedRequest.getIdCardNumber())
                    .password(matchedRequest.getDesiredPassword() != null ? matchedRequest.getDesiredPassword() : passwordEncoder.encode("123456"))
                    .role("LANDLORD")
                    .status("ACTIVE")
                    .provider("LOCAL")
                    .emailVerified(true)
                    .build();
        } else {
            user.setRole("LANDLORD");
            user.setStatus("ACTIVE");
            if (matchedRequest.getPhoneNumber() != null && !matchedRequest.getPhoneNumber().isBlank()) {
                user.setPhoneNumber(matchedRequest.getPhoneNumber());
            }
            if (matchedRequest.getIdCardNumber() != null && !matchedRequest.getIdCardNumber().isBlank()) {
                user.setIdCardNumber(matchedRequest.getIdCardNumber());
            }
            if (matchedRequest.getDesiredPassword() != null && !matchedRequest.getDesiredPassword().isBlank()) {
                user.setPassword(matchedRequest.getDesiredPassword());
            }
        }
        userRepository.save(user);

        // Cập nhật trạng thái đơn
        matchedRequest.setStatus("APPROVED");
        matchedRequest.setPaymentStatus("PAID");
        matchedRequest.setAdminNote((matchedRequest.getAdminNote() != null ? matchedRequest.getAdminNote() + " | " : "") 
                + "Tự động kích hoạt qua SePay Webhook (Mã GD: " + webhook.getId() + " - " + webhook.getGateway() + ")");
        landlordRegistrationRequestRepository.save(matchedRequest);

        log.info("[SePay Webhook] Đã kích hoạt tài khoản Chủ trọ thành công cho email: {}", email);
        return true;
    }


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
                .status("ACTIVE")
                .build();

        User savedUser = userRepository.save(user);
        return UserResponse.fromEntity(savedUser);
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadRequestException("Email hoặc mật khẩu không chính xác"));

        if ("GOOGLE".equalsIgnoreCase(user.getProvider()) || user.getPassword() == null) {
            throw new BadRequestException("Tài khoản này đăng nhập bằng Google, vui lòng dùng 'Tiếp tục với Google'");
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new BadRequestException("Email hoặc mật khẩu không chính xác");
        }

        if ("SUSPENDED".equalsIgnoreCase(user.getStatus())) {
            throw new BadRequestException("Tài khoản của bạn đã bị khóa do vi phạm quy định");
        }

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse loginWithGoogle(GoogleLoginRequest req) {
        GoogleTokenVerifier.GoogleProfile profile = googleTokenVerifier.verify(req.getIdToken());

        return userRepository.findByEmail(profile.email())
                .map(user -> {
                    if (user.getProviderId() == null) {
                        user.setProviderId(profile.sub());
                    }
                    if (user.getPhoneNumber() == null && req.getPhoneNumber() != null) {
                        user.setPhoneNumber(req.getPhoneNumber());
                    }
                    return buildAuthResponse(user);
                })
                .orElseGet(() -> createGoogleUser(req, profile));
    }

    private AuthResponse createGoogleUser(GoogleLoginRequest req, GoogleTokenVerifier.GoogleProfile profile) {
        String role = req.getRole() == null ? "USER" : req.getRole().toUpperCase();
        if (!VALID_ROLES.contains(role)) {
            throw new BadRequestException("Vai trò không hợp lệ");
        }

        boolean missingInfo = isBlank(req.getPhoneNumber())
                || ("LANDLORD".equals(role) && isBlank(req.getIdCardNumber()));

        if (missingInfo) {
            return AuthResponse.builder()
                    .token(null)
                    .user(null)
                    .needsProfile(true)
                    .build();
        }

        User user = User.builder()
                .email(profile.email())
                .password(null)
                .fullName(profile.name() == null || profile.name().isBlank()
                        ? profile.email().substring(0, profile.email().indexOf('@'))
                        : profile.name())
                .phoneNumber(req.getPhoneNumber())
                .idCardNumber("LANDLORD".equals(role) ? req.getIdCardNumber() : null)
                .role(role)
                .status("ACTIVE")
                .provider("GOOGLE")
                .providerId(profile.sub())
                .emailVerified(true)
                .build();

        User savedUser = userRepository.save(user);
        return buildAuthResponse(savedUser);
    }

    private AuthResponse buildAuthResponse(User user) {
        if ("SUSPENDED".equalsIgnoreCase(user.getStatus())) {
            throw new BadRequestException("Tài khoản của bạn đã bị khóa do vi phạm quy định");
        }
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole(), user.getFullName());
        return AuthResponse.builder()
                .token(token)
                .user(UserResponse.fromEntity(user))
                .needsProfile(false)
                .build();
    }

    @Transactional
    public void sendPasswordResetCode(ForgotPasswordRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadRequestException("Email chưa được đăng ký"));

        if ("GOOGLE".equalsIgnoreCase(user.getProvider()) || user.getPassword() == null) {
            throw new BadRequestException("Tài khoản này đăng nhập bằng Google, không thể đặt lại mật khẩu");
        }

        String code = generateCode();
        verificationCodeRepository.deleteByUserIdAndType(user.getId(), CODE_TYPE_RESET_PASSWORD);
        verificationCodeRepository.save(VerificationCode.builder()
                .userId(user.getId())
                .code(code)
                .type(CODE_TYPE_RESET_PASSWORD)
                .used(false)
                .expiresAt(LocalDateTime.now().plusMinutes(CODE_EXPIRE_MINUTES))
                .build());

        mailService.sendPasswordResetCode(user.getEmail(), code);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadRequestException("Email chưa được đăng ký"));

        if ("GOOGLE".equalsIgnoreCase(user.getProvider()) || user.getPassword() == null) {
            throw new BadRequestException("Tài khoản này đăng nhập bằng Google, không thể đặt lại mật khẩu");
        }

        VerificationCode code = verificationCodeRepository
                .findTopByUserIdAndTypeOrderByIdDesc(user.getId(), CODE_TYPE_RESET_PASSWORD)
                .orElseThrow(() -> new BadRequestException("Vui lòng yêu cầu mã xác thực trước"));

        if (code.isUsed() || code.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Mã xác thực không hợp lệ hoặc đã hết hạn");
        }
        if (!code.getCode().equals(req.getCode())) {
            throw new BadRequestException("Mã xác thực không chính xác");
        }

        code.setUsed(true);
        verificationCodeRepository.save(code);

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }

    public UserResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        return UserResponse.fromEntity(user);
    }

    @Transactional
    public UserResponse updateProfile(Long userId, com.roomily.auth.dto.request.UpdateProfileRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        if (req.getFullName() != null && !req.getFullName().isBlank()) {
            user.setFullName(req.getFullName().trim());
        }
        if (req.getPhoneNumber() != null) {
            user.setPhoneNumber(req.getPhoneNumber().trim());
        }
        if (req.getIdCardNumber() != null) {
            user.setIdCardNumber(req.getIdCardNumber().trim());
        }
        if (req.getAvatarUrl() != null) {
            user.setAvatarUrl(req.getAvatarUrl().trim());
        }

        User updated = userRepository.save(user);
        return UserResponse.fromEntity(updated);
    }

    public UserResponse getUserInfo(Long requesterId, Long targetId, String requesterRole) {
        boolean privileged = "LANDLORD".equalsIgnoreCase(requesterRole) || "ADMIN".equalsIgnoreCase(requesterRole);
        if (!privileged && !targetId.equals(requesterId)) {
            throw new BadRequestException("Bạn không có quyền xem thông tin người dùng khác");
        }
        User user = userRepository.findById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        return UserResponse.fromEntity(user);
    }

    public Map<String, String> getUserStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        Map<String, String> result = new HashMap<>();
        result.put("role", user.getRole());
        result.put("status", user.getStatus());
        return result;
    }
    private String generateCode() {
        return String.format("%06d", secureRandom.nextInt(1_000_000));
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
