import apiClient from './api.config';

export const authService = {
  // Đổi mật khẩu
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await apiClient.patch('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi đổi mật khẩu:', error);
      throw error;
    }
  },

  // Quên mật khẩu
  forgotPassword: async (email) => {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Lỗi gửi email reset password:', error);
      throw error;
    }
  },

  // Reset mật khẩu
  resetPassword: async (token, newPassword) => {
    try {
      const response = await apiClient.post('/auth/reset-password', {
        token,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi reset mật khẩu:', error);
      throw error;
    }
  },

  // Update profile
  updateProfile: async (userId, updateData) => {
    try {
      const response = await apiClient.patch(`/users/${userId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Lỗi cập nhật profile:', error);
      throw error;
    }
  }
};
