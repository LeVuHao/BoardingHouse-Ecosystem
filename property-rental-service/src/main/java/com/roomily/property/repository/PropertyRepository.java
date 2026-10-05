package com.roomily.property.repository;

import com.roomily.property.entity.Property;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long>, JpaSpecificationExecutor<Property> {
    List<Property> findByLandlordId(Long landlordId);
    long countByStatusNot(String status);
    List<Property> findByLandlordIdAndStatusNot(Long landlordId, String status);

    /** Admin: tìm theo tên/địa chỉ + lọc trạng thái. Khu trọ đã xóa mềm (DELETED) không hiển thị. */
    @Query("SELECT p FROM Property p WHERE p.status <> 'DELETED' " +
           "AND (:status IS NULL OR p.status = :status) " +
           "AND (:kw IS NULL OR LOWER(p.title) LIKE :kw OR LOWER(p.address) LIKE :kw " +
           "OR LOWER(p.ward) LIKE :kw OR LOWER(p.district) LIKE :kw OR LOWER(p.city) LIKE :kw)")
    Page<Property> searchForAdmin(@Param("status") String status, @Param("kw") String kw, Pageable pageable);
    Page<Property> findByCityAndDistrict(String city, String district, Pageable pageable);
}
