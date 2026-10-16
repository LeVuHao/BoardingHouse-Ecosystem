package com.roomily.property.controller;

import com.roomily.common.dto.ApiResponse;
import com.roomily.property.dto.request.CreateReportRequest;
import com.roomily.property.dto.response.ReportResponse;
import com.roomily.property.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReportResponse>> submitReport(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @Valid @RequestBody CreateReportRequest request) {
        ReportResponse response = reportService.createReport(userId, email, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Báo cáo vi phạm đã được gửi. Đội ngũ kiểm duyệt sẽ xử lý trong vòng 24h.", response));
    }
}
