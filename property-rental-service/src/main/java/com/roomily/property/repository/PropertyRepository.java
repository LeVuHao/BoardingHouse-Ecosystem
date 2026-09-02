package com.roomily.property.repository;

import com.roomily.property.entity.Property;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long>, JpaSpecificationExecutor<Property> {
    List<Property> findByLandlordId(Long landlordId);
    Page<Property> findByCityAndDistrict(String city, String district, Pageable pageable);
}
