import api from "./axiosInstance";

export const unwrapApiData = (response) => response?.data ?? response;

export const authApi = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  registerLandlord: (data) => api.post("/auth/landlord/register", data),
  createLandlordRequest: (data) => api.post("/auth/landlord-request", data),
  getLandlordRequestStatus: (code) => api.get(`/auth/landlord-request/${code}`),
  loginWithGoogle: (data) => api.post("/auth/google", data),
  forgotPassword: (data) => api.post("/auth/forgot-password", data),
  resetPassword: (data) => api.post("/auth/reset-password", data),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => api.put("/auth/profile", data),
  getUserInfo: (id) => api.get(`/auth/users/${id}`),
  getLandlordStatus: (userId) => api.get(`/auth/landlord/status/${userId}`),
};

export const propertyApi = {
  // Search & detail (Public)
  searchRooms: (params) => api.get("/rooms/search", { params }),
  getRoomDetail: (id) => api.get(`/rooms/${id}`),

  // Landlord: Khu trọ
  createProperty: (data) => api.post("/properties", data),
  getMyProperties: () => api.get("/properties/my-properties"),
  updateProperty: (id, data) => api.put(`/properties/${id}`, data),
  getPropertyDetail: (id) => api.get(`/properties/${id}`),
  getPropertyRooms: (id) => api.get(`/properties/${id}/rooms`),

  // Landlord: Phòng trọ
  createRoom: (data) => api.post("/rooms", data),
  updateRoom: (id, data) => api.put(`/rooms/${id}`, data),
  addRoomImages: (id, data) => api.post(`/rooms/${id}/images`, data),
};

export const rentalApi = {
  createRentalRequest: (data) => api.post("/rental/requests", data),
  getMyRentalRequests: () => api.get("/rental/requests/my-requests"),
  getRequestsByRoom: (roomId) => api.get(`/rental/requests/room/${roomId}`),
  getLandlordRequests: (params) =>
    api.get("/rental/requests/landlord", { params }),
  approveRentalRequest: (id) => api.put(`/rental/requests/${id}/approve`),
  rejectRentalRequest: (id) => api.put(`/rental/requests/${id}/reject`),
  // Roommate
  getRoommatePosts: (params) => api.get("/rental/posts", { params }),
  getPostDetail: (id) => api.get(`/rental/posts/${id}`),
  createRoommatePost: (data) => api.post("/rental/posts", data),
  sendJoinRequest: (postId, data) =>
    api.post(`/rental/posts/${postId}/join`, data),
  getJoinRequests: (postId) => api.get(`/rental/posts/${postId}/requests`),
  approveJoinRequest: (id) => api.post(`/rental/posts/requests/${id}/approve`),
};

// [HUY] Contract API
export const contractApi = {
  getMyContracts: () => api.get("/contracts/my"),
  getLandlordContracts: () => api.get("/contracts/landlord"),
  getContractDetail: (id) => api.get(`/contracts/${id}`),
};

export const billingApi = {
  getMyBills: () => api.get("/bills/my-bills"),
  getLandlordBills: () => api.get("/bills/landlord-bills"),
  createBill: (data) => api.post("/bills", data),
  createBillPaymentUrl: (billId, amount) =>
    api.post(`/payments/create-bill-payment-url/${billId}?amount=${amount}`),
  // Public: xác nhận kết quả thanh toán VNPay trả về (dùng ở trang callback)
  confirmVnpayCallback: (queryString) =>
    api.get(`/payments/vnpay-callback${queryString}`),
};

export const notificationApi = {
  getMyNotifications: () => api.get("/notifications"),
  getUnreadCount: () => api.get("/notifications/unread-count"),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
};

