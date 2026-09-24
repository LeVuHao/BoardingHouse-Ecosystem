package com.roomily.property.repository;

import com.roomily.property.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByPostIdOrderByCreatedAtDesc(Long postId);

    List<Review> findByRoomIdOrderByCreatedAtDesc(Long roomId);

    List<Review> findByRevieweeIdOrderByCreatedAtDesc(Long revieweeId);

    Optional<Review> findByPostIdAndReviewerId(Long postId, Long reviewerId);

    Optional<Review> findByRoomIdAndReviewerId(Long roomId, Long reviewerId);
}
