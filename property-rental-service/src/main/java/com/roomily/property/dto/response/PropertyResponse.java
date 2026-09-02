package com.roomily.property.dto.response;

import com.roomily.property.entity.Property;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyResponse {
    private Long id;
    private Long landlordId;
    private String title;
    private String description;
    private String address;
    private String city;
    private String district;
    private String ward;
    private String utilities;
    private Integer totalRooms;
    private LocalDateTime createdAt;

    public static PropertyResponse fromEntity(Property p) {
        if (p == null) return null;
        return PropertyResponse.builder()
                .id(p.getId())
                .landlordId(p.getLandlordId())
                .title(p.getTitle())
                .description(p.getDescription())
                .address(p.getAddress())
                .city(p.getCity())
                .district(p.getDistrict())
                .ward(p.getWard())
                .utilities(p.getUtilities())
                .totalRooms(p.getRooms() != null ? p.getRooms().size() : 0)
                .createdAt(p.getCreatedAt())
                .build();
    }
}