export const adminApi = {
  getStats: () => api.get("/auth/admin/stats"),
  getUsers: (params) => api.get("/auth/admin/users", { params }),
  lockUser: (id) => api.put(`/auth/admin/users/${id}/lock`),
  unlockUser: (id) => api.put(`/auth/admin/users/${id}/unlock`),

  // ===== Quản lý & Cấp quyền Chủ trọ =====
  createLandlordDirectly: (data) => api.post("/auth/admin/landlords", data),
  getLandlordRequests: (params) => api.get("/auth/admin/landlord-requests", { params }),
  approveLandlordRequest: (id, data) => api.post(`/auth/admin/landlord-requests/${id}/approve`, data),
  rejectLandlordRequest: (id, data) => api.post(`/auth/admin/landlord-requests/${id}/reject`, data),

  // ===== Nhật ký hệ thống =====
  getAuditLogs: (params) => api.get("/auth/admin/audit-logs", { params }),
  getAuditActions: () => api.get("/auth/admin/audit-logs/actions"),

  // ===== Task 2.1: Khu trọ & Phòng =====
  getProperties: (params) => api.get("/admin/properties", { params }),
  getPropertyDetail: (id) => api.get(`/admin/properties/${id}`),
  updatePropertyStatus: (id, data) => api.patch(`/admin/properties/${id}/status`, data),
  deleteProperty: (id, reason) =>
    api.delete(`/admin/properties/${id}`, { params: reason ? { reason } : {} }),

  // ===== Task 2.2: Diễn đàn & Bài đăng =====
  getForumPosts: (params) => api.get("/admin/forum/posts", { params }),
  getForumPostStats: () => api.get("/admin/forum/posts/stats"),
  updateForumPostStatus: (id, data) => api.patch(`/admin/forum/posts/${id}/status`, data),
  deleteForumPost: (id, reason) =>
    api.delete(`/admin/forum/posts/${id}`, { params: reason ? { reason } : {} }),

  // ===== Task 2.3: Danh mục dữ liệu =====
  getAmenities: () => api.get("/admin/amenities"),
  createAmenity: (data) => api.post("/admin/amenities", data),
  updateAmenity: (id, data) => api.put(`/admin/amenities/${id}`, data),
  getAmenity: (id) => api.get(`/admin/amenities/${id}`),
  deleteAmenity: (id) => api.delete(`/admin/amenities/${id}`),
};

// Dữ liệu danh mục công khai (do Admin quản lý)
export const catalogApi = {
  getAmenities: () => api.get("/amenities"),
};

export const forumApi = {
  // Bài đăng cho thuê trọ
  createPost: (data) => api.post("/rental/forum", data),
  getAllPosts: (params) => api.get("/rental/forum", { params }),
  getPostDetail: (id) => api.get(`/rental/forum/${id}`),
  getMyPosts: () => api.get("/rental/forum/my-posts"),
  closePost: (id) => api.put(`/rental/forum/${id}/close`),
  // Tin nhắn liên hệ
  sendMessage: (postId, data) => api.post(`/rental/forum/${postId}/messages`, data),
  replyMessage: (postId, receiverId, data) => api.post(`/rental/forum/${postId}/reply?receiverId=${receiverId}`, data),
  getMessages: (postId) => api.get(`/rental/forum/${postId}/messages`),
  getConversation: (postId, otherUserId) => api.get(`/rental/forum/${postId}/conversation?otherUserId=${otherUserId}`),
  getReceivedMessages: () => api.get("/rental/forum/messages/received"),
  getMyAllMessages: () => api.get("/rental/forum/messages/my-all"),
  getUnreadMessageCount: () => api.get("/rental/forum/messages/unread-count"),
  markMessageRead: (msgId) => api.put(`/rental/forum/messages/${msgId}/read`),
  // Trạng thái ở ghép & đã thuê
  updateRoommateStatus: (postId, data) => api.put(`/rental/forum/${postId}/roommate-status`, data),
  updateRentalStatus: (postId, data) => api.put(`/rental/forum/${postId}/rental-status`, data),
};

export const reviewApi = {
  getReviewsByPost: (postId) => api.get(`/rental/forum/reviews/post/${postId}`),
  checkEligibility: (postId) => api.get(`/rental/forum/reviews/post/${postId}/eligibility`),
  createReview: (data) => api.post("/rental/forum/reviews", data),
  updateReview: (id, data) => api.put(`/rental/forum/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/rental/forum/reviews/${id}`),
  replyToReview: (id, data) => api.put(`/rental/forum/reviews/${id}/reply`, data),
};

export const maintenanceApi = {
  // Tenant
  createTicket: (data) => api.post("/maintenance-tickets", data),
  getMyTickets: () => api.get("/maintenance-tickets/my-tickets"),
  getTicketDetail: (id) => api.get(`/maintenance-tickets/${id}`),
  confirmResolved: (id) => api.put(`/maintenance-tickets/${id}/confirm`),
  cancelTicket: (id) => api.put(`/maintenance-tickets/${id}/cancel`),
  // Landlord
  getLandlordTickets: (params) => api.get("/maintenance-tickets/landlord", { params }),
  getLandlordStats: () => api.get("/maintenance-tickets/landlord/stats"),
  updateTicketStatus: (id, data) => api.put(`/maintenance-tickets/${id}/status`, data),
};
