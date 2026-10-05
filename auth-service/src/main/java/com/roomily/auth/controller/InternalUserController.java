package com.roomily.auth.controller;

import com.roomily.auth.dto.response.UserSummaryResponse;
import com.roomily.auth.repository.UserRepository;
import com.roomily.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Endpoint chỉ dành cho giao tiếp service-to-service (Feign qua Eureka).
 * API Gateway chặn mọi request từ bên ngoài vào đường dẫn chứa "/internal/".
 */
@RestController
@RequestMapping("/api/v1/auth/internal")
@RequiredArgsConstructor
public class InternalUserController {

    private final UserRepository userRepository;
    private final com.roomily.auth.service.AuditLogService auditLogService;

    @GetMapping("/users/batch")
    public ResponseEntity<ApiResponse<List<UserSummaryResponse>>> getUsersByIds(
            @RequestParam("ids") List<Long> ids) {
        List<UserSummaryResponse> result = userRepository.findAllById(ids).stream()
                .map(UserSummaryResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /** Các service khác (property-rental...) gửi nhật ký thao tác của Admin về đây. */
    @PostMapping("/audit-logs")
    public ResponseEntity<ApiResponse<Object>> createAuditLog(@RequestBody Map<String, String> body) {
        auditLogService.record(body.get("adminEmail"), body.get("action"), body.get("details"), body.get("ipAddress"));
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }
}
