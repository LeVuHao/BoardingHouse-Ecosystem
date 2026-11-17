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
  MY_BILLS: `${BASE_URL}/bills/my-bills`,
  BILL_QR: (billId) => `${BASE_URL}/payments/vietqr/bill/${billId}`,

  // Phân hệ Forum & Chat (Hoàng phụ trách)
  FORUM_POSTS: `${BASE_URL}/rental/forum`,
  FORUM_MESSAGES: (postId) => `${BASE_URL}/rental/forum/${postId}/messages`,

  // Phân hệ Auth, Profile, Notifications & Maintenance (Hùng phụ trách)
  LOGIN: `${BASE_URL}/auth/login`,
  REGISTER: `${BASE_URL}/auth/register`,
  PROFILE: `${BASE_URL}/auth/profile`,
  CHANGE_PASSWORD: `${BASE_URL}/auth/change-password`,
  
  NOTIFICATIONS: `${BASE_URL}/notifications`,
  NOTIFICATIONS_UNREAD: `${BASE_URL}/notifications/unread-count`,
  NOTIFICATION_READ: (id) => `${BASE_URL}/notifications/${id}/read`,

  MAINTENANCE_TICKETS: `${BASE_URL}/maintenance-tickets`,
  MY_MAINTENANCE_TICKETS: `${BASE_URL}/maintenance-tickets/my-tickets`,
  MAINTENANCE_DETAIL: (id) => `${BASE_URL}/maintenance-tickets/${id}`,
  MAINTENANCE_CONFIRM: (id) => `${BASE_URL}/maintenance-tickets/${id}/confirm`,
};
