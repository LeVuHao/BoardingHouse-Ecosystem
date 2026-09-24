package com.roomily.property.dto.response;

import com.roomily.property.entity.JoinRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JoinRequestResponse {
    private Long id;
    private Long postId;
    private Long userId;
    private String introduction;
    private String status;
    private LocalDateTime createdAt;

    public static JoinRequestResponse fromEntity(JoinRequest r) {
        if (r == null) return null;
        return JoinRequestResponse.builder()
                .id(r.getId())
                .postId(r.getPost() != null ? r.getPost().getId() : null)
                .userId(r.getUserId())
                .introduction(r.getIntroduction())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
