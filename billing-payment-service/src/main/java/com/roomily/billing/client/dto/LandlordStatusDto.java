package com.roomily.billing.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LandlordStatusDto {
    private Long id;
    private String role;
    private String status;
}