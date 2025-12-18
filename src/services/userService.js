import apiClient from './api.config';

export const userService = {
  // Lấy tất cả người dùng
  getAllUsers: async () => {
    try {
      const response = await apiClient.get('/users');
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy danh sách người dùng:', error);
      return [];
    }
  },

  // Lấy người dùng theo ID
  getUserById: async (id) => {
    try {
      const response = await apiClient.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thông tin người dùng:', error);
      throw error;
    }
  },

  // Lấy người dùng theo ID (không throw error nếu không tìm thấy)
  getUserByIdSilent: async (id) => {
    try {
      const response = await apiClient.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thông tin người dùng:', error);
      return null;
    }
  },

  // Lấy người dùng theo email
  getUserByEmail: async (email) => {
    try {
      // Backend không có endpoint riêng cho email, dùng getAllUsers và filter
      const users = await this.getAllUsers();
      return users.find(user => user.email === email) || null;
    } catch (error) {
      console.error('Lỗi tìm người dùng theo email:', error);
      return null;
    }
  },

  // Thêm người dùng mới
  addUser: async (userData) => {
    try {
      const response = await apiClient.post('/users', userData);
      return response.data.id;
    } catch (error) {
      console.error('Lỗi thêm người dùng:', error);
      throw error;
    }
  },

  // Cập nhật thông tin người dùng
  updateUser: async (id, updateData) => {
    try {
      const response = await apiClient.patch(`/users/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Lỗi cập nhật người dùng:', error);
      throw error;
    }
  },

  // Xóa người dùng
  deleteUser: async (id) => {
    try {
      const response = await apiClient.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi xóa người dùng:', error);
      throw error;
    }
  },

  // Lấy người dùng theo vai trò
  getUsersByRole: async (role) => {
    try {
      const response = await apiClient.get(`/users/role/${role}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy người dùng theo vai trò:', error);
      return [];
    }
  },

  // Lấy người dùng theo trạng thái (không có endpoint backend, dùng filter)
  getUsersByStatus: async (status) => {
    try {
      const users = await this.getAllUsers();
      return users.filter(user => user.status === status);
    } catch (error) {
      console.error('Lỗi lấy người dùng theo trạng thái:', error);
      return [];
    }
  },

  // Thống kê người dùng
  getUserStats: async () => {
    try {
      const response = await apiClient.get('/users/stats');
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thống kê người dùng:', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        roles: { admin: 0, manager: 0, technician: 0, receptionist: 0, user: 0 }
      };
    }
  },

  // Phân công chi nhánh cho người dùng
  assignBranch: async (userId, branchId) => {
    try {
      const response = await apiClient.patch(`/users/${userId}/assign-branch`, { branchId });
      return response.data;
    } catch (error) {
      console.error('Lỗi phân công chi nhánh:', error);
      throw error;
    }
  },

  // Lấy danh sách người dùng theo chi nhánh
  getUsersByBranch: async (branchId) => {
    try {
      const response = await apiClient.get(`/users/branch/${branchId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy người dùng theo chi nhánh:', error);
      return [];
    }
  },

  // Đặt lại mật khẩu mặc định
  resetPassword: async (id) => {
    try {
      const response = await apiClient.patch(`/users/${id}/reset-password`);
      return response.data;
    } catch (error) {
      console.error('Lỗi đặt lại mật khẩu:', error);
      throw error;
    }
  }
};
