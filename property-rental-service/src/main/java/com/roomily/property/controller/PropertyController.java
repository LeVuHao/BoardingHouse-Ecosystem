package com.roomily.property.controller;

import com.roomily.common.dto.ApiResponse;
import com.roomily.property.dto.request.CreatePropertyRequest;
import com.roomily.property.dto.request.CreateRoomRequest;
import com.roomily.property.dto.response.PropertyResponse;
import com.roomily.property.dto.response.RoomResponse;
import com.roomily.property.service.PropertyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/properties")
@RequiredArgsConstructor
public class PropertyController {

    private final PropertyService propertyService;

    @PostMapping
    public ResponseEntity<ApiResponse<PropertyResponse>> createProperty(
            @RequestHeader("X-User-Id") Long landlordId,
            @Valid @RequestBody CreatePropertyRequest req) {
        PropertyResponse res = propertyService.createProperty(landlordId, req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo khu trọ mới thành công", res));
    }

    @GetMapping("/my-properties")
    public ResponseEntity<ApiResponse<List<PropertyResponse>>> getMyProperties(
            @RequestHeader("X-User-Id") Long landlordId) {
        List<PropertyResponse> list = propertyService.getMyProperties(landlordId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PropertyResponse>> getPropertyDetail(@PathVariable Long id) {
        PropertyResponse res = propertyService.getPropertyDetail(id);
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    @GetMapping("/{id}/rooms")
    public ResponseEntity<ApiResponse<List<RoomResponse>>> getRoomsByProperty(@PathVariable Long id) {
        List<RoomResponse> list = propertyService.getRoomsByProperty(id);
        return ResponseEntity.ok(ApiResponse.success(list));
    }
}
