package com.roomily.property.client;

import com.roomily.common.dto.ApiResponse;
import com.roomily.property.dto.response.LandlordInfo;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

@FeignClient(name = "AUTH-SERVICE")
public interface AuthClient {

    @GetMapping("/api/v1/auth/internal/users/batch")
    ApiResponse<List<LandlordInfo>> getUsersByIds(@RequestParam("ids") List<Long> ids);

    @PostMapping("/api/v1/auth/internal/audit-logs")
    ApiResponse<Object> createAuditLog(@RequestBody Map<String, String> body);
}
