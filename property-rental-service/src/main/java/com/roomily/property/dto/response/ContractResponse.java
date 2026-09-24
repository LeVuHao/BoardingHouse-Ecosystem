package com.roomily.property.dto.response;

import com.roomily.property.entity.Contract;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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

    // Thông tin chi tiết trọ để phô diễn giao diện "Trọ của tôi"
    private String roomNumber;
    private String propertyTitle;
    private String address;
    private String city;
    private String district;
    private String ward;
    private BigDecimal roomArea;
    private Integer capacity;
    private Integer currentOccupants;
    private List<String> images;
    private String landlordName;
    private String landlordPhone;
    private String utilities;
    private Long postId;
    private List<String> roommates;

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
