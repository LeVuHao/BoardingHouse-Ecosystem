import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Gắn Token tự động vào Header cho mọi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Xử lý Response hoặc 401 Logout
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    if (error.response) {
      const payload = error.response.data;
      if (payload && typeof payload === "object") {
        return Promise.reject({
          ...payload,
          status: error.response.status,
          response: error.response,
        });
      }
      return Promise.reject({
        message: payload || error.message,
        status: error.response.status,
        response: error.response,
      });
    }
    return Promise.reject(error);
  },
);

export default api;
