package com.roomily.property.service;

import com.roomily.common.exception.BadRequestException;
import com.roomily.common.exception.ResourceNotFoundException;
import com.roomily.property.dto.request.CreateReviewRequest;
import com.roomily.property.dto.request.UpdateReviewRequest;
import com.roomily.property.dto.response.ReviewEligibilityResponse;
import com.roomily.property.dto.response.ReviewResponse;
import com.roomily.property.entity.Contract;
import com.roomily.property.entity.ForumPost;
import com.roomily.property.entity.Review;
import com.roomily.property.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ForumPostRepository forumPostRepository;
    private final ContractRepository contractRepository;
    private final TenantRepository tenantRepository;
    private final RentalRequestRepository rentalRequestRepository;

    /**
     * Kiểm tra xem user có đủ điều kiện đánh giá phòng này không
     */
    public ReviewEligibilityResponse checkEligibility(Long postId, Long userId) {
        if (userId == null) {
            return ReviewEligibilityResponse.builder()
                    .eligible(false)
                    .reason("Vui lòng đăng nhập để đánh giá phòng.")
                    .existingReview(null)
                    .build();
        }

        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài đăng phòng trọ"));

        // Kiểm tra xem đã có đánh giá trước đó chưa
        Optional<Review> existingReviewOpt = reviewRepository.findByPostIdAndReviewerId(postId, userId);
        ReviewResponse existingReview = existingReviewOpt.map(ReviewResponse::fromEntity).orElse(null);

        boolean isEligible = false;

        // 1. Kiểm tra qua roomId nếu có
        if (post.getRoomId() != null) {
            boolean isStayingTenant = tenantRepository.existsByUserIdAndRoomIdAndIsStayingTrue(userId, post.getRoomId());
            boolean hasActiveContract = contractRepository.findByRoomIdAndUserIdAndStatus(post.getRoomId(), userId, "ACTIVE").isPresent();
            boolean hasApprovedRequest = rentalRequestRepository.existsByUserIdAndRoomIdAndStatus(userId, post.getRoomId(), "APPROVED");
            if (isStayingTenant || hasActiveContract || hasApprovedRequest) {
                isEligible = true;
            }
        }

        // 2. Kiểm tra qua hợp đồng với chủ trọ
        if (!isEligible) {
            isEligible = contractRepository.findByUserId(userId).stream()
                    .anyMatch(c -> c.getLandlordId().equals(post.getLandlordId()) && !"REJECTED".equalsIgnoreCase(c.getStatus()));
        }

        // 3. Kiểm tra qua các yêu cầu thuê đã được duyệt của user
        if (!isEligible) {
            isEligible = rentalRequestRepository.findByUserId(userId).stream()
                    .anyMatch(r -> "APPROVED".equalsIgnoreCase(r.getStatus()) &&
                            ((post.getRoomId() != null && post.getRoomId().equals(r.getRoomId())) || post.getLandlordId().equals(r.getLandlordId())));
        }

        return ReviewEligibilityResponse.builder()
                .eligible(isEligible)
                .reason(isEligible 
                        ? "Bạn là người thuê đã được chủ trọ duyệt vào ở, có thể đánh giá và bình luận!" 
                        : "Chỉ người thuê đã được chủ trọ duyệt vào ở trọ mới có quyền đánh giá phòng này.")
                .existingReview(existingReview)
                .build();
    }

    /**
     * Lấy danh sách đánh giá của bài đăng
     */
    public List<ReviewResponse> getReviewsByPost(Long postId) {
        return reviewRepository.findByPostIdOrderByCreatedAtDesc(postId).stream()
                .map(ReviewResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Tạo đánh giá mới (chỉ người đã được duyệt vào ở)
     */
    @Transactional
    public ReviewResponse createReview(Long userId, CreateReviewRequest req) {
        if (req.getPostId() == null) {
            throw new BadRequestException("Thiếu mã bài đăng postId");
        }

        ForumPost post = forumPostRepository.findById(req.getPostId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài đăng phòng trọ"));

        // Kiểm tra điều kiện đã duyệt ở trọ
        ReviewEligibilityResponse eligibility = checkEligibility(req.getPostId(), userId);
        if (!eligibility.isEligible()) {
            throw new BadRequestException(eligibility.getReason());
        }

        if (eligibility.getExistingReview() != null) {
            throw new BadRequestException("Bạn đã đánh giá phòng này rồi. Bạn có thể chỉnh sửa đánh giá của mình.");
        }

        // Tìm hợp đồng liên quan nếu có
        Long contractId = null;
        if (post.getRoomId() != null) {
            Optional<Contract> contractOpt = contractRepository.findByRoomIdAndUserIdAndStatus(post.getRoomId(), userId, "ACTIVE");
            if (contractOpt.isPresent()) {
                contractId = contractOpt.get().getId();
            }
        }

        Review review = Review.builder()
                .reviewerId(userId)
                .reviewerName(req.getReviewerName() != null ? req.getReviewerName() : "Người thuê phòng")
                .revieweeId(post.getLandlordId())
                .postId(post.getId())
                .roomId(post.getRoomId())
                .contractId(contractId)
                .rating(req.getRating())
                .comment(req.getComment())
                .build();

        Review saved = reviewRepository.save(review);
        log.info("Người dùng #{} đã đánh giá {} sao cho bài đăng #{}", userId, req.getRating(), post.getId());
        return ReviewResponse.fromEntity(saved);
    }

    /**
     * Cập nhật đánh giá của mình
     */
    @Transactional
    public ReviewResponse updateReview(Long reviewId, Long userId, UpdateReviewRequest req) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá"));

        if (!review.getReviewerId().equals(userId)) {
            throw new BadRequestException("Bạn không có quyền chỉnh sửa đánh giá này!");
        }

        review.setRating(req.getRating());
        review.setComment(req.getComment());
        review.setUpdatedAt(LocalDateTime.now());

        Review updated = reviewRepository.save(review);
        log.info("Người dùng #{} đã cập nhật đánh giá #{}", userId, reviewId);
        return ReviewResponse.fromEntity(updated);
    }

    /**
     * Xóa đánh giá của mình (hoặc Admin xóa)
     */
    @Transactional
    public void deleteReview(Long reviewId, Long userId, String role) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá"));

        boolean isAdmin = "ADMIN".equalsIgnoreCase(role);
        if (!review.getReviewerId().equals(userId) && !isAdmin) {
            throw new BadRequestException("Bạn không có quyền xóa đánh giá này!");
        }

        reviewRepository.delete(review);
        log.info("Đã xóa đánh giá #{} bởi người dùng #{} (role: {})", reviewId, userId, role);
    }
}
