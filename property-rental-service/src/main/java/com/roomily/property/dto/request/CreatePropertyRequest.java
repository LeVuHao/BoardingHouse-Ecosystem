package com.roomily.property.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePropertyRequest {
    @NotBlank(message = "Title is required")
    private String title;
    private String description;
    @NotBlank(message = "Address is required")
    private String address;
    @NotBlank(message = "City is required")
    private String city;
    @NotBlank(message = "District is required")
    private String district;
    @NotBlank(message = "Ward is required")
    private String ward;
    private String utilities;
}
