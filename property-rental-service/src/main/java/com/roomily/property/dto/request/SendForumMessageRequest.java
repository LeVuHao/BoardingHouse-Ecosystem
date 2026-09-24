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
public class SendForumMessageRequest {

    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    private String content;

    private String senderName;

    private String senderPhone;
}
