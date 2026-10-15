package com.roomily.property.service;

import com.roomily.common.dto.ApiResponse;
import com.roomily.common.exception.BadRequestException;
import com.roomily.common.exception.ResourceNotFoundException;
import com.roomily.property.client.AuthClient;
import com.roomily.property.dto.request.CreateReportRequest;
import com.roomily.property.dto.request.ResolveReportRequest;
import com.roomily.property.dto.response.LandlordInfo;
import com.roomily.property.dto.response.ReportResponse;
import com.roomily.property.entity.ForumPost;
import com.roomily.property.entity.Property;
import com.roomily.property.entity.Report;
import com.roomily.property.entity.Room;
import com.roomily.property.repository.ForumPostRepository;
import com.roomily.property.repository.PropertyRepository;
import com.roomily.property.repository.ReportRepository;
import com.roomily.property.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final RoomRepository roomRepository;
    private final PropertyRepository propertyRepository;
    private final ForumPostRepository forumPostRepository;
    private final AuthClient authClient;
    private final AdminNotifier adminNotifier;
    private final AdminAuditLogger auditLogger;

    private static final Set<String> VALID_TARGET_TYPES = Set.of("ROOM", "FORUM_POST");
    private static final Set<String> VALID_ACTIONS = Set.of("WARNING", "HIDE_POST", "BAN_USER", "DISMISS");

    @Transactional
    public ReportResponse createReport(Long reporterId, String reporterEmail, CreateReportRequest request) {
        String targetType = request.getTargetType() == null ? "" : request.getTargetType().trim().toUpperCase();
        if (!VALID_TARGET_TYPES.contains(targetType)) {
            throw new BadRequestException("Loại đối tượng báo cáo không hợp lệ (chỉ hỗ trợ ROOM hoặc FORUM_POST)");
        }

        Long targetId = request.getTargetId();
        String targetTitle;
        String targetAddress = "";
        Long targetOwnerId;
        String targetOwnerName = null;

        if ("ROOM".equals(targetType)) {
            Room room = roomRepository.findById(targetId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin phòng trọ ID: " + targetId));
            Property property = room.getProperty();
            targetTitle = "Phòng " + room.getRoomNumber() + " - " + property.getTitle();
            targetAddress = property.getAddress() + ", " + property.getWard() + ", " + property.getDistrict() + ", " + property.getCity();
            targetOwnerId = property.getLandlordId();
        } else {
            ForumPost post = forumPostRepository.findById(targetId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết diễn đàn ID: " + targetId));
            targetTitle = post.getTitle();
            targetAddress = (post.getAddress() != null ? post.getAddress() : "") + ", " +
                    (post.getWard() != null ? post.getWard() : "") + ", " +
                    (post.getDistrict() != null ? post.getDistrict() : "") + ", " +
                    (post.getCity() != null ? post.getCity() : "");
            targetOwnerId = post.getLandlordId();
            targetOwnerName = post.getLandlordName();
        }

        // Chặn tự báo cáo bài của chính mình
        if (reporterId != null && reporterId.equals(targetOwnerId)) {
            throw new BadRequestException("Bạn không thể tự gửi báo cáo vi phạm cho nội dung của chính mình.");
        }

        // Anti-spam: kiểm tra đã có báo cáo PENDING chưa
        boolean alreadyReported = reportRepository.existsByReporterIdAndTargetTypeAndTargetIdAndStatus(
                reporterId, targetType, targetId, "PENDING");
        if (alreadyReported) {
            throw new BadRequestException("Bạn đã gửi báo cáo cho nội dung này và đang chờ duyệt. Vui lòng không gửi lặp lại.");
        }

        // Tra cứu tên người báo cáo và tên chủ trọ nếu chưa có
        String reporterName = "Người dùng #" + reporterId;
        try {
            List<Long> idsToFetch = new ArrayList<>();
            idsToFetch.add(reporterId);
            if (targetOwnerId != null && targetOwnerName == null) {
                idsToFetch.add(targetOwnerId);
            }
            ApiResponse<List<LandlordInfo>> userRes = authClient.getUsersByIds(idsToFetch);
            if (userRes != null && userRes.getData() != null) {
                for (LandlordInfo u : userRes.getData()) {
                    if (u.getId().equals(reporterId)) {
                        reporterName = u.getFullName() != null ? u.getFullName() : u.getEmail();
                    }
                    if (targetOwnerId != null && u.getId().equals(targetOwnerId) && targetOwnerName == null) {
                        targetOwnerName = u.getFullName() != null ? u.getFullName() : u.getEmail();
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Không thể lấy thông tin người dùng từ AuthClient: {}", ex.getMessage());
        }

        Report report = Report.builder()
                .reporterId(reporterId)
                .reporterName(reporterName)
                .reporterEmail(reporterEmail)
                .targetType(targetType)
                .targetId(targetId)
                .targetTitle(targetTitle)
                .targetAddress(targetAddress)
                .targetOwnerId(targetOwnerId)
                .targetOwnerName(targetOwnerName != null ? targetOwnerName : "Chủ trọ #" + targetOwnerId)
                .reason(request.getReason())
                .description(request.getDescription())
                .evidenceImages(request.getEvidenceImages() != null ? request.getEvidenceImages() : new ArrayList<>())
                .status("PENDING")
                .build();

        Report saved = reportRepository.save(report);
        log.info("Đã ghi nhận báo cáo vi phạm #{} từ user {} về {} #{}", saved.getId(), reporterId, targetType, targetId);
        return ReportResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public Page<ReportResponse> listReports(String status, String targetType, String keyword, Pageable pageable) {
        String st = (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) ? null : status.trim().toUpperCase();
        String tt = (targetType == null || targetType.isBlank() || "ALL".equalsIgnoreCase(targetType)) ? null : targetType.trim().toUpperCase();
        String kw = (keyword == null || keyword.isBlank()) ? null : keyword.trim();

        return reportRepository.searchForAdmin(st, tt, kw, pageable).map(ReportResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getStats() {
        Map<String, Long> map = new LinkedHashMap<>();
        long pending = reportRepository.countByStatus("PENDING");
        long resolved = reportRepository.countByStatus("RESOLVED");
        long dismissed = reportRepository.countByStatus("DISMISSED");
        long total = pending + resolved + dismissed;

        map.put("PENDING", pending);
        map.put("RESOLVED", resolved);
        map.put("DISMISSED", dismissed);
        map.put("ALL", total);
        return map;
    }

    @Transactional(readOnly = true)
    public ReportResponse getReportDetail(Long id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy báo cáo ID: " + id));
        return ReportResponse.fromEntity(report);
    }

    @Transactional
    public ReportResponse resolveReport(Long id, ResolveReportRequest request, Long adminId, String adminEmail, String clientIp) {
        String action = request.getAction() == null ? "" : request.getAction().trim().toUpperCase();
        if (!VALID_ACTIONS.contains(action)) {
            throw new BadRequestException("Hành động không hợp lệ. Chỉ chấp nhận: WARNING, HIDE_POST, BAN_USER, DISMISS");
        }

        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy báo cáo ID: " + id));

        String note = request.getAdminNote() != null ? request.getAdminNote().trim() : "";

        report.setAdminAction(action);
        report.setAdminNote(note);
        report.setResolvedBy(adminId);
        report.setResolvedAt(LocalDateTime.now());

        switch (action) {
            case "DISMISS" -> {
                report.setStatus("DISMISSED");
                auditLogger.log(adminEmail, clientIp, "DISMISS_REPORT",
                        "Bỏ qua báo cáo vi phạm #" + id + " đối với " + report.getTargetType() + " ID: " + report.getTargetId()
                                + (note.isEmpty() ? "" : " - Ghi chú: " + note));
            }
            case "WARNING" -> {
                if (note.isEmpty()) {
                    throw new BadRequestException("Vui lòng nhập nội dung thư cảnh cáo gửi đến chủ sở hữu");
                }
                report.setStatus("RESOLVED");
                // Gửi thông báo trực tiếp qua RabbitMQ vào hòm thư chủ trọ
                adminNotifier.notifyUser(report.getTargetOwnerId(),
                        "Cảnh báo vi phạm nội dung",
                        "Nội dung \"" + report.getTargetTitle() + "\" của bạn đã nhận được báo cáo vi phạm. " + note,
                        "REPORT_WARNING", report.getTargetId());

                auditLogger.log(adminEmail, clientIp, "WARN_LANDLORD",
                        "Gửi cảnh cáo chủ sở hữu ID: " + report.getTargetOwnerId() + " theo báo cáo #" + id + " - Lời nhắn: " + note);
            }
            case "HIDE_POST" -> {
                report.setStatus("RESOLVED");
                if ("ROOM".equals(report.getTargetType())) {
                    roomRepository.findById(report.getTargetId()).ifPresent(room -> {
                        room.setStatus("HIDDEN");
                        roomRepository.save(room);
                    });
                } else if ("FORUM_POST".equals(report.getTargetType())) {
                    forumPostRepository.findById(report.getTargetId()).ifPresent(post -> {
                        post.setModerationStatus("REJECTED");
                        post.setStatus("CLOSED");
                        post.setRejectReason(note.isEmpty() ? "Vi phạm quy định nền tảng (theo báo cáo #" + id + ")" : note);
                        forumPostRepository.save(post);
                    });
                }

                adminNotifier.notifyUser(report.getTargetOwnerId(),
                        "Nội dung đã bị ẩn do vi phạm",
                        "Nội dung \"" + report.getTargetTitle() + "\" đã bị quản trị viên tạm ẩn/khóa. Lý do: "
                                + (note.isEmpty() ? "Vi phạm tiêu chuẩn cộng đồng" : note),
                        "CONTENT_HIDDEN", report.getTargetId());

                auditLogger.log(adminEmail, clientIp, "HIDE_VIOLATION_CONTENT",
                        "Tạm ẩn " + report.getTargetType() + " ID: " + report.getTargetId() + " (" + report.getTargetTitle() + ") theo báo cáo #" + id);
            }
            case "BAN_USER" -> {
                report.setStatus("RESOLVED");
                // Khóa tài khoản chủ trọ
                try {
                    authClient.lockUserInternal(report.getTargetOwnerId());
                } catch (Exception ex) {
                    log.error("Lỗi khi gọi AuthClient khóa tài khoản {}: {}", report.getTargetOwnerId(), ex.getMessage());
                }

                // Đồng thời ẩn nội dung đang bị báo cáo
                if ("ROOM".equals(report.getTargetType())) {
                    roomRepository.findById(report.getTargetId()).ifPresent(room -> {
                        room.setStatus("HIDDEN");
                        roomRepository.save(room);
                    });
                } else if ("FORUM_POST".equals(report.getTargetType())) {
                    forumPostRepository.findById(report.getTargetId()).ifPresent(post -> {
                        post.setModerationStatus("REJECTED");
                        post.setStatus("CLOSED");
                        forumPostRepository.save(post);
                    });
                }

                adminNotifier.notifyUser(report.getTargetOwnerId(),
                        "Tài khoản bị khóa do vi phạm nghiêm trọng",
                        "Tài khoản của bạn đã bị vô hiệu hóa do vi phạm chính sách nền tảng. " + (note.isEmpty() ? "" : "Lý do: " + note),
                        "ACCOUNT_LOCKED", report.getTargetId());

                auditLogger.log(adminEmail, clientIp, "BAN_USER_FOR_VIOLATION",
                        "Khóa tài khoản người dùng ID: " + report.getTargetOwnerId() + " do vi phạm nghiêm trọng tại báo cáo #" + id);
            }
        }

        Report saved = reportRepository.save(report);
        return ReportResponse.fromEntity(saved);
    }
}
