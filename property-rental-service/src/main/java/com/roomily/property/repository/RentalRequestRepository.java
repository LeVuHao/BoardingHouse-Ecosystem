package com.roomily.property.repository;

import com.roomily.property.entity.RentalRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RentalRequestRepository extends JpaRepository<RentalRequest, Long> {
    List<RentalRequest> findByUserId(Long userId);
    List<RentalRequest> findByRoomId(Long roomId);
    List<RentalRequest> findByRoomIdAndStatus(Long roomId, String status);
}
