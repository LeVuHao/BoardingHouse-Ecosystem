package com.roomily.property.controller;

import com.roomily.common.dto.ApiResponse;
import com.roomily.property.dto.request.CreatePropertyRequest;
import com.roomily.property.dto.request.CreateRoomRequest;
import com.roomily.property.dto.request.UpdatePropertyRequest;
import com.roomily.property.dto.response.PropertyResponse;
import com.roomily.property.dto.response.RoomResponse;
import com.roomily.property.repository.PropertyRepository;
import com.roomily.property.repository.RoomRepository;
import com.roomily.property.service.PropertyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/properties")
@RequiredArgsConstructor
public class PropertyController {

    private final PropertyService propertyService;
    private final PropertyRepository propertyRepository;
    private final RoomRepository roomRepository;

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

    // [HUY] Cập nhật thông tin khu trọ
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PropertyResponse>> updateProperty(
            @RequestHeader("X-User-Id") Long landlordId,
            @PathVariable Long id,
            @RequestBody UpdatePropertyRequest req) {
        PropertyResponse res = propertyService.updateProperty(landlordId, id, req);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật khu trọ thành công", res));
    }

    @GetMapping("/{id}/rooms")
    public ResponseEntity<ApiResponse<List<RoomResponse>>> getRoomsByProperty(@PathVariable Long id) {
        List<RoomResponse> list = propertyService.getRoomsByProperty(id);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/admin/count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getAdminCount() {
        Map<String, Long> result = new HashMap<>();
        result.put("totalProperties", propertyRepository.count());
        result.put("totalRooms", roomRepository.count());
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
