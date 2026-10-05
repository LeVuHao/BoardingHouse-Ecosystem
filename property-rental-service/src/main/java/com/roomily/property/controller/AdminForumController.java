package com.roomily.property.controller;

import com.roomily.common.dto.ApiResponse;
import com.roomily.property.dto.request.AdminStatusRequest;
import com.roomily.property.dto.response.ForumPostResponse;
import com.roomily.property.service.AdminAuditLogger;
import com.roomily.property.service.AdminForumService;
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
@RequestMapping("/api/v1/admin/forum/posts")
@RequiredArgsConstructor
public class AdminForumController {

    private final AdminForumService adminForumService;
    private final AdminAuditLogger auditLogger;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ForumPostResponse>>> list(
            @RequestHeader("X-User-Role") String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 9, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        AdminGuard.requireAdmin(role);
        return ResponseEntity.ok(ApiResponse.success(adminForumService.list(status, keyword, pageable)));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Long>>> stats(
            @RequestHeader("X-User-Role") String role) {
        AdminGuard.requireAdmin(role);
        return ResponseEntity.ok(ApiResponse.success(adminForumService.stats()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ForumPostResponse>> updateStatus(
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Id") Long adminId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            HttpServletRequest request,
            @PathVariable Long id,
            @Valid @RequestBody AdminStatusRequest req) {
        AdminGuard.requireAdmin(role);
        ForumPostResponse res = adminForumService.updateStatus(id, req.getStatus(), req.getReason(), adminId);
        String ms = res.getModerationStatus();
        String msg;
        String action;
        switch (ms) {
            case "APPROVED" -> { msg = "Đã duyệt bài đăng"; action = "APPROVE_POST"; }
            case "REJECTED" -> { msg = "Đã từ chối bài đăng"; action = "REJECT_POST"; }
            default -> { msg = "Đã chuyển bài đăng về trạng thái chờ duyệt"; action = "RESET_POST"; }
        }
        auditLogger.log(email, AdminGuard.clientIp(request), action,
                msg + " ID: " + id + " (" + res.getTitle() + ")"
                        + ("REJECTED".equals(ms) ? " - Lý do: " + res.getRejectReason() : ""));
        return ResponseEntity.ok(ApiResponse.success(msg, res));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @RequestHeader("X-User-Role") String role,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        AdminGuard.requireAdmin(role);
        String title = adminForumService.delete(id, reason);
        auditLogger.log(email, AdminGuard.clientIp(request), "DELETE_POST",
                "Xóa bài đăng ID: " + id + " (" + title + ")"
                        + (reason != null && !reason.isBlank() ? " - Lý do: " + reason.trim() : ""));
        return ResponseEntity.ok(ApiResponse.success("Đã xóa bài đăng", null));
    }
}
