package com.roomily.property.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateReviewRequest {

    @NotNull(message = "Đánh giá an ninh không được để trống")
    @Min(value = 1) @Max(value = 5)
    private Integer securityRating;

    @NotNull(message = "Đánh giá vệ sinh không được để trống")
    @Min(value = 1) @Max(value = 5)
    private Integer cleanlinessRating;

    @NotNull(message = "Đánh giá giá cả không được để trống")
    @Min(value = 1) @Max(value = 5)
    private Integer priceRating;

    @NotNull(message = "Đánh giá chủ trọ không được để trống")
    @Min(value = 1) @Max(value = 5)
    private Integer landlordRating;

    private String comment;
}
