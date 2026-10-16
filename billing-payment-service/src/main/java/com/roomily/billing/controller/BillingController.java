package com.roomily.billing.controller;

import com.roomily.billing.dto.request.CreateBillRequest;
import com.roomily.billing.dto.request.SepayWebhookRequest;
import com.roomily.billing.dto.response.BillPaymentQrResponse;
import com.roomily.billing.dto.response.BillResponse;
import com.roomily.billing.service.BillingService;
import com.roomily.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    // --- BILLS CRUD ---
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

    // --- SEPAY VIETQR PAYMENT ---
    @GetMapping("/bills/{billId}/qr")
    public ResponseEntity<ApiResponse<BillPaymentQrResponse>> getBillPaymentQr(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long billId) {
        BillPaymentQrResponse qr = billingService.createBillPaymentQR(userId, billId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin VietQR SePay thành công", qr));
    }

    @PostMapping("/bills/{billId}/qr")
    public ResponseEntity<ApiResponse<BillPaymentQrResponse>> createBillPaymentQrPost(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long billId) {
        BillPaymentQrResponse qr = billingService.createBillPaymentQR(userId, billId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin VietQR SePay thành công", qr));
    }

    @PostMapping("/payments/sepay-webhook")
    public ResponseEntity<Map<String, Object>> handleSepayWebhook(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody SepayWebhookRequest webhook) {
        boolean success = billingService.handleSepayWebhook(webhook, authHeader);
        Map<String, Object> res = new HashMap<>();
        res.put("success", success);
        res.put("message", success ? "Xử lý gạch nợ hóa đơn thành công" : "Bỏ qua hoặc không khớp giao dịch hóa đơn");
        return ResponseEntity.ok(res);
    }
}