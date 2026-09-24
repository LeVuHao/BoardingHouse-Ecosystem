package com.roomily.property.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRoommatePostRequest {
    @NotNull(message = "Room ID is required")
    private Long roomId;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Price share is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price share must be greater than 0")
    private BigDecimal priceShare;
}
