package com.roomily.property.dto.response;

import com.roomily.property.entity.MaintenanceTicket;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceTicketResponse {

    private Long id;
    private Long roomId;
    private String roomNumber;
    private String propertyTitle;
    private Long tenantId;
    private String tenantName;
    private Long landlordId;

    private String category;
    private String categoryLabel;
    private String title;
    private String description;
    private String urgency;
    private String urgencyLabel;
    private String status;
    private String statusLabel;

    private String landlordNote;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<String> imageUrls;

    public static MaintenanceTicketResponse fromEntity(MaintenanceTicket ticket) {
        return MaintenanceTicketResponse.builder()
                .id(ticket.getId())
                .roomId(ticket.getRoomId())
                .tenantId(ticket.getTenantId())
                .landlordId(ticket.getLandlordId())
                .category(ticket.getCategory())
                .categoryLabel(getCategoryLabel(ticket.getCategory()))
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .urgency(ticket.getUrgency())
                .urgencyLabel(getUrgencyLabel(ticket.getUrgency()))
                .status(ticket.getStatus())
                .statusLabel(getStatusLabel(ticket.getStatus()))
                .landlordNote(ticket.getLandlordNote())
                .resolvedAt(ticket.getResolvedAt())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .imageUrls(ticket.getImages() != null
                        ? ticket.getImages().stream()
                            .map(img -> img.getImageUrl())
                            .collect(Collectors.toList())
                        : List.of())
                .build();
    }

    private static String getCategoryLabel(String category) {
        if (category == null) return "";
        return switch (category) {
            case "ELECTRICAL" -> "⚡ Điện";
            case "PLUMBING" -> "🔧 Nước / Ống nước";
            case "APPLIANCE" -> "🏠 Thiết bị";
            case "STRUCTURAL" -> "🧱 Kết cấu";
            case "SECURITY" -> "🔒 An ninh";
            case "CLEANING" -> "🧹 Vệ sinh";
            case "OTHER" -> "📋 Khác";
            default -> category;
        };
    }

    private static String getUrgencyLabel(String urgency) {
        if (urgency == null) return "Bình thường";
        return switch (urgency) {
            case "LOW" -> "Thấp";
            case "NORMAL" -> "Bình thường";
            case "HIGH" -> "Cao";
            case "URGENT" -> "Khẩn cấp";
            default -> urgency;
        };
    }

    private static String getStatusLabel(String status) {
        if (status == null) return "";
        return switch (status) {
            case "OPEN" -> "Chờ xử lý";
            case "IN_PROGRESS" -> "Đang xử lý";
            case "RESOLVED" -> "Đã giải quyết";
            case "CLOSED" -> "Đã đóng";
            case "CANCELLED" -> "Đã hủy";
            default -> status;
        };
    }
}
