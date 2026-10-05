package com.roomily.property.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Dùng cho cả danh sách (gallery/rooms = null) và chi tiết khu trọ của Admin.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPropertyResponse {
    private Long id;
    private String title;
    private String description;
    private String address;
    private String city;
    private String district;
    private String ward;
    private String utilities;
    private Double latitude;
    private Double longitude;
    private String status;        // ACTIVE | HIDDEN
    private String statusReason;
    private LocalDateTime createdAt;

    // Chủ trọ
    private Long landlordId;
    private String landlordName;
    private String landlordEmail;
    private String landlordPhone;
    private String landlordAvatar;
    private String landlordStatus;

    // Thống kê phòng
    private int totalRooms;
    private int availableRooms;
    private int occupiedRooms;
    private int maintenanceRooms;

    private String thumbnail;

    // Chỉ có ở API chi tiết
    private List<String> gallery;
    private List<RoomItem> rooms;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoomItem {
        private Long id;
        private String roomNumber;
        private BigDecimal price;
        private BigDecimal area;
        private Integer capacity;
        private Integer currentOccupants;
        private String status;       // AVAILABLE | FULL | MAINTENANCE (giá trị gốc)
        private String rentalState;  // AVAILABLE (trống) | OCCUPIED (đang thuê) | MAINTENANCE
        private List<String> images;
    }
}
