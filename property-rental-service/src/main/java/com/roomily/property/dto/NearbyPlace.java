package com.roomily.property.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NearbyPlace {
    private String id;
    private String name;
    private String category;
    private Integer distanceMeters;
    private Double latitude;
    private Double longitude;
}
