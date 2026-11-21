import apiClient from './client';

// apiClient (Hùng) trả về axios response -> ở đây bóc lấy body { success, message, data }
// và đẩy lỗi về dạng { message, status } để màn hình hiển thị.
const unwrap = (promise) =>
  promise.then((r) => r.data).catch((e) => {
    throw e.response?.data || { message: e.message, status: e.response?.status };
  });

// Bảng tin ở ghép (roommate posts)
export const rentalApi = {
  getRoommatePosts: (params) => unwrap(apiClient.get('/rental/posts', { params })),
  createRoommatePost: (data) => unwrap(apiClient.post('/rental/posts', data)),
  sendJoinRequest: (postId, data) => unwrap(apiClient.post(`/rental/posts/${postId}/join`, data)),
};

// Hợp đồng của tôi (để chọn phòng khi đăng tin tìm bạn)
export const contractApi = {
  getMyContracts: () => unwrap(apiClient.get('/contracts/my')),
};

// Bài đăng diễn đàn + chat
export const forumApi = {
  getAllPosts: (params) => unwrap(apiClient.get('/rental/forum', { params })),
  sendMessage: (postId, data) => unwrap(apiClient.post(`/rental/forum/${postId}/messages`, data)),
  replyMessage: (postId, receiverId, data) =>
    unwrap(apiClient.post(`/rental/forum/${postId}/reply`, data, { params: { receiverId } })),
  getConversation: (postId, otherUserId) =>
    unwrap(apiClient.get(`/rental/forum/${postId}/conversation`, { params: { otherUserId } })),
  getMyAllMessages: () => unwrap(apiClient.get('/rental/forum/messages/my-all')),
  markMessageRead: (msgId) => unwrap(apiClient.put(`/rental/forum/messages/${msgId}/read`)),
};
