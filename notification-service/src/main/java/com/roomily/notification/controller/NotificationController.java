package com.roomily.notification.controller;

import com.roomily.common.dto.ApiResponse;
import com.roomily.notification.entity.Notification;
import com.roomily.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getMyNotifications(
            @RequestHeader("X-User-Id") Long userId) {
        List<Notification> list = notificationService.list(userId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Notification>> markAsRead(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        Notification saved = notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }
}
