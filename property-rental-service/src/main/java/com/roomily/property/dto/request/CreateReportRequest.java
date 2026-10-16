package com.roomily.property.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateReportRequest {

    @NotBlank(message = "Loại đối tượng báo cáo không được để trống (ROOM hoặc FORUM_POST)")
    private String targetType;

    @NotNull(message = "ID đối tượng báo cáo không được để trống")
    private Long targetId;

    @NotBlank(message = "Vui lòng chọn lý do báo cáo vi phạm")
    private String reason;

    @NotBlank(message = "Vui lòng nhập mô tả chi tiết sự việc")
    private String description;

    private List<String> evidenceImages;
}
