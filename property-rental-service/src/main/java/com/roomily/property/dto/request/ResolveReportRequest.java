package com.roomily.property.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResolveReportRequest {

    @NotBlank(message = "Vui lòng chọn hành động xử lý (WARNING, HIDE_POST, BAN_USER, DISMISS)")
    private String action;

    private String adminNote;
}
