package com.roomily.property.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AmenityRequest {

    @NotBlank(message = "Tên tiện ích không được để trống")
    @Size(max = 100, message = "Tên tiện ích tối đa 100 ký tự")
    private String name;

    @Size(max = 100, message = "Icon tối đa 100 ký tự")
    private String icon;

    private Boolean active;

    private Integer sortOrder;
}
