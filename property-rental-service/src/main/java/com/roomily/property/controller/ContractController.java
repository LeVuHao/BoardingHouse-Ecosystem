package com.roomily.property.controller;

import com.roomily.common.dto.ApiResponse;
import com.roomily.property.dto.response.ContractResponse;
import com.roomily.property.service.ContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final ContractService contractService;

    // [HUY] User xem hợp đồng của mình
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<ContractResponse>>> getMyContracts(
            @RequestHeader("X-User-Id") Long userId) {
        List<ContractResponse> list = contractService.getMyContracts(userId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    // [HUY] Landlord xem hợp đồng của phòng mình quản lý
    @GetMapping("/landlord")
    public ResponseEntity<ApiResponse<List<ContractResponse>>> getLandlordContracts(
            @RequestHeader("X-User-Id") Long landlordId) {
        List<ContractResponse> list = contractService.getLandlordContracts(landlordId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    // Xem chi tiết hợp đồng
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ContractResponse>> getContractDetail(@PathVariable Long id) {
        ContractResponse res = contractService.getContractDetail(id);
        return ResponseEntity.ok(ApiResponse.success(res));
    }
}
