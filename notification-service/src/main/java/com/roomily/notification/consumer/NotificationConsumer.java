package com.roomily.notification.consumer;

import com.roomily.notification.entity.Notification;
import com.roomily.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationConsumer {

    private final NotificationRepository notificationRepository;

    // Tạo queue
    @Bean
    public Queue notificationQueue() {
        return new Queue("roomily.notifications.queue", true);
    }

    @RabbitListener(queues = "roomily.notifications.queue")
    public void handleNotificationEvent(Map<String, Object> event) {
        log.info("Received notification event: {}", event);

        try {
            Long userId = Long.valueOf(event.get("userId").toString());
            String title = (String) event.get("title");
            String content = (String) event.get("content");
            String type = (String) event.get("type");

            Long referenceId = event.get("referenceId") != null
                    ? Long.valueOf(event.get("referenceId").toString())
                    : null;

            Notification notification = Notification.builder()
                    .userId(userId)
                    .title(title)
                    .content(content)
                    .type(type)
                    .referenceId(referenceId)
                    .isRead(false)
                    .build();

            notificationRepository.save(notification);

            log.info("Saved notification for user: {}", userId);

        } catch (Exception ex) {
            log.error("Failed to process notification event: {}",
                    ex.getMessage(), ex);
        }
    }
}