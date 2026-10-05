package com.roomily.property.controller;

import com.roomily.common.dto.ApiResponse;
import com.roomily.property.dto.request.AdminStatusRequest;
import com.roomily.property.dto.response.AdminPropertyResponse;
import com.roomily.property.service.AdminAuditLogger;
import com.roomily.property.service.AdminPropertyService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/properties")
@RequiredArgsConstructor
public class AdminPropertyController {

    private final AdminPropertyService adminPropertyService;
    private final AdminAuditLogger auditLogger;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminPropertyResponse>>> list(
            @RequestHeader("X-User-Role") String role,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        AdminGuard.requireAdmin(role);
        return ResponseEntity.ok(ApiResponse.success(adminPropertyService.list(keyword, status, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminPropertyResponse>> detail(
            @RequestHeader("X-User-Role") String role,
            @PathVariable Long id) {
        AdminGuard.requireAdmin(role);
        return ResponseEntity.ok(ApiResponse.success(adminPropertyService.getDetail(id)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AdminPropertyResponse>> updateStatus(
            @RequestHeader("X-User-Role") String role,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            HttpServletRequest request,
            @PathVariable Long id,
            @Valid @RequestBody AdminStatusRequest req) {
        AdminGuard.requireAdmin(role);
        AdminPropertyResponse res = adminPropertyService.updateStatus(id, req.getStatus(), req.getReason());
        boolean hidden = "HIDDEN".equalsIgnoreCase(req.getStatus());
        auditLogger.log(email, AdminGuard.clientIp(request),
                hidden ? "HIDE_PROPERTY" : "SHOW_PROPERTY",
                (hidden ? "Tạm ẩn" : "Hiển thị lại") + " khu trọ ID: " + id + " (" + res.getTitle() + ")"
                        + (hidden && req.getReason() != null && !req.getReason().isBlank() ? " - Lý do: " + req.getReason().trim() : ""));
        return ResponseEntity.ok(ApiResponse.success(hidden ? "Đã tạm ẩn khu trọ" : "Đã hiển thị lại khu trọ", res));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @RequestHeader("X-User-Role") String role,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        AdminGuard.requireAdmin(role);
        String title = adminPropertyService.delete(id, reason);
        auditLogger.log(email, AdminGuard.clientIp(request), "DELETE_PROPERTY",
                "Xóa khu trọ ID: " + id + " (" + title + ")"
                        + (reason != null && !reason.isBlank() ? " - Lý do: " + reason.trim() : ""));
        return ResponseEntity.ok(ApiResponse.success("Đã xóa khu trọ", null));
    }
}
