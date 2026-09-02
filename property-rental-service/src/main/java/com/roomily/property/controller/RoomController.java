package com.roomily.property.controller;

import com.roomily.common.dto.ApiResponse;
import com.roomily.property.dto.request.CreateRoomRequest;
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

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final PropertyService propertyService;

    @PostMapping
    public ResponseEntity<ApiResponse<RoomResponse>> createRoom(
            @RequestHeader("X-User-Id") Long landlordId,
            @Valid @RequestBody CreateRoomRequest req) {
        RoomResponse res = propertyService.createRoom(landlordId, req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo phòng trọ mới thành công", res));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<RoomResponse>>> searchRooms(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) BigDecimal minArea,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        Page<RoomResponse> page = propertyService.searchRooms(city, district, minPrice, maxPrice, minArea, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomResponse>> getRoomDetail(@PathVariable Long id) {
        RoomResponse res = propertyService.getRoomDetail(id);
        return ResponseEntity.ok(ApiResponse.success(res));
    }
}
