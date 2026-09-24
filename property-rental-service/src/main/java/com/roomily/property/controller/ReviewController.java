package com.roomily.property.controller;

import com.roomily.common.dto.ApiResponse;
import com.roomily.property.dto.request.CreateReviewRequest;
import com.roomily.property.dto.request.UpdateReviewRequest;
import com.roomily.property.dto.response.ReviewEligibilityResponse;
import com.roomily.property.dto.response.ReviewResponse;
import com.roomily.property.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/rental/forum/reviews", "/api/v1/rooms/reviews", "/api/v1/reviews"})
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * Lấy danh sách đánh giá của bài đăng
     */
    @GetMapping("/post/{postId}")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getReviewsByPost(@PathVariable Long postId) {
        List<ReviewResponse> list = reviewService.getReviewsByPost(postId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * Kiểm tra điều kiện được phép đánh giá của người dùng
     */
    @GetMapping("/post/{postId}/eligibility")
    public ResponseEntity<ApiResponse<ReviewEligibilityResponse>> checkEligibility(
            @PathVariable Long postId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        ReviewEligibilityResponse res = reviewService.checkEligibility(postId, userId);
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    /**
     * Gửi đánh giá và bình luận 5 sao (yêu cầu đã được duyệt vào ở trọ)
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody CreateReviewRequest req) {
        ReviewResponse res = reviewService.createReview(userId, req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đánh giá của bạn đã được đăng thành công!", res));
    }

    /**
     * Chỉnh sửa đánh giá (chỉ người tạo đánh giá)
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody UpdateReviewRequest req) {
        ReviewResponse res = reviewService.updateReview(id, userId, req);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật đánh giá thành công!", res));
    }

    /**
     * Xóa đánh giá (người tạo hoặc Admin)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        reviewService.deleteReview(id, userId, role);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa đánh giá thành công!", null));
    }
}
