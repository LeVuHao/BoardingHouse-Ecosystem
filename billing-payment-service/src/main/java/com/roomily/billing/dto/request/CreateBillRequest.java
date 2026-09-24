package com.roomily.billing.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBillRequest {
    @NotNull(message = "Contract ID is required")
    private Long contractId;

    @NotNull(message = "Room ID is required")
    private Long roomId;

    @NotNull(message = "Tenant ID is required")
    private Long tenantId;

    @NotBlank(message = "Month Year is required (YYYY-MM)")
    private String monthYear;

    @NotNull(message = "Room amount is required")
    @DecimalMin(value = "0.0", message = "Room amount must be >= 0")
    private BigDecimal roomAmount;

    private BigDecimal electricityAmount;
    private BigDecimal waterAmount;
    private BigDecimal otherAmount;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;
}
