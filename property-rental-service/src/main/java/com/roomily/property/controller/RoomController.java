package com.roomily.property.controller;

import com.roomily.common.dto.ApiResponse;
import com.roomily.property.dto.request.AddRoomImagesRequest;
import com.roomily.property.dto.request.CreateRoomRequest;
import com.roomily.property.dto.request.UpdateRoomRequest;
import com.roomily.property.dto.response.RoomResponse;
import com.roomily.property.service.PropertyService;
import com.roomily.property.service.AdminAuditLogger;
import jakarta.servlet.http.HttpServletRequest;
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
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final PropertyService propertyService;
    private final AdminAuditLogger auditLogger;

    @PostMapping
    public ResponseEntity<ApiResponse<RoomResponse>> createRoom(
            @RequestHeader("X-User-Id") Long landlordId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail,
            HttpServletRequest request,
            @Valid @RequestBody CreateRoomRequest req) {
        RoomResponse res = propertyService.createRoom(landlordId, req);
        auditLogger.log(userEmail != null && !userEmail.isBlank() ? userEmail : "Chủ trọ #" + landlordId,
                AdminGuard.clientIp(request),
                "LANDLORD_CREATE_ROOM",
                "Chủ trọ đã thêm phòng " + res.getRoomNumber() + " (Giá: " + res.getPrice() + "đ)");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo phòng trọ mới thành công", res));
    }

    // [HUY] Cập nhật thông tin phòng
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomResponse>> updateRoom(
            @RequestHeader("X-User-Id") Long landlordId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail,
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestBody UpdateRoomRequest req) {
        RoomResponse res = propertyService.updateRoom(landlordId, id, req);
        auditLogger.log(userEmail != null && !userEmail.isBlank() ? userEmail : "Chủ trọ #" + landlordId,
                AdminGuard.clientIp(request),
                "LANDLORD_UPDATE_ROOM",
                "Chủ trọ đã cập nhật phòng " + res.getRoomNumber() + " (Giá: " + res.getPrice() + "đ)");
        return ResponseEntity.ok(ApiResponse.success("Cập nhật phòng thành công", res));
    }

    // [HUY] Xóa phòng
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(
            @RequestHeader("X-User-Id") Long landlordId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail,
            HttpServletRequest request,
            @PathVariable Long id) {
        String detail = propertyService.deleteRoom(landlordId, id);
        auditLogger.log(userEmail != null && !userEmail.isBlank() ? userEmail : "Chủ trọ #" + landlordId,
                AdminGuard.clientIp(request),
                "LANDLORD_DELETE_ROOM",
                "Chủ trọ đã xóa " + detail + " (ID: " + id + ")");
        return ResponseEntity.ok(ApiResponse.success("Xóa phòng thành công", null));
    }

    // [HUY] Thêm ảnh cho phòng
    @PostMapping("/{id}/images")
    public ResponseEntity<ApiResponse<List<String>>> addRoomImages(
            @RequestHeader("X-User-Id") Long landlordId,
            @PathVariable Long id,
            @RequestBody AddRoomImagesRequest req) {
        List<String> images = propertyService.addRoomImages(landlordId, id, req.getImageUrls());
        return ResponseEntity.ok(ApiResponse.success("Thêm ảnh phòng thành công", images));
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
