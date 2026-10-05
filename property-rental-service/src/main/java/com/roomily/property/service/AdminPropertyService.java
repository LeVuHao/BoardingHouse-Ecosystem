package com.roomily.property.service;

import com.roomily.common.dto.ApiResponse;
import com.roomily.common.exception.BadRequestException;
import com.roomily.common.exception.ResourceNotFoundException;
import com.roomily.property.client.AuthClient;
import com.roomily.property.dto.response.AdminPropertyResponse;
import com.roomily.property.dto.response.LandlordInfo;
import com.roomily.property.entity.ForumPost;
import com.roomily.property.entity.ForumPostImage;
import com.roomily.property.entity.Property;
import com.roomily.property.entity.Room;
import com.roomily.property.entity.RoomImage;
import com.roomily.property.repository.ContractRepository;
import com.roomily.property.repository.ForumPostRepository;
import com.roomily.property.repository.PropertyRepository;
import com.roomily.property.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminPropertyService {

    private static final Set<String> ALLOWED_STATUS = Set.of("ACTIVE", "HIDDEN");

    private final PropertyRepository propertyRepository;
    private final ContractRepository contractRepository;
    private final TenantRepository tenantRepository;
    private final ForumPostRepository forumPostRepository;
    private final AuthClient authClient;
    private final AdminNotifier adminNotifier;

    // ============ LIST ============
    @Transactional(readOnly = true)
    public Page<AdminPropertyResponse> list(String keyword, String status, Pageable pageable) {
        String kw = (keyword == null || keyword.isBlank()) ? null : "%" + keyword.trim().toLowerCase() + "%";
        String st = normalizeStatusFilter(status);

        Page<Property> page = propertyRepository.searchForAdmin(st, kw, pageable);

        Set<Long> landlordIds = page.getContent().stream()
                .map(Property::getLandlordId).collect(Collectors.toSet());
        Map<Long, LandlordInfo> landlords = fetchLandlords(landlordIds);

        return page.map(p -> toResponse(p, landlords.get(p.getLandlordId()), false));
    }

    // ============ DETAIL ============
    @Transactional(readOnly = true)
    public AdminPropertyResponse getDetail(Long id) {
        Property p = findNotDeleted(id);
        Map<Long, LandlordInfo> landlords = fetchLandlords(Set.of(p.getLandlordId()));
        return toResponse(p, landlords.get(p.getLandlordId()), true);
    }

    // ============ UPDATE STATUS (ẩn / hiện) ============
    @Transactional
    public AdminPropertyResponse updateStatus(Long id, String status, String reason) {
        String newStatus = status == null ? "" : status.trim().toUpperCase();
        if (!ALLOWED_STATUS.contains(newStatus)) {
            throw new BadRequestException("Trạng thái không hợp lệ. Chỉ chấp nhận: ACTIVE, HIDDEN");
        }
        Property p = findNotDeleted(id);

        p.setStatus(newStatus);
        p.setStatusReason("HIDDEN".equals(newStatus) && reason != null && !reason.isBlank() ? reason.trim() : null);
        propertyRepository.save(p);

        if ("HIDDEN".equals(newStatus)) {
            String why = p.getStatusReason() != null ? " Lý do: " + p.getStatusReason() : "";
            adminNotifier.notifyUser(p.getLandlordId(),
                    "Khu trọ của bạn đã bị tạm ẩn",
                    "Khu trọ \"" + p.getTitle() + "\" đã bị quản trị viên tạm ẩn khỏi hệ thống." + why,
                    "PROPERTY_HIDDEN", p.getId());
        } else {
            adminNotifier.notifyUser(p.getLandlordId(),
                    "Khu trọ của bạn đã hiển thị trở lại",
                    "Khu trọ \"" + p.getTitle() + "\" đã được quản trị viên hiển thị lại.",
                    "PROPERTY_VISIBLE", p.getId());
        }
        return toResponse(p, null, false);
    }

    // ============ DELETE (xóa mềm) ============
    @Transactional
    public String delete(Long id, String reason) {
        Property p = findNotDeleted(id);

        List<Long> roomIds = p.getRooms().stream().map(Room::getId).collect(Collectors.toList());
        if (!roomIds.isEmpty()) {
            if (contractRepository.existsByRoomIdInAndStatus(roomIds, "ACTIVE")
                    || tenantRepository.existsByRoomIdInAndIsStayingTrue(roomIds)) {
                throw new BadRequestException(
                        "Khu trọ đang có hợp đồng còn hiệu lực hoặc người đang thuê. Hãy tạm ẩn thay vì xóa.");
            }
            // Đóng các bài đăng diễn đàn gắn với khu trọ này
            for (ForumPost post : forumPostRepository.findByRoomIdIn(roomIds)) {
                if (!"DELETED".equals(post.getStatus())) {
                    post.setStatus("CLOSED");
                }
            }
        }

        p.setStatus("DELETED");
        p.setStatusReason(reason != null && !reason.isBlank() ? reason.trim() : null);
        propertyRepository.save(p);

        adminNotifier.notifyUser(p.getLandlordId(),
                "Khu trọ của bạn đã bị xóa",
                "Khu trọ \"" + p.getTitle() + "\" đã bị quản trị viên xóa khỏi hệ thống."
                        + (p.getStatusReason() != null ? " Lý do: " + p.getStatusReason() : ""),
                "PROPERTY_DELETED", p.getId());
        return p.getTitle();
    }

    // ============ HELPERS ============
    private Property findNotDeleted(Long id) {
        Property p = propertyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khu trọ"));
        if ("DELETED".equals(p.getStatus())) {
            throw new ResourceNotFoundException("Không tìm thấy khu trọ");
        }
        return p;
    }

    private String normalizeStatusFilter(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) return null;
        String s = status.trim().toUpperCase();
        if (!ALLOWED_STATUS.contains(s)) {
            throw new BadRequestException("Bộ lọc trạng thái không hợp lệ. Chỉ chấp nhận: ACTIVE, HIDDEN");
        }
        return s;
    }

    private Map<Long, LandlordInfo> fetchLandlords(Set<Long> ids) {
        if (ids == null || ids.isEmpty()) return Collections.emptyMap();
        try {
            ApiResponse<List<LandlordInfo>> res = authClient.getUsersByIds(new ArrayList<>(ids));
            if (res != null && res.getData() != null) {
                return res.getData().stream()
                        .collect(Collectors.toMap(LandlordInfo::getId, u -> u, (a, b) -> a));
            }
        } catch (Exception ex) {
            log.warn("Auth-Service không khả dụng khi lấy thông tin chủ trọ: {}", ex.getMessage());
        }
        return Collections.emptyMap();
    }

    private String rentalState(Room r) {
        if ("MAINTENANCE".equals(r.getStatus())) return "MAINTENANCE";
        boolean occupied = "FULL".equals(r.getStatus())
                || (r.getCurrentOccupants() != null && r.getCurrentOccupants() > 0);
        return occupied ? "OCCUPIED" : "AVAILABLE";
    }

    private List<String> roomImageUrls(Room r) {
        if (r.getImages() == null) return Collections.emptyList();
        return r.getImages().stream()
                .sorted(Comparator.comparing((RoomImage i) -> !Boolean.TRUE.equals(i.getIsPrimary())))
                .map(RoomImage::getImageUrl)
                .collect(Collectors.toList());
    }

    private AdminPropertyResponse toResponse(Property p, LandlordInfo landlord, boolean withDetail) {
        List<Room> rooms = p.getRooms() != null ? p.getRooms() : Collections.emptyList();

        int available = 0, occupied = 0, maintenance = 0;
        for (Room r : rooms) {
            switch (rentalState(r)) {
                case "MAINTENANCE" -> maintenance++;
                case "OCCUPIED" -> occupied++;
                default -> available++;
            }
        }

        // Ảnh đại diện (list): chỉ lấy ảnh URL của phòng để tránh trả base64 nặng
        String thumbnail = rooms.stream()
                .flatMap(r -> roomImageUrls(r).stream())
                .filter(u -> u != null && !u.startsWith("data:"))
                .findFirst().orElse(null);

        AdminPropertyResponse.AdminPropertyResponseBuilder b = AdminPropertyResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .description(p.getDescription())
                .address(p.getAddress())
                .city(p.getCity())
                .district(p.getDistrict())
                .ward(p.getWard())
                .utilities(p.getUtilities())
                .latitude(p.getLatitude())
                .longitude(p.getLongitude())
                .status(p.getStatus())
                .statusReason(p.getStatusReason())
                .createdAt(p.getCreatedAt())
                .landlordId(p.getLandlordId())
                .landlordName(landlord != null ? landlord.getFullName() : null)
                .landlordEmail(landlord != null ? landlord.getEmail() : null)
                .landlordPhone(landlord != null ? landlord.getPhoneNumber() : null)
                .landlordAvatar(landlord != null ? landlord.getAvatarUrl() : null)
                .landlordStatus(landlord != null ? landlord.getStatus() : null)
                .totalRooms(rooms.size())
                .availableRooms(available)
                .occupiedRooms(occupied)
                .maintenanceRooms(maintenance)
                .thumbnail(thumbnail);

        if (withDetail) {
            List<AdminPropertyResponse.RoomItem> roomItems = rooms.stream()
                    .map(r -> AdminPropertyResponse.RoomItem.builder()
                            .id(r.getId())
                            .roomNumber(r.getRoomNumber())
                            .price(r.getPrice())
                            .area(r.getArea())
                            .capacity(r.getCapacity())
                            .currentOccupants(r.getCurrentOccupants())
                            .status(r.getStatus())
                            .rentalState(rentalState(r))
                            .images(roomImageUrls(r))
                            .build())
                    .collect(Collectors.toList());

            // Gallery = ảnh các phòng + ảnh của bài đăng diễn đàn gắn với các phòng đó
            LinkedHashSet<String> gallery = new LinkedHashSet<>();
            for (Room r : rooms) gallery.addAll(roomImageUrls(r));
            List<Long> roomIds = rooms.stream().map(Room::getId).collect(Collectors.toList());
            if (!roomIds.isEmpty()) {
                for (ForumPost post : forumPostRepository.findByRoomIdIn(roomIds)) {
                    if (post.getImages() == null) continue;
                    for (ForumPostImage img : post.getImages()) {
                        if (img.getImageUrl() != null && !img.getImageUrl().isBlank()) {
                            gallery.add(img.getImageUrl());
                        }
                    }
                }
            }
            b.rooms(roomItems).gallery(new ArrayList<>(gallery));
        }
        return b.build();
    }
}
