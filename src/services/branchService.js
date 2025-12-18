import apiClient from './api.config';

export const branchService = {
  // Lấy tất cả chi nhánh
  getAllBranches: async (status = null) => {
    try {
      const params = status ? { status } : {};
      const response = await apiClient.get('/branches', { params });
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy danh sách chi nhánh:', error);
      return [];
    }
  },

  // Lấy chi nhánh theo ID
  getBranchById: async (id) => {
    try {
      const response = await apiClient.get(`/branches/${id}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thông tin chi nhánh:', error);
      throw error;
    }
  },

  // Lấy chi nhánh theo ID (không throw error)
  getBranchByIdSilent: async (id) => {
    try {
      const response = await apiClient.get(`/branches/${id}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thông tin chi nhánh:', error);
      return null;
    }
  },

  // Thêm chi nhánh mới
  addBranch: async (branchData) => {
    try {
      const response = await apiClient.post('/branches', branchData);
      return response.data;
    } catch (error) {
      console.error('Lỗi thêm chi nhánh:', error);
      throw error;
    }
  },

  // Cập nhật thông tin chi nhánh
  updateBranch: async (id, updateData) => {
    try {
      const response = await apiClient.patch(`/branches/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Lỗi cập nhật chi nhánh:', error);
      throw error;
    }
  },

  // Xóa chi nhánh
  deleteBranch: async (id) => {
    try {
      const response = await apiClient.delete(`/branches/${id}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi xóa chi nhánh:', error);
      throw error;
    }
  },

  // Lấy thống kê chi nhánh
  getBranchStatistics: async (id) => {
    try {
      const response = await apiClient.get(`/branches/${id}/statistics`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thống kê chi nhánh:', error);
      return {
        totalEquipment: 0,
        activeEquipment: 0,
        maintenanceEquipment: 0,
        totalMaintenance: 0,
        pendingMaintenance: 0,
      };
    }
  },

  // Lấy chi nhánh active
  getActiveBranches: async () => {
    try {
      return await branchService.getAllBranches('active');
    } catch (error) {
      console.error('Lỗi lấy chi nhánh active:', error);
      return [];
    }
  },
};
