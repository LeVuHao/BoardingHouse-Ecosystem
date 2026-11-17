import axios from 'axios';
import { BASE_URL } from '../constants/config';
import { storage } from '../utils/storage';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 6000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: gắn token JWT vào Header cho mọi request
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Lỗi đính kèm token vào request:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: xử lý phản hồi & lỗi tập trung
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Nếu token hết hạn (401), có thể xử lý logout tự động nếu cần
    if (error.response && error.response.status === 401) {
      console.log('[API] Phiên đăng nhập hết hạn hoặc không hợp lệ');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
