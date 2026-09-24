package com.roomily.property.controller;

import com.roomily.common.dto.ApiResponse;
import com.roomily.property.dto.request.CreateForumPostRequest;
import com.roomily.property.dto.request.SendForumMessageRequest;
import com.roomily.property.dto.response.ForumMessageResponse;
import com.roomily.property.dto.response.ForumPostResponse;
import com.roomily.property.service.ForumMessageService;
import com.roomily.property.service.ForumPostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/rental/forum")
@RequiredArgsConstructor
public class ForumController {

    private final ForumPostService forumPostService;
    private final ForumMessageService forumMessageService;

    // ===== BÀI ĐĂNG CHO THUÊ TRỌ =====

    /**
     * Chủ trọ tạo bài đăng cho thuê (hiển thị ngay, không cần duyệt)
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ForumPostResponse>> createPost(
            @RequestHeader("X-User-Id") Long landlordId,
            @Valid @RequestBody CreateForumPostRequest req) {
        ForumPostResponse res = forumPostService.createPost(landlordId, req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng bài cho thuê trọ thành công!", res));
    }

    /**
     * Xem tất cả bài đăng đang hoạt động (public — ai cũng xem được)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ForumPostResponse>>> getAllPosts(Pageable pageable) {
        Page<ForumPostResponse> page = forumPostService.getAllActivePosts(pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    /**
     * Xem chi tiết 1 bài đăng (public)
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ForumPostResponse>> getPostDetail(@PathVariable Long id) {
        ForumPostResponse res = forumPostService.getPostDetail(id);
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    /**
     * Chủ trọ xem bài đăng của mình
     */
    @GetMapping("/my-posts")
    public ResponseEntity<ApiResponse<List<ForumPostResponse>>> getMyPosts(
            @RequestHeader("X-User-Id") Long landlordId) {
        List<ForumPostResponse> list = forumPostService.getMyPosts(landlordId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * Chủ trọ đóng bài đăng
     */
    @PutMapping("/{id}/close")
    public ResponseEntity<ApiResponse<ForumPostResponse>> closePost(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long landlordId) {
        ForumPostResponse res = forumPostService.closePost(id, landlordId);
        return ResponseEntity.ok(ApiResponse.success("Đã đóng bài đăng", res));
    }

    // ===== TIN NHẮN LIÊN HỆ =====

    /**
     * Người dùng gửi tin nhắn liên hệ chủ trọ về bài đăng
     */
    @PostMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<ForumMessageResponse>> sendMessage(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long senderId,
            @Valid @RequestBody SendForumMessageRequest req) {
        ForumMessageResponse res = forumMessageService.sendMessage(id, senderId, req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Gửi tin nhắn thành công!", res));
    }

    /**
     * Lấy tin nhắn theo bài đăng
     */
    @GetMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<List<ForumMessageResponse>>> getMessagesByPost(
            @PathVariable Long id) {
        List<ForumMessageResponse> list = forumMessageService.getMessagesByPost(id);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * Chủ trọ lấy tất cả tin nhắn mình nhận được
     */
    @GetMapping("/messages/received")
    public ResponseEntity<ApiResponse<List<ForumMessageResponse>>> getReceivedMessages(
            @RequestHeader("X-User-Id") Long landlordId) {
        List<ForumMessageResponse> list = forumMessageService.getMyReceivedMessages(landlordId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * Lấy toàn bộ tin nhắn 2 chiều của người dùng hiện tại (cho Messenger UI)
     */
    @GetMapping("/messages/my-all")
    public ResponseEntity<ApiResponse<List<ForumMessageResponse>>> getMyAllMessages(
            @RequestHeader("X-User-Id") Long currentUserId) {
        List<ForumMessageResponse> list = forumMessageService.getAllMyMessages(currentUserId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * Trả lời tin nhắn (Reply trực tiếp 2 chiều Messenger)
     */
    @PostMapping("/{id}/reply")
    public ResponseEntity<ApiResponse<ForumMessageResponse>> replyMessage(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long senderId,
            @RequestParam("receiverId") Long receiverId,
            @Valid @RequestBody SendForumMessageRequest req) {
        ForumMessageResponse res = forumMessageService.replyMessage(id, senderId, receiverId, req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đã gửi tin nhắn phản hồi!", res));
    }

    /**
     * Lấy lịch sử trò chuyện 2 chiều giữa 2 người trên bài đăng
     */
    @GetMapping("/{id}/conversation")
    public ResponseEntity<ApiResponse<List<ForumMessageResponse>>> getConversation(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long currentUserId,
            @RequestParam("otherUserId") Long otherUserId) {
        List<ForumMessageResponse> list = forumMessageService.getConversation(id, currentUserId, otherUserId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * Lấy số tin nhắn chưa đọc của chủ trọ
     */
    @GetMapping("/messages/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadMessageCount(
            @RequestHeader("X-User-Id") Long landlordId) {
        long count = forumMessageService.getUnreadCount(landlordId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    /**
     * Cập nhật nhu cầu tìm người ở ghép
     */
    @PutMapping("/{id}/roommate-status")
    public ResponseEntity<ApiResponse<ForumPostResponse>> updateRoommateStatus(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody Map<String, Object> req) {
        Boolean needed = req.get("roommateNeeded") != null ? Boolean.valueOf(req.get("roommateNeeded").toString()) : false;
        Integer count = req.get("roommateCount") != null ? Integer.valueOf(req.get("roommateCount").toString()) : null;
        String note = req.get("roommateNote") != null ? req.get("roommateNote").toString() : null;

        ForumPostResponse res = forumPostService.updateRoommateStatus(id, userId, needed, count, note);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật trạng thái ở ghép", res));
    }

    /**
     * Cập nhật trạng thái đã có người thuê
     */
    @PutMapping("/{id}/rental-status")
    public ResponseEntity<ApiResponse<ForumPostResponse>> updateRentalStatus(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long landlordId,
            @RequestBody Map<String, Object> req) {
        Boolean isRented = req.get("isRented") != null ? Boolean.valueOf(req.get("isRented").toString()) : false;

        ForumPostResponse res = forumPostService.updateRentalStatus(id, landlordId, isRented);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật trạng thái thuê phòng", res));
    }

    /**
     * Đánh dấu tin nhắn đã đọc
     */
    @PutMapping("/messages/{msgId}/read")
    public ResponseEntity<ApiResponse<String>> markAsRead(
            @PathVariable Long msgId,
            @RequestHeader("X-User-Id") Long landlordId) {
        forumMessageService.markAsRead(msgId, landlordId);
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu đọc", "OK"));
    }
}
