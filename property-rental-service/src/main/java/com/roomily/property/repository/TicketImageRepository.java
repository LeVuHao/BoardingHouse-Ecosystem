package com.roomily.property.repository;

import com.roomily.property.entity.TicketImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketImageRepository extends JpaRepository<TicketImage, Long> {
    List<TicketImage> findByTicketId(Long ticketId);
}
