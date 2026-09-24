package com.roomily.property.dto.response;

import com.roomily.property.entity.ForumMessage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForumMessageResponse {

    private Long id;
    private Long postId;
    private Long senderId;
    private String senderName;
    private String senderPhone;
    private Long receiverId;
    private String content;
    private Boolean isRead;
    private LocalDateTime createdAt;

    // Thêm thông tin bài đăng để hiển thị
    private String postTitle;

    public static ForumMessageResponse fromEntity(ForumMessage msg) {
        if (msg == null) return null;

        return ForumMessageResponse.builder()
                .id(msg.getId())
                .postId(msg.getPostId())
                .senderId(msg.getSenderId())
                .senderName(msg.getSenderName())
                .senderPhone(msg.getSenderPhone())
                .receiverId(msg.getReceiverId())
                .content(msg.getContent())
                .isRead(msg.getIsRead())
                .createdAt(msg.getCreatedAt())
                .build();
    }

    public static ForumMessageResponse fromEntityWithPostTitle(ForumMessage msg, String postTitle) {
        ForumMessageResponse res = fromEntity(msg);
        if (res != null) {
            res.setPostTitle(postTitle);
        }
        return res;
    }
}
