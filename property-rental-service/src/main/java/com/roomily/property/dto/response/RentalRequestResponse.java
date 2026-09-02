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
    private Long roomId;
    private String note;
    private String status;
    private LocalDateTime createdAt;

    public static RentalRequestResponse fromEntity(RentalRequest r) {
        if (r == null) return null;
        return RentalRequestResponse.builder()
                .id(r.getId())
                .userId(r.getUserId())
                .roomId(r.getRoomId())
                .note(r.getNote())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
