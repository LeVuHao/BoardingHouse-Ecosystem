package com.roomily.property.repository;

import com.roomily.property.entity.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    boolean existsByReporterIdAndTargetTypeAndTargetIdAndStatus(
            Long reporterId, String targetType, Long targetId, String status);

    @Query("SELECT r FROM Report r WHERE " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:targetType IS NULL OR r.targetType = :targetType) AND " +
           "(:keyword IS NULL OR LOWER(r.targetTitle) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "  OR LOWER(r.reporterName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "  OR LOWER(r.targetOwnerName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "  OR LOWER(r.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Report> searchForAdmin(
            @Param("status") String status,
            @Param("targetType") String targetType,
            @Param("keyword") String keyword,
            Pageable pageable);

    long countByStatus(String status);
}
