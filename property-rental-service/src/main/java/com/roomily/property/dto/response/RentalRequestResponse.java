package com.roomily.property.dto.response;

import com.roomily.property.entity.RentalRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentalRequestResponse {
    private Long id;
    private Long userId;
    private Long landlordId;
    private Long roomId;
    private String roomNumber;
    private String propertyTitle;
    private Long postId;
    private String postTitle;
    private String senderName;
    private String senderPhone;
    private String note;
    private String status;
    private LocalDateTime createdAt;

    public static RentalRequestResponse fromEntity(RentalRequest r) {
        if (r == null) return null;
        return RentalRequestResponse.builder()
                .id(r.getId())
                .userId(r.getUserId())
                .landlordId(r.getLandlordId())
                .roomId(r.getRoomId())
                .postId(r.getPostId())
                .senderName(r.getSenderName())
                .senderPhone(r.getSenderPhone())
                .note(r.getNote())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
