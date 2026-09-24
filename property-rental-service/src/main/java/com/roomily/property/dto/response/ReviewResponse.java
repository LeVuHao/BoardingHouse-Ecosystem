package com.roomily.property.dto.response;

import com.roomily.property.entity.Review;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {

    private Long id;
    private Long reviewerId;
    private String reviewerName;
    private Long revieweeId;
    private Long contractId;
    private Long postId;
    private Long roomId;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ReviewResponse fromEntity(Review r) {
        if (r == null) return null;
        return ReviewResponse.builder()
                .id(r.getId())
                .reviewerId(r.getReviewerId())
                .reviewerName(r.getReviewerName())
                .revieweeId(r.getRevieweeId())
                .contractId(r.getContractId())
                .postId(r.getPostId())
                .roomId(r.getRoomId())
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
