package com.roomily.property.service;

import com.roomily.common.exception.ResourceNotFoundException;
import com.roomily.property.dto.request.SendForumMessageRequest;
import com.roomily.property.dto.response.ForumMessageResponse;
import com.roomily.property.entity.ForumMessage;
import com.roomily.property.entity.ForumPost;
import com.roomily.property.repository.ForumMessageRepository;
import com.roomily.property.repository.ForumPostRepository;
import com.roomily.property.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ForumMessageService {

    private final ForumMessageRepository forumMessageRepository;
    private final ForumPostRepository forumPostRepository;
    private final RabbitTemplate rabbitTemplate;

    /**
     * Người dùng gửi tin nhắn liên hệ chủ trọ về bài đăng
     */
    @Transactional
    public ForumMessageResponse sendMessage(Long postId, Long senderId, SendForumMessageRequest req) {
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài đăng"));

        ForumMessage message = ForumMessage.builder()
                .postId(postId)
                .senderId(senderId)
                .senderName(req.getSenderName())
                .senderPhone(req.getSenderPhone())
                .receiverId(post.getLandlordId())
                .content(req.getContent())
                .isRead(false)
                .build();

        ForumMessage saved = forumMessageRepository.save(message);

        // Bắn thông báo realtime qua RabbitMQ cho chủ trọ
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("userId", post.getLandlordId());
            event.put("title", "Tin nhắn mới từ " + (req.getSenderName() != null ? req.getSenderName() : "Khách quan tâm"));
            String snippet = req.getContent() != null && req.getContent().length() > 60
                    ? req.getContent().substring(0, 57) + "..."
                    : req.getContent();
            event.put("content", "Nội dung: \"" + snippet + "\" về bài đăng: " + post.getTitle());
            event.put("type", "NEW_MESSAGE");
            event.put("referenceId", post.getId());
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, "forum.message", event);
            log.info("Sent forum message notification to landlord: {}", post.getLandlordId());
        } catch (Exception ex) {
            log.warn("Không thể gửi thông báo tin nhắn qua RabbitMQ: {}", ex.getMessage());
        }

        return ForumMessageResponse.fromEntityWithPostTitle(saved, post.getTitle());
    }

    /**
     * Đếm số tin nhắn chưa đọc của chủ trọ
     */
    public long getUnreadCount(Long landlordId) {
        return forumMessageRepository.countByReceiverIdAndIsReadFalse(landlordId);
    }

    /**
     * Lấy tin nhắn theo bài đăng
     */
    public List<ForumMessageResponse> getMessagesByPost(Long postId) {
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài đăng"));

        return forumMessageRepository.findByPostIdOrderByCreatedAtAsc(postId)
                .stream()
                .map(msg -> ForumMessageResponse.fromEntityWithPostTitle(msg, post.getTitle()))
                .collect(Collectors.toList());
    }

    /**
     * Chủ trọ lấy tất cả tin nhắn mình nhận được (từ mọi bài đăng)
     */
    public List<ForumMessageResponse> getMyReceivedMessages(Long landlordId) {
        List<ForumMessage> messages = forumMessageRepository.findByReceiverIdOrderByCreatedAtDesc(landlordId);

        return messages.stream()
                .map(msg -> {
                    String postTitle = forumPostRepository.findById(msg.getPostId())
                            .map(ForumPost::getTitle)
                            .orElse("Bài đăng đã xóa");
                    return ForumMessageResponse.fromEntityWithPostTitle(msg, postTitle);
                })
                .collect(Collectors.toList());
    }

    /**
     * Gửi tin nhắn trả lời (2 chiều: Chủ trọ <-> Khách thuê)
     */
    @Transactional
    public ForumMessageResponse replyMessage(Long postId, Long senderId, Long receiverId, SendForumMessageRequest req) {
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài đăng"));

        ForumMessage message = ForumMessage.builder()
                .postId(postId)
                .senderId(senderId)
                .senderName(req.getSenderName())
                .senderPhone(req.getSenderPhone())
                .receiverId(receiverId)
                .content(req.getContent())
                .isRead(false)
                .build();

        ForumMessage saved = forumMessageRepository.save(message);

        // Bắn thông báo realtime qua RabbitMQ cho người nhận
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("userId", receiverId);
            event.put("title", "Tin nhắn từ " + (req.getSenderName() != null ? req.getSenderName() : "Người dùng Roomily"));
            String snippet = req.getContent() != null && req.getContent().length() > 60
                    ? req.getContent().substring(0, 57) + "..."
                    : req.getContent();
            event.put("content", "Phản hồi: \"" + snippet + "\" về: " + post.getTitle());
            event.put("type", "NEW_MESSAGE");
            event.put("referenceId", post.getId());
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, "forum.message", event);
            log.info("Sent reply notification to user: {}", receiverId);
        } catch (Exception ex) {
            log.warn("Không thể gửi thông báo reply qua RabbitMQ: {}", ex.getMessage());
        }

        return ForumMessageResponse.fromEntityWithPostTitle(saved, post.getTitle());
    }

    /**
     * Lấy toàn bộ lịch sử trò chuyện 2 chiều giữa 2 người trên 1 bài đăng
     */
    @Transactional
    public List<ForumMessageResponse> getConversation(Long postId, Long user1, Long user2) {
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài đăng"));

        List<ForumMessage> list = forumMessageRepository.findConversation(postId, user1, user2);

        // Tự động đánh dấu đã đọc các tin nhắn gửi tới user1 (người đang mở chat)
        for (ForumMessage m : list) {
            if (m.getReceiverId().equals(user1) && Boolean.FALSE.equals(m.getIsRead())) {
                m.setIsRead(true);
                forumMessageRepository.save(m);
            }
        }

        return list.stream()
                .map(msg -> ForumMessageResponse.fromEntityWithPostTitle(msg, post.getTitle()))
                .collect(Collectors.toList());
    }

    /**
     * Lấy tất cả tin nhắn mà người dùng tham gia (gửi hoặc nhận) để lập danh sách hội thoại
     */
    public List<ForumMessageResponse> getAllMyMessages(Long currentUserId) {
        List<ForumMessage> messages = forumMessageRepository.findBySenderIdOrReceiverIdOrderByCreatedAtDesc(currentUserId, currentUserId);

        return messages.stream()
                .map(msg -> {
                    String postTitle = forumPostRepository.findById(msg.getPostId())
                            .map(ForumPost::getTitle)
                            .orElse("Bài đăng #" + msg.getPostId());
                    return ForumMessageResponse.fromEntityWithPostTitle(msg, postTitle);
                })
                .collect(Collectors.toList());
    }

    /**
     * Đánh dấu tin nhắn đã đọc
     */
    @Transactional
    public void markAsRead(Long messageId, Long landlordId) {
        ForumMessage msg = forumMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin nhắn"));

        if (msg.getReceiverId().equals(landlordId)) {
            msg.setIsRead(true);
            forumMessageRepository.save(msg);
        }
    }
}
