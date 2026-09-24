package com.roomily.property.repository;

import com.roomily.property.entity.ForumMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ForumMessageRepository extends JpaRepository<ForumMessage, Long> {

    List<ForumMessage> findByPostIdOrderByCreatedAtAsc(Long postId);

    List<ForumMessage> findByReceiverIdOrderByCreatedAtDesc(Long receiverId);

    List<ForumMessage> findBySenderIdOrReceiverIdOrderByCreatedAtDesc(Long senderId, Long receiverId);

    List<ForumMessage> findByPostIdAndSenderIdOrderByCreatedAtAsc(Long postId, Long senderId);

    @org.springframework.data.jpa.repository.Query("SELECT m FROM ForumMessage m WHERE m.postId = :postId AND ((m.senderId = :user1 AND m.receiverId = :user2) OR (m.senderId = :user2 AND m.receiverId = :user1)) ORDER BY m.createdAt ASC")
    List<ForumMessage> findConversation(
            @org.springframework.data.repository.query.Param("postId") Long postId,
            @org.springframework.data.repository.query.Param("user1") Long user1,
            @org.springframework.data.repository.query.Param("user2") Long user2);

    long countByReceiverIdAndIsReadFalse(Long receiverId);
}
