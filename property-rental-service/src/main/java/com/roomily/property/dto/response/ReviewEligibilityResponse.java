package com.roomily.property.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewEligibilityResponse {

    private boolean eligible;
    private String reason;
    private ReviewResponse existingReview;
}
