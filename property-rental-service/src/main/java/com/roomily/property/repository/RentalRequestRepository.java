package com.roomily.property.repository;

import com.roomily.property.entity.RentalRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface RentalRequestRepository extends JpaRepository<RentalRequest, Long> {
    List<RentalRequest> findByUserId(Long userId);
    List<RentalRequest> findByRoomId(Long roomId);
    List<RentalRequest> findByRoomIdAndStatus(Long roomId, String status);
    boolean existsByUserIdAndRoomIdAndStatus(Long userId, Long roomId, String status);
    Page<RentalRequest> findByRoomIdIn(Collection<Long> roomIds, Pageable pageable);
    Page<RentalRequest> findByRoomIdInAndStatus(Collection<Long> roomIds, String status, Pageable pageable);
    Page<RentalRequest> findByLandlordId(Long landlordId, Pageable pageable);
    Page<RentalRequest> findByLandlordIdAndStatus(Long landlordId, String status, Pageable pageable);
}
