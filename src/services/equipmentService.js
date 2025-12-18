import apiClient from './api.config';

export const equipmentService = {
  // Lấy tất cả thiết bị (legacy - giữ để tương thích)
  getAllEquipment: async () => {
    try {
      // Gọi API với limit cao để lấy tất cả thiết bị (không phân trang)
      const response = await apiClient.get('/equipment?limit=1000');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Lỗi lấy danh sách thiết bị:', error);
      return [];
    }
  },

  // Lấy danh sách thiết bị với filter và phân trang
  getEquipmentWithFilter: async (params = {}) => {
    try {
      const {
        page = 1,
        limit = 10,
        branchId,
        location,
        type,
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

      if (branchId) queryParams.append('branchId', branchId);
      if (location) queryParams.append('location', location);
      if (type) queryParams.append('type', type);
      if (status) queryParams.append('status', status);

      const response = await apiClient.get(`/equipment?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy danh sách thiết bị:', error);
      throw error;
    }
  },

  // Lấy options cho filter
  getFilterOptions: async () => {
    try {
      const response = await apiClient.get('/equipment/filters/options');
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy filter options:', error);
      return { locations: [], types: [], statuses: [] };
    }
  },

  // Lấy thiết bị theo ID
  getEquipmentById: async (id) => {
    try {
      const response = await apiClient.get(`/equipment/${id}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thông tin thiết bị:', error);
      throw error;
    }
  },

  // Tìm thiết bị theo mã QR/RFID
  getEquipmentByCode: async (code) => {
    try {
      const response = await apiClient.get(`/equipment/qr/${code}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi tìm thiết bị theo mã:', error);
      throw error;
    }
  },

  // Thêm thiết bị mới
  createEquipment: async (equipmentData) => {
    try {
      const response = await apiClient.post('/equipment', equipmentData);
      return response.data.id;
    } catch (error) {
      console.error('Lỗi thêm thiết bị:', error);
      throw error;
    }
  },

  // Cập nhật thiết bị
  updateEquipment: async (id, updateData) => {
    try {
      const response = await apiClient.patch(`/equipment/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Lỗi cập nhật thiết bị:', error);
      throw error;
    }
  },

  // Xóa thiết bị
  deleteEquipment: async (id) => {
    try {
      const response = await apiClient.delete(`/equipment/${id}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi xóa thiết bị:', error);
      throw error;
    }
  },

  // Lấy thiết bị theo trạng thái
  getEquipmentByStatus: async (status) => {
    try {
      const response = await apiClient.get(`/equipment/status/${status}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thiết bị theo trạng thái:', error);
      return [];
    }
  },

  // Tạo mã QR tự động (giữ nguyên logic từ Firebase)
  generateQRCode: (equipmentId) => {
    return `EQ_${Date.now()}_${equipmentId.substring(0, 6).toUpperCase()}`;
  },

  // Thanh lý thiết bị
  disposeEquipment: async (id, disposeData) => {
    try {
      const response = await apiClient.post(`/equipment/${id}/dispose`, disposeData);
      return response.data;
    } catch (error) {
      console.error('Lỗi thanh lý thiết bị:', error);
      throw error;
    }
  },

  // Thanh lý nhiều thiết bị cùng lúc
  bulkDisposeEquipment: async (disposeData) => {
    try {
      const response = await apiClient.post('/equipment/bulk-dispose', disposeData);
      return response.data;
    } catch (error) {
      console.error('Lỗi thanh lý nhiều thiết bị:', error);
      throw error;
    }
  },

  // Cập nhật trạng thái thanh lý của thiết bị
  updateLiquidationStatus: async (id, data) => {
    try {
      // Hỗ trợ cả truyền object (mới) và string (cũ để tương thích)
      const payload = typeof data === 'string' ? { status: data } : data;
      const response = await apiClient.patch(`/equipment/${id}/liquidation-status`, payload);
      return response.data;
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái thanh lý:', error);
      throw error;
    }
  },

  // Lấy lịch sử thiết bị đã thanh lý
  getDisposedHistory: async (params = {}) => {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'disposalDate',
        sortOrder = 'DESC',
        includeAll = false,
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        includeAll: includeAll.toString(),
      });

      const response = await apiClient.get(`/equipment/disposed-history/list?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy lịch sử thanh lý:', error);
      throw error;
    }
  },

  // Lấy thiết bị của chi nhánh hiện tại (dành cho technician/receptionist)
  getMyBranchEquipment: async () => {
    try {
      const response = await apiClient.get('/equipment/my-branch');
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thiết bị chi nhánh:', error);
      return [];
    }
  }
};
