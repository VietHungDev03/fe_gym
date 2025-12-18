import apiClient from './api.config';

export const equipmentTransferService = {
  // Tạo yêu cầu điều chuyển mới
  createTransfer: async (transferData) => {
    try {
      const response = await apiClient.post('/equipment-transfers', transferData);
      return response.data;
    } catch (error) {
      console.error('Lỗi tạo yêu cầu điều chuyển:', error);
      throw error;
    }
  },

  // Lấy danh sách điều chuyển với filter và phân trang
  getTransfers: async (params = {}) => {
    try {
      const {
        page = 1,
        limit = 10,
        equipmentId,
        fromBranchId,
        toBranchId,
        status,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });

      if (equipmentId) queryParams.append('equipmentId', equipmentId);
      if (fromBranchId) queryParams.append('fromBranchId', fromBranchId);
      if (toBranchId) queryParams.append('toBranchId', toBranchId);
      if (status) queryParams.append('status', status);

      const response = await apiClient.get(`/equipment-transfers?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy danh sách điều chuyển:', error);
      throw error;
    }
  },

  // Lấy chi tiết một điều chuyển
  getTransferById: async (id) => {
    try {
      const response = await apiClient.get(`/equipment-transfers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy chi tiết điều chuyển:', error);
      throw error;
    }
  },

  // Lấy lịch sử điều chuyển của một thiết bị
  getEquipmentTransferHistory: async (equipmentId) => {
    try {
      const response = await apiClient.get(`/equipment-transfers/equipment/${equipmentId}/history`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy lịch sử điều chuyển:', error);
      throw error;
    }
  },

  // Cập nhật trạng thái điều chuyển
  updateTransferStatus: async (id, status, notes) => {
    try {
      const response = await apiClient.patch(`/equipment-transfers/${id}/status`, {
        status,
        notes,
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái điều chuyển:', error);
      throw error;
    }
  },

  // Xóa yêu cầu điều chuyển
  deleteTransfer: async (id) => {
    try {
      const response = await apiClient.delete(`/equipment-transfers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi xóa yêu cầu điều chuyển:', error);
      throw error;
    }
  },

  // Lấy thống kê điều chuyển
  getTransferStats: async (branchId) => {
    try {
      const queryParams = branchId ? `?branchId=${branchId}` : '';
      const response = await apiClient.get(`/equipment-transfers/stats${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thống kê điều chuyển:', error);
      throw error;
    }
  },
};
