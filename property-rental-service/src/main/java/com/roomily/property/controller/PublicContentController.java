package com.roomily.property.controller;

import com.roomily.common.dto.ApiResponse;
import com.roomily.property.entity.Amenity;
import com.roomily.property.service.AmenityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Danh mục tiện ích công khai (frontend dùng để render bộ lọc / form đăng bài).
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PublicContentController {

    private final AmenityService amenityService;

    @GetMapping("/amenities")
    public ResponseEntity<ApiResponse<List<Amenity>>> getAmenities() {
        return ResponseEntity.ok(ApiResponse.success(amenityService.listActive()));
    }
}
