package com.roomily.auth.listener;

import com.roomily.auth.config.RabbitMQConfig;
import com.roomily.auth.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentSuccessListener {

    private final UserService userService;

    @RabbitListener(queues = RabbitMQConfig.LANDLORD_PAYMENT_QUEUE)
    public void handleLandlordPaymentSuccess(Map<String, Object> message) {
        log.info("Received landlord payment success event: {}", message);
        try {
            Object userIdObj = message.get("userId");
            if (userIdObj == null) {
                log.error("Missing userId in payment success message");
                return;
            }

            Long userId;
            if (userIdObj instanceof Number) {
                userId = ((Number) userIdObj).longValue();
            } else {
                userId = Long.valueOf(userIdObj.toString());
            }

            Object transactionIdObj = message.get("transactionId");
            userService.activate(userId);

            log.info("Successfully activated landlord account userId={}, transactionId={}",
                    userId, transactionIdObj);

        } catch (Exception e) {
            log.error("Failed to process landlord payment success event: {}", e.getMessage(), e);
        }
    }
}
