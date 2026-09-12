package com.roomily.notification.listener;

import com.roomily.notification.config.RabbitMQConfig;
import com.roomily.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class EventListener {

    private final NotificationService notificationService;

    @RabbitListener(queues = RabbitMQConfig.INVOICE_CREATED_QUEUE)
    public void handleInvoiceCreated(Map<String, Object> message) {
        log.info("Received invoice.created event: {}", message);

        try {
            Long userId = Long.valueOf(message.get("userId").toString());
            Long invoiceId = message.get("invoiceId") != null ? Long.valueOf(message.get("invoiceId").toString()) : null;
            String billingCycle = (String) message.get("billingCycle");
            BigDecimal totalAmount = message.get("totalAmount") != null 
                ? new BigDecimal(message.get("totalAmount").toString()) 
                : BigDecimal.ZERO;
            LocalDate dueDate = message.get("dueDate") != null 
                ? LocalDate.parse(message.get("dueDate").toString()) 
                : null;

            String title = "📄 Hóa đơn mới kỳ " + (billingCycle != null ? billingCycle : "");
            String content = "Bạn có hóa đơn mới";
            if (dueDate != null) {
                content += " cần thanh toán trước ngày " + dueDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            }
            content += ". Tổng tiền: " + totalAmount.toPlainString() + " VNĐ";

            notificationService.createNotification(userId, title, content, "BILL_CREATED", invoiceId);
            log.info("Created BILL_CREATED notification for user {}", userId);
        } catch (Exception ex) {
            log.error("Failed to process invoice.created event: {}", ex.getMessage(), ex);
        }
    }

    @RabbitListener(queues = RabbitMQConfig.RENTAL_APPROVED_QUEUE)
    public void handleRentalApproved(Map<String, Object> message) {
        log.info("Received rental.approved event: {}", message);

        try {
            Long userId = Long.valueOf(message.get("userId").toString());
            Long contractId = message.get("contractId") != null ? Long.valueOf(message.get("contractId").toString()) : null;
            String roomNumber = (String) message.get("roomNumber");
            String propertyTitle = (String) message.get("propertyTitle");

            String title = "✅ Yêu cầu thuê phòng đã được duyệt";
            StringBuilder content = new StringBuilder("Chúc mừng! Yêu cầu thuê phòng của bạn đã được chủ trọ duyệt.");
            if (roomNumber != null || propertyTitle != null) {
                content.append(" Phòng");
                if (roomNumber != null) {
                    content.append(" ").append(roomNumber);
                }
                if (propertyTitle != null) {
                    content.append(" - ").append(propertyTitle);
                }
            }
            if (contractId != null) {
                content.append(". Mã hợp đồng: #").append(contractId);
            }
            content.append(". Vui lòng kiểm tra email để biết thêm chi tiết.");

            notificationService.createNotification(userId, title, content.toString(), "RENTAL_APPROVED", contractId);
            log.info("Created RENTAL_APPROVED notification for user {}", userId);
        } catch (Exception ex) {
            log.error("Failed to process rental.approved event: {}", ex.getMessage(), ex);
        }
    }

    @RabbitListener(queues = RabbitMQConfig.JOIN_APPROVED_QUEUE)
    public void handleJoinApproved(Map<String, Object> message) {
        log.info("Received join.approved event: {}", message);

        try {
            Long userId = Long.valueOf(message.get("userId").toString());
            Long postId = message.get("postId") != null ? Long.valueOf(message.get("postId").toString()) : null;
            String posterName = (String) message.get("posterName");
            String roomInfo = (String) message.get("roomInfo");

            String title = "👋 Yêu cầu vào ở chung đã được chấp nhận";
            StringBuilder content = new StringBuilder("Yêu cầu của bạn đã được chấp nhận");
            if (posterName != null) {
                content.append(" bởi ").append(posterName);
            }
            if (roomInfo != null) {
                content.append(". Phòng: ").append(roomInfo);
            }
            content.append(". Hãy liên hệ để sắp xếp thời gian chuyển vào nhé!");

            notificationService.createNotification(userId, title, content.toString(), "JOIN_APPROVED", postId);
            log.info("Created JOIN_APPROVED notification for user {}", userId);
        } catch (Exception ex) {
            log.error("Failed to process join.approved event: {}", ex.getMessage(), ex);
        }
    }
}
