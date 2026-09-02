package com.roomily.property.controller;

import com.roomily.common.dto.ApiResponse;
import com.roomily.property.dto.request.CreateRentalRequestDto;
import com.roomily.property.dto.request.CreateRoommatePostRequest;
import com.roomily.property.dto.request.JoinRequestCreateRequest;
import com.roomily.property.dto.response.JoinRequestResponse;
import com.roomily.property.dto.response.RentalRequestResponse;
import com.roomily.property.dto.response.RoommatePostResponse;
import com.roomily.property.service.JoinRequestService;
import com.roomily.property.service.RentalRequestService;
import com.roomily.property.service.RoommatePostService;
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
@RequestMapping("/api/v1/rental")
@RequiredArgsConstructor
public class RentalController {

    private final RentalRequestService rentalRequestService;
    private final RoommatePostService roommatePostService;
    private final JoinRequestService joinRequestService;

    // --- THUÊ PHÒNG ---
    @PostMapping("/requests")
    public ResponseEntity<ApiResponse<RentalRequestResponse>> createRentalRequest(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody CreateRentalRequestDto req) {
        RentalRequestResponse res = rentalRequestService.createRentalRequest(userId, req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Gửi yêu cầu thuê phòng thành công", res));
    }

    @GetMapping("/requests/my-requests")
    public ResponseEntity<ApiResponse<List<RentalRequestResponse>>> getMyRentalRequests(
            @RequestHeader("X-User-Id") Long userId) {
        List<RentalRequestResponse> list = rentalRequestService.getMyRequests(userId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/requests/room/{roomId}")
    public ResponseEntity<ApiResponse<List<RentalRequestResponse>>> getRequestsByRoom(
            @PathVariable Long roomId) {
        List<RentalRequestResponse> list = rentalRequestService.getRequestsByRoom(roomId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PutMapping("/requests/{id}/approve")
    public ResponseEntity<ApiResponse<Map<String, Object>>> approveRentalRequest(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long landlordId) {
        Map<String, Object> res = rentalRequestService.approveRentalRequest(id, landlordId);
        return ResponseEntity.ok(ApiResponse.success("Duyệt yêu cầu thuê thành công", res));
    }

    @PutMapping("/requests/{id}/reject")
    public ResponseEntity<ApiResponse<RentalRequestResponse>> rejectRentalRequest(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long landlordId) {
        RentalRequestResponse res = rentalRequestService.rejectRentalRequest(id, landlordId);
        return ResponseEntity.ok(ApiResponse.success("Từ chối yêu cầu thuê thành công", res));
    }

    // --- BÀI ĐĂNG Ở GHÉP ---
    @PostMapping("/posts")
    public ResponseEntity<ApiResponse<RoommatePostResponse>> createPost(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody CreateRoommatePostRequest req) {
        RoommatePostResponse res = roommatePostService.createPost(userId, req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo bài đăng tìm ở ghép thành công", res));
    }

    @GetMapping("/posts")
    public ResponseEntity<ApiResponse<Page<RoommatePostResponse>>> searchPosts(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        Page<RoommatePostResponse> page = roommatePostService.searchPosts(city, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/posts/{id}")
    public ResponseEntity<ApiResponse<RoommatePostResponse>> getPostDetail(@PathVariable Long id) {
        RoommatePostResponse res = roommatePostService.getPostDetail(id);
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    // --- YÊU CẦU XIN Ở GHÉP ---
    @PostMapping("/posts/{postId}/join")
    public ResponseEntity<ApiResponse<JoinRequestResponse>> sendJoinRequest(
            @PathVariable Long postId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody(required = false) JoinRequestCreateRequest req) {
        JoinRequestResponse res = joinRequestService.sendJoinRequest(postId, userId, req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Gửi yêu cầu ở ghép thành công", res));
    }

    @GetMapping("/posts/{postId}/requests")
    public ResponseEntity<ApiResponse<List<JoinRequestResponse>>> getRequestsByPost(
            @PathVariable Long postId) {
        List<JoinRequestResponse> list = joinRequestService.getRequestsByPost(postId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/posts/requests/{id}/approve")
    public ResponseEntity<ApiResponse<Map<String, Object>>> approveJoinRequest(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long landlordId) {
        Map<String, Object> res = joinRequestService.approveJoinRequestWithLock(id, landlordId);
        return ResponseEntity.ok(ApiResponse.success(res));
    }
}
