package com.roomily.property.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
    private Long roomId;
    private Long postId;
    private String senderName;
    private String senderPhone;
    private String note;
    @Min(value = 1, message = "Duration months must be at least 1")
    @Max(value = 36, message = "Duration months must not exceed 36")
    private Integer durationMonths;
}

