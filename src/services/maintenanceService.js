import apiClient from './api.config';

export const maintenanceService = {
  // Lấy thống kê bảo trì
  getStatistics: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.equipmentId) queryParams.append('equipmentId', params.equipmentId);
      if (params.assignedTo) queryParams.append('assignedTo', params.assignedTo);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const response = await apiClient.get(`/tracking/maintenance/statistics?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thống kê bảo trì:', error);
      throw error;
    }
  },

  // Lấy danh sách bảo trì với filter
  getMaintenanceList: async (params = {}) => {
    try {
      const {
        page = 1,
        limit = 10,
        equipmentId,
        assignedTo,
        status,
        startDate,
        endDate,
        sortBy = 'scheduledDate',
        sortOrder = 'DESC',
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });

      if (equipmentId) queryParams.append('equipmentId', equipmentId);
      if (assignedTo) queryParams.append('assignedTo', assignedTo);
      if (status) queryParams.append('status', status);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const response = await apiClient.get(`/tracking/maintenance/list/filtered?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy danh sách bảo trì:', error);
      throw error;
    }
  },
};
