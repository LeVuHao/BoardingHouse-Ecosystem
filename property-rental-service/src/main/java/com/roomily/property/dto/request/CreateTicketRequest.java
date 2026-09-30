package com.roomily.property.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTicketRequest {

    @NotNull(message = "roomId không được để trống")
    private Long roomId;

    @NotBlank(message = "Loại sự cố không được để trống")
    private String category; // ELECTRICAL | PLUMBING | APPLIANCE | STRUCTURAL | SECURITY | CLEANING | OTHER

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 200, message = "Tiêu đề tối đa 200 ký tự")
    private String title;

    @NotBlank(message = "Mô tả chi tiết không được để trống")
    private String description;

    private String urgency; // LOW | NORMAL | HIGH | URGENT (default NORMAL)

    private List<String> imageUrls; // Danh sách URL ảnh đính kèm (optional)
}
