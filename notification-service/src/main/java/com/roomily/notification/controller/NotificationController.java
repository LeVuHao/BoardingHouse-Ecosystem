package com.roomily.notification.controller;

import com.roomily.common.dto.ApiResponse;
import com.roomily.common.exception.ResourceNotFoundException;
import com.roomily.notification.entity.Notification;
import com.roomily.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getMyNotifications(
            @RequestHeader("X-User-Id") Long userId) {
        List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Notification>> markAsRead(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo"));

        notification.setIsRead(true);
        Notification saved = notificationRepository.save(notification);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }
}
