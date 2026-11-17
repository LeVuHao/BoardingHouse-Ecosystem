/**
 * CẤU HÌNH KẾT NỐI MẠNG CHO ROOMILY MOBILE
 * Đổi DEV_LAN_IP thành IP máy tính chạy backend khi test bằng điện thoại thật qua Expo Go.
 */
export const DEV_LAN_IP = '192.168.100.62'; // Lấy từ lệnh ipconfig

export const API_PORT = 8080; // API Gateway

export const BASE_URL = `http://${DEV_LAN_IP}:${API_PORT}/api/v1`;

export const API_ENDPOINTS = {
  // Phân hệ Rooms & Rental (Huy phụ trách)
  ROOMS: `${BASE_URL}/rooms`,
  ROOM_DETAIL: (id) => `${BASE_URL}/rooms/${id}`,
  RENTAL_REQUEST: `${BASE_URL}/rental/requests`,
  MY_RENTAL_REQUESTS: `${BASE_URL}/rental/requests/my-requests`,
  MY_CONTRACTS: `${BASE_URL}/contracts/my`,

  // Phân hệ Billing (Hảo phụ trách)
  MY_BILLS: `${BASE_URL}/billing/my-bills`,
  BILL_QR: (billId) => `${BASE_URL}/billing/payments/vietqr/bill/${billId}`,

  // Phân hệ Forum & Chat (Hoàng phụ trách)
  FORUM_POSTS: `${BASE_URL}/rental/forum`,
  FORUM_MESSAGES: (postId) => `${BASE_URL}/rental/forum/${postId}/messages`,

  // Phân hệ Auth & Profile (Hùng phụ trách)
  LOGIN: `${BASE_URL}/auth/login`,
  REGISTER: `${BASE_URL}/auth/register`,
  NOTIFICATIONS: `${BASE_URL}/notifications`,
};
