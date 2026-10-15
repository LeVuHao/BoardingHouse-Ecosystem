package com.roomily.property.controller;

import com.roomily.common.dto.ApiResponse;
import com.roomily.property.dto.request.ResolveReportRequest;
import com.roomily.property.dto.response.ReportResponse;
import com.roomily.property.service.ReportService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private final ReportService reportService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ReportResponse>>> list(
            @RequestHeader("X-User-Role") String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        AdminGuard.requireAdmin(role);
        return ResponseEntity.ok(ApiResponse.success(reportService.listReports(status, targetType, keyword, pageable)));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Long>>> stats(
            @RequestHeader("X-User-Role") String role) {
        AdminGuard.requireAdmin(role);
        return ResponseEntity.ok(ApiResponse.success(reportService.getStats()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReportResponse>> getDetail(
            @RequestHeader("X-User-Role") String role,
            @PathVariable Long id) {
        AdminGuard.requireAdmin(role);
        return ResponseEntity.ok(ApiResponse.success(reportService.getReportDetail(id)));
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse<ReportResponse>> resolve(
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Id") Long adminId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            HttpServletRequest request,
            @PathVariable Long id,
            @Valid @RequestBody ResolveReportRequest body) {
        AdminGuard.requireAdmin(role);
        String clientIp = AdminGuard.clientIp(request);
        ReportResponse response = reportService.resolveReport(id, body, adminId, email, clientIp);
        return ResponseEntity.ok(ApiResponse.success("Đã xử lý báo cáo vi phạm thành công", response));
    }
}
