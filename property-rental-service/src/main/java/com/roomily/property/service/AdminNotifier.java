package com.roomily.property.service;

import com.roomily.property.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Gửi thông báo tới người dùng khi Admin thực hiện thao tác (ẩn khu trọ, duyệt/từ chối bài...).
 * Lỗi RabbitMQ không được làm hỏng thao tác chính của Admin.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminNotifier {

    private final RabbitTemplate rabbitTemplate;

    public void notifyUser(Long userId, String title, String content, String type, Long referenceId) {
        if (userId == null) return;
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("userId", userId);
            event.put("title", title);
            event.put("content", content);
            event.put("type", type);
            event.put("referenceId", referenceId);
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, "admin.action", event);
        } catch (Exception ex) {
            log.warn("Không thể gửi thông báo admin qua RabbitMQ: {}", ex.getMessage());
        }
    }
}
