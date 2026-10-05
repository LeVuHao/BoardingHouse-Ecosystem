package com.roomily.property.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Thông tin chủ trọ lấy từ AUTH-SERVICE. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LandlordInfo {
    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String avatarUrl;
    private String status;
}
