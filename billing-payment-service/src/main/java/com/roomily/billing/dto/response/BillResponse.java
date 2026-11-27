package com.roomily.billing.dto.response;

import com.roomily.billing.entity.Bill;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillResponse {
    private Long id;
    private Long contractId;
    private Long roomId;
    private Long landlordId;
    private Long tenantId;
    private String monthYear;
    private BigDecimal roomAmount;
    private BigDecimal electricityAmount;
    private BigDecimal waterAmount;
    private BigDecimal garbageAmount;
    private BigDecimal wifiAmount;
    private BigDecimal otherAmount;
    private String otherDescription;
    private BigDecimal totalAmount;
    private String status;
    private LocalDate issueDate;
    private LocalDate dueDate;
    private String bankName;
    private String bankAccount;
    private String bankOwner;
    private String qrImageUrl;
    private String note;
    private LocalDateTime createdAt;

    public static BillResponse fromEntity(Bill b) {
        if (b == null) return null;
        return BillResponse.builder()
                .id(b.getId())
                .contractId(b.getContractId())
                .roomId(b.getRoomId())
                .landlordId(b.getLandlordId())
                .tenantId(b.getTenantId())
                .monthYear(b.getMonthYear())
                .roomAmount(b.getRoomAmount())
                .electricityAmount(b.getElectricityAmount())
                .waterAmount(b.getWaterAmount())
                .garbageAmount(b.getGarbageAmount())
                .wifiAmount(b.getWifiAmount())
                .otherAmount(b.getOtherAmount())
                .otherDescription(b.getOtherDescription())
                .totalAmount(b.getTotalAmount())
                .status(b.getStatus())
                .issueDate(b.getIssueDate() != null ? b.getIssueDate() : (b.getCreatedAt() != null ? b.getCreatedAt().toLocalDate() : null))
                .dueDate(b.getDueDate())
                .bankName(b.getBankName())
                .bankAccount(b.getBankAccount())
                .bankOwner(b.getBankOwner())
                .qrImageUrl(b.getQrImageUrl())
                .note(b.getNote())
                .createdAt(b.getCreatedAt())
                .build();
    }
}
