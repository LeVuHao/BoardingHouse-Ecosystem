package com.roomily.property.repository;

import com.roomily.property.entity.Room;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long>, JpaSpecificationExecutor<Room> {
    List<Room> findByPropertyId(Long propertyId);
    List<Room> findByProperty_LandlordId(Long landlordId);

    @Query("SELECT r FROM Room r JOIN r.property p WHERE " +
           "(:city IS NULL OR LOWER(p.city) LIKE LOWER(CONCAT('%', :city, '%'))) AND " +
           "(:district IS NULL OR LOWER(p.district) LIKE LOWER(CONCAT('%', :district, '%'))) AND " +
           "(:minPrice IS NULL OR r.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR r.price <= :maxPrice) AND " +
           "(:minArea IS NULL OR r.area >= :minArea) AND " +
           "(:status IS NULL OR r.status = :status)")
    Page<Room> searchRooms(
            @Param("city") String city,
            @Param("district") String district,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("minArea") BigDecimal minArea,
            @Param("status") String status,
            Pageable pageable);
}
