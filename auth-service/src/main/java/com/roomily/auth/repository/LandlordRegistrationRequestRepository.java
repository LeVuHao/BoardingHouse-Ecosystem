package com.roomily.auth.repository;

import com.roomily.auth.entity.LandlordRegistrationRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LandlordRegistrationRequestRepository extends JpaRepository<LandlordRegistrationRequest, Long> {

    Optional<LandlordRegistrationRequest> findByPaymentCode(String paymentCode);

    long countByStatus(String status);

    @Query("""
            SELECT r FROM LandlordRegistrationRequest r
            WHERE (:status IS NULL OR :status = '' OR r.status = :status)
              AND (:paymentStatus IS NULL OR :paymentStatus = '' OR r.paymentStatus = :paymentStatus)
              AND (:keyword IS NULL OR :keyword = ''
                   OR LOWER(r.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(r.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(r.phoneNumber) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(r.paymentCode) LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    Page<LandlordRegistrationRequest> searchRequests(@Param("status") String status,
                                                    @Param("paymentStatus") String paymentStatus,
                                                    @Param("keyword") String keyword,
                                                    Pageable pageable);
}
