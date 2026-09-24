package com.roomily.property.dto.response;

import com.roomily.property.entity.RoommatePost;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoommatePostResponse {
    private Long id;
    private Long roomId;
    private Long creatorId;
    private String title;
    private String description;
    private BigDecimal priceShare;
    private String status;
    private LocalDateTime createdAt;

    public static RoommatePostResponse fromEntity(RoommatePost post) {
        if (post == null) return null;
        return RoommatePostResponse.builder()
                .id(post.getId())
                .roomId(post.getRoomId())
                .creatorId(post.getCreatorId())
                .title(post.getTitle())
                .description(post.getDescription())
                .priceShare(post.getPriceShare())
                .status(post.getStatus())
                .createdAt(post.getCreatedAt())
                .build();
    }
}
