package com.roomily.property.dto.response;

import com.roomily.property.entity.Contract;
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
public class ContractResponse {
    private Long id;
    private Long roomId;
    private Long userId;
    private Long landlordId;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal rentalPrice;
    private BigDecimal depositAmount;
    private String status;
    private LocalDateTime createdAt;

    public static ContractResponse fromEntity(Contract c) {
        if (c == null) return null;
        return ContractResponse.builder()
                .id(c.getId())
                .roomId(c.getRoomId())
                .userId(c.getUserId())
                .landlordId(c.getLandlordId())
                .startDate(c.getStartDate())
                .endDate(c.getEndDate())
                .rentalPrice(c.getRentalPrice())
                .depositAmount(c.getDepositAmount())
                .status(c.getStatus())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
