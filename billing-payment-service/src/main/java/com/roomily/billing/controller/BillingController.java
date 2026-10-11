package com.roomily.billing.controller;

import com.roomily.billing.dto.request.CreateBillRequest;
import com.roomily.billing.dto.response.BillResponse;
import com.roomily.billing.service.BillingService;
import com.roomily.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    // --- BILLS ---
    @PostMapping("/bills")
    public ResponseEntity<ApiResponse<BillResponse>> createBill(
            @RequestHeader("X-User-Id") Long landlordId,
            @Valid @RequestBody CreateBillRequest req) {
        BillResponse res = billingService.createBill(landlordId, req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo hóa đơn thành công", res));
    }

    @GetMapping("/bills/my-bills")
    public ResponseEntity<ApiResponse<List<BillResponse>>> getMyBills(
            @RequestHeader("X-User-Id") Long tenantId) {
        List<BillResponse> list = billingService.getBillsByTenant(tenantId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/bills/landlord-bills")
    public ResponseEntity<ApiResponse<List<BillResponse>>> getLandlordBills(
            @RequestHeader("X-User-Id") Long landlordId) {
        List<BillResponse> list = billingService.getBillsByLandlord(landlordId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PatchMapping("/bills/{billId}/status")
    public ResponseEntity<ApiResponse<BillResponse>> updateBillStatus(
            @RequestHeader("X-User-Id") Long landlordId,
            @PathVariable Long billId,
            @RequestParam String status) {
        BillResponse res = billingService.updateBillStatus(landlordId, billId, status);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái hóa đơn thành công", res));
    }

    // --- PAYMENTS & VNPAY ---
    @PostMapping("/payments/create-bill-payment-url/{billId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> createBillPaymentUrl(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long billId,
            @RequestParam BigDecimal amount) {
        String paymentUrl = billingService.createVNPayPaymentUrl(userId, "BILL_PAYMENT", billId, amount);
        return ResponseEntity.ok(ApiResponse.success(Map.of("paymentUrl", paymentUrl)));
    }

    @GetMapping("/payments/vnpay-callback")
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleCallback(
            @RequestParam Map<String, String> allParams) {
        Map<String, Object> result = billingService.handleVNPayCallback(allParams);
        return ResponseEntity.ok(ApiResponse.success("Xử lý kết quả giao dịch VNPay thành công", result));
    }
}