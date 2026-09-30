package com.roomily.property.service;

import com.roomily.common.exception.BadRequestException;
import com.roomily.common.exception.ResourceNotFoundException;
import com.roomily.property.config.RabbitMQConfig;
import com.roomily.property.dto.request.CreateTicketRequest;
import com.roomily.property.dto.request.UpdateTicketStatusRequest;
import com.roomily.property.dto.response.MaintenanceTicketResponse;
import com.roomily.property.entity.*;
import com.roomily.property.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaintenanceTicketService {

    private final MaintenanceTicketRepository ticketRepository;
    private final TicketImageRepository ticketImageRepository;
    private final TenantRepository tenantRepository;
    private final RoomRepository roomRepository;
    private final PropertyRepository propertyRepository;
    private final RabbitTemplate rabbitTemplate;

    private static final Set<String> VALID_CATEGORIES = Set.of(
            "ELECTRICAL", "PLUMBING", "APPLIANCE", "STRUCTURAL", "SECURITY", "CLEANING", "OTHER"
    );
    private static final Set<String> VALID_URGENCIES = Set.of("LOW", "NORMAL", "HIGH", "URGENT");

    /**
     * Tenant tạo ticket báo hỏng mới
     */
    @Transactional
    public MaintenanceTicketResponse createTicket(Long tenantUserId, CreateTicketRequest req) {
        // 1. Validate tenant đang ở phòng này
        boolean isStaying = tenantRepository.existsByUserIdAndRoomIdAndIsStayingTrue(tenantUserId, req.getRoomId());
        if (!isStaying) {
            throw new BadRequestException("Bạn không phải là người thuê đang ở phòng này. Chỉ cư dân hiện tại mới có thể báo sự cố.");
        }

        // 2. Lấy thông tin room → property → landlordId
        Room room = roomRepository.findById(req.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng"));
        Property property = room.getProperty();
        if (property == null) {
            throw new ResourceNotFoundException("Không tìm thấy khu trọ của phòng này");
        }

        // 3. Validate category & urgency
        String category = req.getCategory() != null ? req.getCategory().toUpperCase() : "OTHER";
        if (!VALID_CATEGORIES.contains(category)) {
            throw new BadRequestException("Loại sự cố không hợp lệ: " + category);
        }

        String urgency = req.getUrgency() != null ? req.getUrgency().toUpperCase() : "NORMAL";
        if (!VALID_URGENCIES.contains(urgency)) {
            urgency = "NORMAL";
        }

        // 4. Tạo ticket
        MaintenanceTicket ticket = MaintenanceTicket.builder()
                .roomId(req.getRoomId())
                .tenantId(tenantUserId)
                .landlordId(property.getLandlordId())
                .category(category)
                .title(req.getTitle())
                .description(req.getDescription())
                .urgency(urgency)
                .status("OPEN")
                .build();

        MaintenanceTicket saved = ticketRepository.save(ticket);

        // 5. Lưu ảnh đính kèm nếu có
        if (req.getImageUrls() != null && !req.getImageUrls().isEmpty()) {
            for (String url : req.getImageUrls()) {
                TicketImage img = TicketImage.builder()
                        .ticket(saved)
                        .imageUrl(url)
                        .uploadedBy(tenantUserId)
                        .build();
                ticketImageRepository.save(img);
            }
        }

        // 6. Gửi notification cho Landlord qua RabbitMQ
        String urgencyEmoji = switch (urgency) {
            case "URGENT" -> "🔴 KHẨN CẤP";
            case "HIGH" -> "🟠 Ưu tiên cao";
            case "NORMAL" -> "🟡 Bình thường";
            default -> "🟢 Thấp";
        };

        Map<String, Object> event = Map.of(
                "userId", property.getLandlordId(),
                "title", "🔧 Báo hỏng mới — " + urgencyEmoji,
                "content", "Phòng " + room.getRoomNumber() + " báo sự cố: " + req.getTitle(),
                "type", "TICKET_CREATED",
                "referenceId", saved.getId()
        );
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, "ticket.created", event);

        log.info("Tenant #{} tạo ticket báo hỏng #{} [{}] cho phòng #{}", tenantUserId, saved.getId(), urgency, req.getRoomId());

        MaintenanceTicketResponse response = MaintenanceTicketResponse.fromEntity(saved);
        response.setRoomNumber(room.getRoomNumber());
        response.setPropertyTitle(property.getTitle());
        return response;
    }

    /**
     * Lấy danh sách ticket của tenant
     */
    public List<MaintenanceTicketResponse> getMyTickets(Long tenantUserId) {
        List<MaintenanceTicket> tickets = ticketRepository.findByTenantIdOrderByUrgencyAndDate(tenantUserId);
        return tickets.stream().map(this::enrichResponse).collect(Collectors.toList());
    }

    /**
     * Lấy danh sách ticket cho landlord (sắp theo ưu tiên: OPEN+URGENT đầu tiên)
     */
    public List<MaintenanceTicketResponse> getLandlordTickets(Long landlordId, String status) {
        List<MaintenanceTicket> tickets;
        if (status != null && !status.isEmpty()) {
            tickets = ticketRepository.findByLandlordIdAndStatusOrderByPriority(landlordId, status.toUpperCase());
        } else {
            tickets = ticketRepository.findByLandlordIdOrderByPriority(landlordId);
        }
        return tickets.stream().map(this::enrichResponse).collect(Collectors.toList());
    }

    /**
     * Xem chi tiết ticket
     */
    public MaintenanceTicketResponse getTicketDetail(Long ticketId, Long userId) {
        MaintenanceTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ticket #" + ticketId));

        // Chỉ tenant hoặc landlord của ticket mới được xem
        if (!ticket.getTenantId().equals(userId) && !ticket.getLandlordId().equals(userId)) {
            throw new BadRequestException("Bạn không có quyền xem ticket này");
        }

        return enrichResponse(ticket);
    }

    /**
     * Landlord cập nhật trạng thái ticket
     */
    @Transactional
    public MaintenanceTicketResponse updateTicketStatus(Long ticketId, Long landlordId, UpdateTicketStatusRequest req) {
        MaintenanceTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ticket #" + ticketId));

        if (!ticket.getLandlordId().equals(landlordId)) {
            throw new BadRequestException("Bạn không phải chủ trọ quản lý phòng này");
        }

        String newStatus = req.getStatus().toUpperCase();
        validateStatusTransition(ticket.getStatus(), newStatus);

        ticket.setStatus(newStatus);
        if (req.getLandlordNote() != null) {
            ticket.setLandlordNote(req.getLandlordNote());
        }
        if ("RESOLVED".equals(newStatus)) {
            ticket.setResolvedAt(LocalDateTime.now());
        }

        MaintenanceTicket updated = ticketRepository.save(ticket);

        // Notify tenant
        String statusMsg = switch (newStatus) {
            case "IN_PROGRESS" -> "đang được xử lý";
            case "RESOLVED" -> "đã được giải quyết! Hãy xác nhận nếu đúng";
            default -> "đã cập nhật trạng thái";
        };

        Map<String, Object> event = Map.of(
                "userId", ticket.getTenantId(),
                "title", "🔧 Cập nhật sự cố: " + ticket.getTitle(),
                "content", "Sự cố \"" + ticket.getTitle() + "\" " + statusMsg +
                           (req.getLandlordNote() != null ? ". Ghi chú: " + req.getLandlordNote() : ""),
                "type", "TICKET_UPDATED",
                "referenceId", ticket.getId()
        );
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, "ticket.updated", event);

        log.info("Landlord #{} cập nhật ticket #{} → {}", landlordId, ticketId, newStatus);
        return enrichResponse(updated);
    }

    /**
     * Tenant xác nhận ticket đã giải quyết → CLOSED
     */
    @Transactional
    public MaintenanceTicketResponse confirmResolved(Long ticketId, Long tenantUserId) {
        MaintenanceTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ticket #" + ticketId));

        if (!ticket.getTenantId().equals(tenantUserId)) {
            throw new BadRequestException("Bạn không phải người tạo ticket này");
        }

        if (!"RESOLVED".equals(ticket.getStatus())) {
            throw new BadRequestException("Chỉ có thể xác nhận đóng khi chủ trọ đã xử lý xong (RESOLVED)");
        }

        ticket.setStatus("CLOSED");
        MaintenanceTicket updated = ticketRepository.save(ticket);

        // Notify landlord
        Map<String, Object> event = Map.of(
                "userId", ticket.getLandlordId(),
                "title", "✅ Người thuê xác nhận đã giải quyết",
                "content", "Sự cố \"" + ticket.getTitle() + "\" đã được người thuê xác nhận hoàn thành.",
                "type", "TICKET_CLOSED",
                "referenceId", ticket.getId()
        );
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, "ticket.closed", event);

        log.info("Tenant #{} xác nhận ticket #{} đã giải quyết → CLOSED", tenantUserId, ticketId);
        return enrichResponse(updated);
    }

    /**
     * Tenant hủy ticket
     */
    @Transactional
    public MaintenanceTicketResponse cancelTicket(Long ticketId, Long tenantUserId) {
        MaintenanceTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ticket #" + ticketId));

        if (!ticket.getTenantId().equals(tenantUserId)) {
            throw new BadRequestException("Bạn không phải người tạo ticket này");
        }

        if ("CLOSED".equals(ticket.getStatus()) || "CANCELLED".equals(ticket.getStatus())) {
            throw new BadRequestException("Ticket đã đóng hoặc đã hủy, không thể thay đổi");
        }

        ticket.setStatus("CANCELLED");
        MaintenanceTicket updated = ticketRepository.save(ticket);

        log.info("Tenant #{} hủy ticket #{}", tenantUserId, ticketId);
        return enrichResponse(updated);
    }

    /**
     * Đếm ticket đang hoạt động cho landlord (badge)
     */
    public Map<String, Long> getLandlordTicketStats(Long landlordId) {
        long active = ticketRepository.countActiveByLandlordId(landlordId);
        long urgent = ticketRepository.countUrgentByLandlordId(landlordId);
        return Map.of("activeCount", active, "urgentCount", urgent);
    }

    // --- Helper methods ---

    private MaintenanceTicketResponse enrichResponse(MaintenanceTicket ticket) {
        MaintenanceTicketResponse response = MaintenanceTicketResponse.fromEntity(ticket);
        try {
            Room room = roomRepository.findById(ticket.getRoomId()).orElse(null);
            if (room != null) {
                response.setRoomNumber(room.getRoomNumber());
                Property property = room.getProperty();
                if (property != null) {
                    response.setPropertyTitle(property.getTitle());
                }
            }
        } catch (Exception e) {
            log.warn("Không thể enrich thông tin phòng cho ticket #{}: {}", ticket.getId(), e.getMessage());
        }
        return response;
    }

    private void validateStatusTransition(String current, String target) {
        // Valid transitions
        boolean valid = switch (current) {
            case "OPEN" -> "IN_PROGRESS".equals(target) || "RESOLVED".equals(target);
            case "IN_PROGRESS" -> "RESOLVED".equals(target);
            case "RESOLVED" -> false; // Landlord không tự close, tenant phải confirm
            default -> false;
        };
        if (!valid) {
            throw new BadRequestException("Không thể chuyển trạng thái từ " + current + " sang " + target);
        }
    }
}
