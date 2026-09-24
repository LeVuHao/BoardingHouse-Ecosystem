package com.roomily.property.repository;

import com.roomily.property.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {
    List<Tenant> findByRoomIdAndIsStayingTrue(Long roomId);
    List<Tenant> findByUserIdAndIsStayingTrue(Long userId);
    Optional<Tenant> findByUserIdAndRoomIdAndIsStayingTrue(Long userId, Long roomId);
    boolean existsByUserIdAndRoomIdAndIsStayingTrue(Long userId, Long roomId);
}
