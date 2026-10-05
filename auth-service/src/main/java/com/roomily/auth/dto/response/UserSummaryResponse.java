package com.roomily.auth.dto.response;

import com.roomily.auth.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Thông tin rút gọn của người dùng, dùng cho các service nội bộ (không chứa CCCD...).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String avatarUrl;
    private String status;

    public static UserSummaryResponse fromEntity(User u) {
        if (u == null) return null;
        return UserSummaryResponse.builder()
                .id(u.getId())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .phoneNumber(u.getPhoneNumber())
                .avatarUrl(u.getAvatarUrl())
                .status(u.getStatus())
                .build();
    }
}
