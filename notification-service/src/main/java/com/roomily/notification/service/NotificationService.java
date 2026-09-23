package com.roomily.notification.service;

import com.roomily.common.exception.BadRequestException;
import com.roomily.common.exception.ResourceNotFoundException;
import com.roomily.notification.entity.Notification;
import com.roomily.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public List<Notification> list(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Page<Notification> list(Long userId, Pageable pageable) {
        return notificationRepository.findByUserId(userId, pageable);
    }

    public long countUnread(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public Notification markAsRead(Long id, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo"));

        if (!notification.getUserId().equals(userId)) {
            throw new BadRequestException("Bạn không có quyền thực hiện hành động này");
        }

        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    @Transactional
    public Notification createNotification(Long userId, String title, String content, String type, Long referenceId) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .content(content)
                .type(type)
                .referenceId(referenceId)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Created notification [{}] for user {}: {}", saved.getId(), userId, title);
        return saved;
    }
}
