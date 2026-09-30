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
public class UpdateTicketStatusRequest {

    @NotBlank(message = "Trạng thái không được để trống")
    private String status; // IN_PROGRESS | RESOLVED

    private String landlordNote; // Ghi chú xử lý (tùy chọn)
}
