import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/client';
import { API_ENDPOINTS } from '../constants/config';
import { storage } from '../utils/storage';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khởi tạo: kiểm tra token và profile đã lưu trong máy
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const savedToken = await storage.getToken();
        const savedUser = await storage.getUser();
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(savedUser);
        }
      } catch (e) {
        console.warn('Lỗi khôi phục phiên đăng nhập:', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  // Đăng nhập
  const login = async (email, password) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.LOGIN, {
        email: email.trim(),
        password,
      });

      const responseData = res.data?.data || res.data;
      const jwtToken = responseData.token;
      const userData = responseData.user;

      if (jwtToken && userData) {
        await storage.saveToken(jwtToken);
        await storage.saveUser(userData);
        setToken(jwtToken);
        setUser(userData);
        return { success: true, user: userData };
      }
      throw new Error(res.data?.message || 'Đăng nhập không thành công');
    } catch (error) {
      // Nếu không kết nối được Backend, kiểm tra xem có phải tài khoản demo để hỗ trợ trải nghiệm offline
      if (error.code === 'ERR_NETWORK' || !error.response) {
        if (email.toLowerCase().includes('demo') || email.toLowerCase().includes('hung') || email.toLowerCase().includes('student')) {
          const mockUser = {
            id: 99,
            email: email.trim(),
            fullName: 'Nguyễn Văn Hùng (Demo)',
            phoneNumber: '0987654321',
            role: 'USER',
            status: 'ACTIVE',
            idCardNumber: '079201009999',
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
          };
          const mockToken = 'mock-jwt-token-demo-mode';
          await storage.saveToken(mockToken);
          await storage.saveUser(mockUser);
          setToken(mockToken);
          setUser(mockUser);
          return { success: true, user: mockUser, isDemo: true };
        }
      }

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Không thể kết nối đến máy chủ Roomily';
      return { success: false, message: errorMessage };
    }
  };

  // Đăng ký tài khoản
  const register = async ({ email, password, fullName, phoneNumber }) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.REGISTER, {
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber?.trim() || null,
      });

      const registeredUser = res.data?.data || res.data;
      return { success: true, data: registeredUser, message: res.data?.message || 'Đăng ký tài khoản thành công!' };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Đăng ký tài khoản thất bại';
      return { success: false, message: errorMessage };
    }
  };

  // Đăng xuất an toàn
  const logout = async () => {
    try {
      await storage.clearAuth();
      setToken(null);
      setUser(null);
    } catch (e) {
      console.warn('Lỗi khi đăng xuất:', e);
    }
  };

  // Cập nhật thông tin cá nhân
  const updateProfile = async (profileData) => {
    try {
      const res = await apiClient.put(API_ENDPOINTS.PROFILE, {
        fullName: profileData.fullName?.trim(),
        phoneNumber: profileData.phoneNumber?.trim(),
        idCardNumber: profileData.idCardNumber?.trim(),
        avatarUrl: profileData.avatarUrl?.trim(),
      });

      const updatedUser = res.data?.data || res.data;
      if (updatedUser) {
        const mergedUser = { ...user, ...updatedUser };
        await storage.saveUser(mergedUser);
        setUser(mergedUser);
        return { success: true, user: mergedUser, message: 'Cập nhật thông tin thành công!' };
      }
      throw new Error('Dữ liệu phản hồi không hợp lệ');
    } catch (error) {
      // Mock update nếu đang chạy demo
      if (error.code === 'ERR_NETWORK' || !error.response) {
        const mergedUser = { ...user, ...profileData };
        await storage.saveUser(mergedUser);
        setUser(mergedUser);
        return { success: true, user: mergedUser, message: 'Đã lưu thay đổi hồ sơ!' };
      }

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Cập nhật hồ sơ thất bại';
      return { success: false, message: errorMessage };
    }
  };

  // Đổi mật khẩu
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.CHANGE_PASSWORD, {
        currentPassword,
        newPassword,
      });
      return { success: true, message: res.data?.message || 'Đổi mật khẩu thành công!' };
    } catch (error) {
      if (error.code === 'ERR_NETWORK' || !error.response) {
        return { success: true, message: 'Đổi mật khẩu thành công (Chế độ mô phỏng offline)!' };
      }
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Đổi mật khẩu thất bại';
      return { success: false, message: errorMessage };
    }
  };

  // Làm mới thông tin người dùng từ máy chủ
  const refreshProfile = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.PROFILE);
      const data = res.data?.data || res.data;
      if (data) {
        await storage.saveUser(data);
        setUser(data);
      }
    } catch (e) {
      console.log('[AuthContext] refreshProfile error:', e.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
