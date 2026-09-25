package com.roomily.property.repository;

import com.roomily.property.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {
    List<Contract> findByTenantId(Long tenantId);
    List<Contract> findByLandlordId(Long landlordId);
    List<Contract> findByRoomId(Long roomId);
    Optional<Contract> findByRoomIdAndTenantIdAndStatus(Long roomId, Long tenantId, String status);

    default List<Contract> findByUserId(Long userId) {
        return findByTenantId(userId);
    }

    default Optional<Contract> findByRoomIdAndUserIdAndStatus(Long roomId, Long userId, String status) {
        return findByRoomIdAndTenantIdAndStatus(roomId, userId, status);
    }
}
