package com.roomily.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 100, message = "Họ tên không vượt quá 100 ký tự")
    private String fullName;

    @Size(max = 20, message = "Số điện thoại không hợp lệ")
    private String phoneNumber;

    @Size(max = 20, message = "Số CCCD/CMND không hợp lệ")
    private String idCardNumber;

    @Size(max = 500, message = "Đường dẫn ảnh đại diện quá dài")
    private String avatarUrl;
}
