package com.roomily.property.repository;

import com.roomily.property.entity.MaintenanceTicket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceTicketRepository extends JpaRepository<MaintenanceTicket, Long> {

    /**
     * Ticket của tenant (người báo hỏng) - sắp theo urgency ưu tiên & mới nhất
     */
    @Query("SELECT t FROM MaintenanceTicket t WHERE t.tenantId = :tenantId " +
           "ORDER BY CASE t.urgency " +
           "WHEN 'URGENT' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'NORMAL' THEN 2 WHEN 'LOW' THEN 3 END, " +
           "t.createdAt DESC")
    List<MaintenanceTicket> findByTenantIdOrderByUrgencyAndDate(@Param("tenantId") Long tenantId);

    /**
     * Ticket của landlord (chủ trọ) - sắp theo urgency ưu tiên & mới nhất
     * Đây là query QUAN TRỌNG: đặt ticket URGENT/HIGH lên đầu tiên
     */
    @Query("SELECT t FROM MaintenanceTicket t WHERE t.landlordId = :landlordId " +
           "ORDER BY CASE t.status " +
           "WHEN 'OPEN' THEN 0 WHEN 'IN_PROGRESS' THEN 1 WHEN 'RESOLVED' THEN 2 WHEN 'CLOSED' THEN 3 WHEN 'CANCELLED' THEN 4 END, " +
           "CASE t.urgency " +
           "WHEN 'URGENT' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'NORMAL' THEN 2 WHEN 'LOW' THEN 3 END, " +
           "t.createdAt DESC")
    List<MaintenanceTicket> findByLandlordIdOrderByPriority(@Param("landlordId") Long landlordId);

    /**
     * Ticket theo landlord + filter status
     */
    @Query("SELECT t FROM MaintenanceTicket t WHERE t.landlordId = :landlordId AND t.status = :status " +
           "ORDER BY CASE t.urgency " +
           "WHEN 'URGENT' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'NORMAL' THEN 2 WHEN 'LOW' THEN 3 END, " +
           "t.createdAt DESC")
    List<MaintenanceTicket> findByLandlordIdAndStatusOrderByPriority(
            @Param("landlordId") Long landlordId, @Param("status") String status);

    /**
     * Ticket theo room
     */
    List<MaintenanceTicket> findByRoomIdOrderByCreatedAtDesc(Long roomId);

    /**
     * Đếm ticket OPEN + IN_PROGRESS của landlord (cho badge cảnh báo)
     */
    @Query("SELECT COUNT(t) FROM MaintenanceTicket t WHERE t.landlordId = :landlordId " +
           "AND t.status IN ('OPEN', 'IN_PROGRESS')")
    long countActiveByLandlordId(@Param("landlordId") Long landlordId);

    /**
     * Đếm ticket URGENT của landlord (chưa xử lý xong)
     */
    @Query("SELECT COUNT(t) FROM MaintenanceTicket t WHERE t.landlordId = :landlordId " +
           "AND t.urgency = 'URGENT' AND t.status IN ('OPEN', 'IN_PROGRESS')")
    long countUrgentByLandlordId(@Param("landlordId") Long landlordId);
}
