package com.roomily.property.controller;

import com.roomily.common.dto.ApiResponse;
import com.roomily.property.dto.request.AmenityRequest;
import com.roomily.property.entity.Amenity;
import com.roomily.property.service.AdminAuditLogger;
import com.roomily.property.service.AmenityService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/amenities")
@RequiredArgsConstructor
public class AdminAmenityController {

    private final AmenityService amenityService;
    private final AdminAuditLogger auditLogger;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Amenity>>> list(@RequestHeader("X-User-Role") String role) {
        AdminGuard.requireAdmin(role);
        return ResponseEntity.ok(ApiResponse.success(amenityService.listAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Amenity>> detail(
            @RequestHeader("X-User-Role") String role,
            @PathVariable Long id) {
        AdminGuard.requireAdmin(role);
        return ResponseEntity.ok(ApiResponse.success(amenityService.get(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Amenity>> create(
            @RequestHeader("X-User-Role") String role,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            HttpServletRequest request,
            @Valid @RequestBody AmenityRequest req) {
        AdminGuard.requireAdmin(role);
        Amenity a = amenityService.create(req);
        auditLogger.log(email, AdminGuard.clientIp(request), "CREATE_AMENITY",
                "Thêm tiện ích ID: " + a.getId() + " (" + a.getName() + ")");
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Đã thêm tiện ích", a));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Amenity>> update(
            @RequestHeader("X-User-Role") String role,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            HttpServletRequest request,
            @PathVariable Long id,
            @Valid @RequestBody AmenityRequest req) {
        AdminGuard.requireAdmin(role);
        Amenity a = amenityService.update(id, req);
        auditLogger.log(email, AdminGuard.clientIp(request), "UPDATE_AMENITY",
                "Cập nhật tiện ích ID: " + id + " (" + a.getName() + ")");
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật tiện ích", a));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @RequestHeader("X-User-Role") String role,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            HttpServletRequest request,
            @PathVariable Long id) {
        AdminGuard.requireAdmin(role);
        String name = amenityService.delete(id);
        auditLogger.log(email, AdminGuard.clientIp(request), "DELETE_AMENITY",
                "Xóa tiện ích ID: " + id + " (" + name + ")");
        return ResponseEntity.ok(ApiResponse.success("Đã xóa tiện ích", null));
    }
}
