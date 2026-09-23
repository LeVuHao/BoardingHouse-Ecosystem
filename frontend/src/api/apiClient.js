import api from "./axiosInstance";

export const authApi = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  registerLandlord: (data) => api.post("/auth/landlord/register", data),
  loginWithGoogle: (data) => api.post("/auth/google", data),
  forgotPassword: (data) => api.post("/auth/forgot-password", data),
  resetPassword: (data) => api.post("/auth/reset-password", data),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => api.put("/auth/profile", data),
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
};
