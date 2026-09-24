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
    private BigDecimal otherAmount;
    private BigDecimal totalAmount;
    private String status;
    private LocalDate dueDate;
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
                .otherAmount(b.getOtherAmount())
                .totalAmount(b.getTotalAmount())
                .status(b.getStatus())
                .dueDate(b.getDueDate())
                .createdAt(b.getCreatedAt())
                .build();
    }
}
