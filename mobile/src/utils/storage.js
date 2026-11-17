import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@roomily_token';
const USER_KEY = '@roomily_user';

export const storage = {
  async saveToken(token) {
    try {
      if (token) {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      } else {
        await AsyncStorage.removeItem(TOKEN_KEY);
      }
    } catch (e) {
      console.warn('Lỗi khi lưu token:', e);
    }
  },

  async getToken() {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (e) {
      console.warn('Lỗi khi đọc token:', e);
      return null;
    }
  },

  async saveUser(user) {
    try {
      if (user) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(USER_KEY);
      }
    } catch (e) {
      console.warn('Lỗi khi lưu thông tin user:', e);
    }
  },

  async getUser() {
    try {
      const data = await AsyncStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Lỗi khi đọc thông tin user:', e);
      return null;
    }
  },

  async clearAuth() {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    } catch (e) {
      console.warn('Lỗi khi xóa phiên đăng nhập:', e);
    }
  },
};
