package com.roomily.billing.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bills")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contract_id", nullable = false)
    private Long contractId;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(name = "landlord_id", nullable = false)
    private Long landlordId;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(nullable = false, length = 10)
    private String monthYear; // 'YYYY-MM'

    @Column(name = "room_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal roomAmount = BigDecimal.ZERO;

    @Column(name = "electricity_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal electricityAmount = BigDecimal.ZERO;

    @Column(name = "water_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal waterAmount = BigDecimal.ZERO;

    @Column(name = "garbage_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal garbageAmount = BigDecimal.ZERO;

    @Column(name = "wifi_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal wifiAmount = BigDecimal.ZERO;

    @Column(name = "other_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal otherAmount = BigDecimal.ZERO;

    @Column(name = "other_description", length = 255)
    private String otherDescription;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "UNPAID"; // UNPAID | PAID | OVERDUE

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "bank_name", length = 50)
    private String bankName;

    @Column(name = "bank_account", length = 50)
    private String bankAccount;

    @Column(name = "bank_owner", length = 100)
    private String bankOwner;

    @Column(name = "qr_image_url", columnDefinition = "LONGTEXT")
    private String qrImageUrl;

    @Column(columnDefinition = "TEXT")
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
