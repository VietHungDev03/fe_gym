import { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '../services/api.config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng trong AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Kiểm tra token khi app load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setLoading(false);
        return;
      }

      // Lấy profile từ backend
      const response = await apiClient.get('/auth/profile');

      setCurrentUser({
        id: response.data.id,
        email: response.data.email,
      });
      setUserProfile(response.data);

    } catch (error) {
      console.error('Lỗi kiểm tra auth:', error);
      // Token không hợp lệ, xóa
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setCurrentUser(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Đăng nhập
  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      const { user, accessToken, refreshToken } = response.data;

      // Lưu tokens vào localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      setCurrentUser({
        id: user.id,
        email: user.email,
      });
      setUserProfile(user);

      return { success: true };
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      throw error;
    }
  };

  // Đăng ký
  const register = async (email, password, profileData) => {
    try {
      const response = await apiClient.post('/auth/register', {
        email,
        password,
        fullName: profileData.fullName,
        role: profileData.role || 'user',
      });

      const { user, accessToken, refreshToken } = response.data;

      // Lưu tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      setCurrentUser({
        id: user.id,
        email: user.email,
      });
      setUserProfile(user);

      return { success: true };
    } catch (error) {
      console.error('Lỗi đăng ký:', error);
      throw error;
    }
  };

  // Đăng xuất
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setCurrentUser(null);
    setUserProfile(null);
  };

  // Lấy thông tin profile
  const getUserProfile = async (userId) => {
    try {
      // Nếu là current user, dùng /auth/profile
      if (currentUser && userId === currentUser.id) {
        const response = await apiClient.get('/auth/profile');
        return response.data;
      }

      // Nếu không, dùng /users/:id
      const response = await apiClient.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy user profile:', error);
      return null;
    }
  };

  // Refresh user profile
  const refreshUserProfile = async () => {
    try {
      if (currentUser) {
        const response = await apiClient.get('/auth/profile');
        setUserProfile(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Lỗi refresh profile:', error);
      return null;
    }
  };

  const value = {
    currentUser,
    userProfile,
    login,
    register,
    logout,
    getUserProfile,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
