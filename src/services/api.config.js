import axios from 'axios';

// Base URL cho API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Tạo axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - Tự động thêm JWT token vào header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Xử lý errors và auto refresh token
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Nếu 401 và chưa retry, thử refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // TODO: Implement refresh token endpoint
          // const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          // localStorage.setItem('accessToken', response.data.accessToken);
          // originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
          // return apiClient(originalRequest);
        }

        // Nếu không có refresh token hoặc refresh failed, logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export { apiClient, API_BASE_URL };
export default apiClient;
