package com.roomily.billing.repository;

import com.roomily.billing.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    List<Bill> findByTenantId(Long tenantId);
    List<Bill> findByLandlordId(Long landlordId);
    List<Bill> findByRoomId(Long roomId);
}
