package com.roomily.auth.client;

import com.roomily.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Map;

@FeignClient(name = "PROPERTY-RENTAL-SERVICE")
public interface PropertyRentalClient {

    @GetMapping("/api/v1/properties/admin/count")
    ApiResponse<Map<String, Long>> getAdminPropertyCount();
}
