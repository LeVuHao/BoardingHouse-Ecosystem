package com.roomily.property.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRentalRequestDto {
    private Long roomId;
    private Long postId;
    private String senderName;
    private String senderPhone;
    private String note;
}

