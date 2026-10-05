package com.roomily.property.service;

import com.roomily.common.exception.BadRequestException;
import com.roomily.common.exception.ResourceNotFoundException;
import com.roomily.property.dto.response.ForumPostResponse;
import com.roomily.property.entity.ForumPost;
import com.roomily.property.repository.ForumPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AdminForumService {

    private static final Set<String> MODERATION_STATUS = Set.of("PENDING", "APPROVED", "REJECTED");

    private final ForumPostRepository forumPostRepository;
    private final AdminNotifier adminNotifier;

    @Transactional(readOnly = true)
    public Page<ForumPostResponse> list(String status, String keyword, Pageable pageable) {
        String ms = null;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            ms = status.trim().toUpperCase();
            if (!MODERATION_STATUS.contains(ms)) {
                throw new BadRequestException("Bộ lọc trạng thái không hợp lệ. Chỉ chấp nhận: PENDING, APPROVED, REJECTED");
            }
        }
        String kw = (keyword == null || keyword.isBlank()) ? null : "%" + keyword.trim().toLowerCase() + "%";
        return forumPostRepository.searchForAdmin(ms, kw, pageable).map(ForumPostResponse::fromEntity);
    }

    /** Số lượng bài theo từng trạng thái kiểm duyệt (hiển thị trên các tab). */
    @Transactional(readOnly = true)
    public Map<String, Long> stats() {
        Map<String, Long> result = new LinkedHashMap<>();
        long total = 0;
        for (String s : new String[]{"PENDING", "APPROVED", "REJECTED"}) {
            long c = forumPostRepository.countByModerationStatusAndStatusNot(s, "DELETED");
            result.put(s, c);
            total += c;
        }
        result.put("ALL", total);
        return result;
    }

    @Transactional
    public ForumPostResponse updateStatus(Long id, String status, String reason, Long adminId) {
        String newStatus = status == null ? "" : status.trim().toUpperCase();
        if (!MODERATION_STATUS.contains(newStatus)) {
            throw new BadRequestException("Trạng thái không hợp lệ. Chỉ chấp nhận: PENDING, APPROVED, REJECTED");
        }
        String cleanReason = reason == null ? null : reason.trim();
        if ("REJECTED".equals(newStatus) && (cleanReason == null || cleanReason.isEmpty())) {
            throw new BadRequestException("Vui lòng nhập lý do từ chối bài đăng");
        }

        ForumPost post = findNotDeleted(id);
        post.setModerationStatus(newStatus);
        post.setRejectReason("REJECTED".equals(newStatus) ? cleanReason : null);
        post.setModeratedAt(LocalDateTime.now());
        post.setModeratedBy(adminId);
        ForumPost saved = forumPostRepository.save(post);

        if ("APPROVED".equals(newStatus)) {
            adminNotifier.notifyUser(post.getLandlordId(),
                    "Bài đăng đã được duyệt",
                    "Bài đăng \"" + post.getTitle() + "\" đã được duyệt và hiển thị trên diễn đàn.",
                    "FORUM_POST_APPROVED", post.getId());
        } else if ("REJECTED".equals(newStatus)) {
            adminNotifier.notifyUser(post.getLandlordId(),
                    "Bài đăng bị từ chối",
                    "Bài đăng \"" + post.getTitle() + "\" bị từ chối. Lý do: " + cleanReason,
                    "FORUM_POST_REJECTED", post.getId());
        }
        return ForumPostResponse.fromEntity(saved);
    }

    /** Xóa mềm: bài biến mất khỏi diễn đàn và khỏi danh sách kiểm duyệt, hội thoại liên quan vẫn được giữ nguyên. */
    @Transactional
    public String delete(Long id, String reason) {
        ForumPost post = findNotDeleted(id);
        post.setStatus("DELETED");
        post.setModeratedAt(LocalDateTime.now());
        forumPostRepository.save(post);

        adminNotifier.notifyUser(post.getLandlordId(),
                "Bài đăng đã bị xóa",
                "Bài đăng \"" + post.getTitle() + "\" đã bị quản trị viên xóa."
                        + (reason != null && !reason.isBlank() ? " Lý do: " + reason.trim() : ""),
                "FORUM_POST_DELETED", post.getId());
        return post.getTitle();
    }

    private ForumPost findNotDeleted(Long id) {
        ForumPost post = forumPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài đăng"));
        if ("DELETED".equals(post.getStatus())) {
            throw new ResourceNotFoundException("Không tìm thấy bài đăng");
        }
        return post;
    }
}
