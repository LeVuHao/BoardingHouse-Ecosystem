package com.roomily.property.repository;

import com.roomily.property.entity.RoommatePost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoommatePostRepository extends JpaRepository<RoommatePost, Long>, JpaSpecificationExecutor<RoommatePost> {
    List<RoommatePost> findByCreatorId(Long creatorId);
    Page<RoommatePost> findByStatus(String status, Pageable pageable);

    @Query("SELECT p FROM RoommatePost p JOIN Room r ON p.roomId = r.id JOIN r.property prop WHERE " +
           "(:city IS NULL OR LOWER(prop.city) LIKE LOWER(CONCAT('%', :city, '%'))) AND " +
           "(:status IS NULL OR p.status = :status)")
    Page<RoommatePost> searchPosts(@Param("city") String city, @Param("status") String status, Pageable pageable);
}
