package com.roomily.property.repository;

import com.roomily.property.entity.ForumPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ForumPostRepository extends JpaRepository<ForumPost, Long> {

    Page<ForumPost> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    List<ForumPost> findByLandlordIdOrderByCreatedAtDesc(Long landlordId);

    Page<ForumPost> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /** Bài đăng hiển thị công khai: đang mở, đã được Admin duyệt, và khu trọ không bị ẩn/xóa. */
    @Query("SELECT p FROM ForumPost p WHERE p.status = 'ACTIVE' AND p.moderationStatus = 'APPROVED' " +
           "AND (p.roomId IS NULL OR p.roomId NOT IN " +
           "(SELECT r.id FROM Room r WHERE r.property.status <> 'ACTIVE')) " +
           "ORDER BY p.createdAt DESC")
    Page<ForumPost> findPublicPosts(Pageable pageable);

    /** Admin: lọc theo trạng thái kiểm duyệt + tìm theo tiêu đề / người đăng / địa chỉ. */
    @Query("SELECT p FROM ForumPost p WHERE p.status <> 'DELETED' " +
           "AND (:ms IS NULL OR p.moderationStatus = :ms) " +
           "AND (:kw IS NULL OR LOWER(p.title) LIKE :kw OR LOWER(p.landlordName) LIKE :kw OR LOWER(p.address) LIKE :kw)")
    Page<ForumPost> searchForAdmin(@Param("ms") String moderationStatus, @Param("kw") String kw, Pageable pageable);

    long countByModerationStatusAndStatusNot(String moderationStatus, String status);

    List<ForumPost> findByRoomIdIn(Collection<Long> roomIds);
}
