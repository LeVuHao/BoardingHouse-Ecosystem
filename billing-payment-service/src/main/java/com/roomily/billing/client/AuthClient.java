package com.roomily.billing.client;

import com.roomily.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

@FeignClient(name = "AUTH-SERVICE")
public interface AuthClient {

    @PutMapping("/api/v1/auth/internal/activate-landlord/{userId}")
    ApiResponse<Object> activateLandlord(@PathVariable("userId") Long userId);
}
