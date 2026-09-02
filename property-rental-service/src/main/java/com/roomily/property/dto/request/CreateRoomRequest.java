package com.roomily.property.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRoomRequest {
    @NotNull(message = "Property ID is required")
    private Long propertyId;

    @NotBlank(message = "Room number is required")
    private String roomNumber;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal price;

    @NotNull(message = "Area is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Area must be greater than 0")
    private BigDecimal area;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    private List<String> imageUrls;
}
