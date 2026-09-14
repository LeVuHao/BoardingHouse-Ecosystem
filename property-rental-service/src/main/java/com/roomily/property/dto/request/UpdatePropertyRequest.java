package com.roomily.property.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePropertyRequest {
    private String title;
    private String description;
    private String address;
    private String city;
    private String district;
    private String ward;
    private String utilities;
}
