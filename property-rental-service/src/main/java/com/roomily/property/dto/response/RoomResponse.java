package com.roomily.property.dto.response;

import com.roomily.property.entity.Room;
import com.roomily.property.entity.RoomImage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomResponse {
    private Long id;
    private Long propertyId;
    private String propertyTitle;
    private String address;
    private String city;
    private String district;
    private String ward;
    private String roomNumber;
    private BigDecimal price;
    private BigDecimal area;
    private Integer capacity;
    private Integer currentOccupants;
    private String status;
    private List<String> images;
    private LocalDateTime createdAt;

    public static RoomResponse fromEntity(Room r) {
        if (r == null) return null;
        List<String> imgUrls = r.getImages() != null ?
                r.getImages().stream().map(RoomImage::getImageUrl).collect(Collectors.toList()) :
                Collections.emptyList();

        return RoomResponse.builder()
                .id(r.getId())
                .propertyId(r.getProperty() != null ? r.getProperty().getId() : null)
                .propertyTitle(r.getProperty() != null ? r.getProperty().getTitle() : null)
                .address(r.getProperty() != null ? r.getProperty().getAddress() : null)
                .city(r.getProperty() != null ? r.getProperty().getCity() : null)
                .district(r.getProperty() != null ? r.getProperty().getDistrict() : null)
                .ward(r.getProperty() != null ? r.getProperty().getWard() : null)
                .roomNumber(r.getRoomNumber())
                .price(r.getPrice())
                .area(r.getArea())
                .capacity(r.getCapacity())
                .currentOccupants(r.getCurrentOccupants())
                .status(r.getStatus())
                .images(imgUrls)
                .createdAt(r.getCreatedAt())
                .build();
    }
}
