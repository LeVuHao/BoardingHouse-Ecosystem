package com.roomily.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "landlord_registration_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LandlordRegistrationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    @Column(name = "id_card_number", length = 30)
    private String idCardNumber;

    @Column(name = "desired_password", length = 255)
    private String desiredPassword;

    @Column(name = "amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal amount = BigDecimal.valueOf(5000); // Phí kích hoạt tài khoản chủ trọ (demo: 5.000đ)

    @Column(name = "payment_code", unique = true, nullable = false, length = 64)
    private String paymentCode;

    @Column(name = "payment_status", nullable = false, length = 30)
    @Builder.Default
    private String paymentStatus = "PENDING"; // PENDING, PAID, CANCELLED

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    @Column(name = "admin_note", length = 500)
    private String adminNote;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "channel", length = 20)
    @Builder.Default
    private String channel = "ONLINE_QR"; // ONLINE_QR, OFFLINE_DIRECT

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
