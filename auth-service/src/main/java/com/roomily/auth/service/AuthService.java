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
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final VerificationCodeRepository verificationCodeRepository;
    private final MailService mailService;

    private final SecureRandom secureRandom = new SecureRandom();

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
