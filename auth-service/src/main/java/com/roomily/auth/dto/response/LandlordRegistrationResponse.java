package com.roomily.auth.dto.response;

import com.roomily.auth.entity.LandlordRegistrationRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LandlordRegistrationResponse {

    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String idCardNumber;
    private BigDecimal amount;
    private String paymentCode;
    private String paymentStatus; // PENDING, PAID, CANCELLED
    private String status; // PENDING, APPROVED, REJECTED
    private String adminNote;
    private String rejectionReason;
    private String channel;
    private String qrImageUrl;
    private String bankName;
    private String bankAccount;
    private String accountHolder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static LandlordRegistrationResponse fromEntity(LandlordRegistrationRequest req) {
        if (req == null) return null;

        String bankName = "BIDV (Ngân hàng TMCP Đầu tư và Phát triển Việt Nam)";
        String bankCode = "BIDV";
        String bankAccount = "8890014407";
        String accountHolder = "LE VU HAO";

        String encodedHolder = URLEncoder.encode(accountHolder, StandardCharsets.UTF_8);
        String encodedCode = URLEncoder.encode(req.getPaymentCode(), StandardCharsets.UTF_8);
        long amountVal = req.getAmount() != null ? req.getAmount().longValue() : 199000L;

        String qrUrl = String.format(
                "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%d&addInfo=%s&accountName=%s",
                bankCode,
                bankAccount,
                amountVal,
                encodedCode,
                encodedHolder
        );

        return LandlordRegistrationResponse.builder()
                .id(req.getId())
                .fullName(req.getFullName())
                .email(req.getEmail())
                .phoneNumber(req.getPhoneNumber())
                .idCardNumber(req.getIdCardNumber())
                .amount(req.getAmount())
                .paymentCode(req.getPaymentCode())
                .paymentStatus(req.getPaymentStatus())
                .status(req.getStatus())
                .adminNote(req.getAdminNote())
                .rejectionReason(req.getRejectionReason())
                .channel(req.getChannel())
                .qrImageUrl(qrUrl)
                .bankName(bankName)
                .bankAccount(bankAccount)
                .accountHolder(accountHolder)
                .createdAt(req.getCreatedAt())
                .updatedAt(req.getUpdatedAt())
                .build();
    }
}
