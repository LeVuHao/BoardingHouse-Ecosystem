package com.roomily.property.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRoomRequest {
    private String roomNumber;
    private BigDecimal price;
    private BigDecimal area;
    private Integer capacity;
    private String status; // AVAILABLE | MAINTENANCE
}
