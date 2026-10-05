package com.roomily.property.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Body dùng chung cho PATCH .../status của Admin (khu trọ & bài đăng).
 * - Khu trọ: status = ACTIVE | HIDDEN
 * - Bài đăng: status = PENDING | APPROVED | REJECTED (REJECTED bắt buộc có reason)
 */
@Data
public class AdminStatusRequest {

    @NotBlank(message = "Trạng thái không được để trống")
    private String status;

    @Size(max = 500, message = "Lý do tối đa 500 ký tự")
    private String reason;
}
