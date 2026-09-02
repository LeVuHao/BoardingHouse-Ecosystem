package com.roomily.property.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRentalRequestDto {
    @NotNull(message = "Room ID is required")
    private Long roomId;
    private String note;
}
