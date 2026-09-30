package com.roomily.property.controller;

import com.roomily.common.dto.ApiResponse;
import com.roomily.property.dto.request.CreateTicketRequest;
import com.roomily.property.dto.request.UpdateTicketStatusRequest;
import com.roomily.property.dto.response.MaintenanceTicketResponse;
import com.roomily.property.service.MaintenanceTicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/maintenance-tickets")
@RequiredArgsConstructor
public class MaintenanceTicketController {

    private final MaintenanceTicketService ticketService;

    /**
     * TENANT: Tạo ticket báo hỏng mới
     */
    @PostMapping
    public ResponseEntity<ApiResponse<MaintenanceTicketResponse>> createTicket(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody CreateTicketRequest req) {
        MaintenanceTicketResponse response = ticketService.createTicket(userId, req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đã gửi báo hỏng thành công! Chủ trọ sẽ nhận được thông báo.", response));
    }

    /**
     * TENANT: Xem ticket của tôi
     */
    @GetMapping("/my-tickets")
    public ResponseEntity<ApiResponse<List<MaintenanceTicketResponse>>> getMyTickets(
            @RequestHeader("X-User-Id") Long userId) {
        List<MaintenanceTicketResponse> tickets = ticketService.getMyTickets(userId);
        return ResponseEntity.ok(ApiResponse.success(tickets));
    }

    /**
     * LANDLORD: Xem danh sách ticket (sắp theo ưu tiên)
     */
    @GetMapping("/landlord")
    public ResponseEntity<ApiResponse<List<MaintenanceTicketResponse>>> getLandlordTickets(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false) String status) {
        List<MaintenanceTicketResponse> tickets = ticketService.getLandlordTickets(userId, status);
        return ResponseEntity.ok(ApiResponse.success(tickets));
    }

    /**
     * LANDLORD: Đếm ticket đang hoạt động (badge cảnh báo trên navbar)
     */
    @GetMapping("/landlord/stats")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getLandlordStats(
            @RequestHeader("X-User-Id") Long userId) {
        Map<String, Long> stats = ticketService.getLandlordTicketStats(userId);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    /**
     * Xem chi tiết ticket (tenant hoặc landlord)
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MaintenanceTicketResponse>> getTicketDetail(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        MaintenanceTicketResponse response = ticketService.getTicketDetail(id, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * LANDLORD: Cập nhật trạng thái ticket (IN_PROGRESS / RESOLVED)
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<MaintenanceTicketResponse>> updateStatus(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody UpdateTicketStatusRequest req) {
        MaintenanceTicketResponse response = ticketService.updateTicketStatus(id, userId, req);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công!", response));
    }

    /**
     * TENANT: Xác nhận sự cố đã được giải quyết → CLOSED
     */
    @PutMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<MaintenanceTicketResponse>> confirmResolved(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        MaintenanceTicketResponse response = ticketService.confirmResolved(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Đã xác nhận giải quyết thành công!", response));
    }

    /**
     * TENANT: Hủy ticket
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<MaintenanceTicketResponse>> cancelTicket(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        MaintenanceTicketResponse response = ticketService.cancelTicket(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy ticket!", response));
    }
}
