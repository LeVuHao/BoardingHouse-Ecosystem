package com.roomily.property.repository;

import com.roomily.property.entity.JoinRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JoinRequestRepository extends JpaRepository<JoinRequest, Long> {
    List<JoinRequest> findByPostId(Long postId);
    List<JoinRequest> findByUserId(Long userId);
    Optional<JoinRequest> findByIdAndStatus(Long id, String status);
    boolean existsByPostIdAndUserId(Long postId, Long userId);
}
