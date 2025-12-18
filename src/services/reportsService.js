import apiClient from './api.config';

export const reportsService = {
  /**
   * Lấy báo cáo sử dụng thiết bị
   * @param {Date} startDate - Ngày bắt đầu
   * @param {Date} endDate - Ngày kết thúc
   */
  getUsageReport: async (startDate, endDate) => {
    try {
      const response = await apiClient.get('/reports/usage', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy báo cáo sử dụng:', error);
      throw error;
    }
  },

  /**
   * Lấy báo cáo bảo trì
   * @param {Date} startDate - Ngày bắt đầu
   * @param {Date} endDate - Ngày kết thúc
   */
  getMaintenanceReport: async (startDate, endDate) => {
    try {
      const response = await apiClient.get('/reports/maintenance', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy báo cáo bảo trì:', error);
      throw error;
    }
  },

  /**
   * Lấy báo cáo thiết bị
   */
  getEquipmentReport: async () => {
    try {
      const response = await apiClient.get('/reports/equipment');
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy báo cáo thiết bị:', error);
      throw error;
    }
  },

  /**
   * Lấy thống kê tổng quan
   * @param {string} filter - 'week' | 'month' | 'quarter' | 'year' | 'custom'
   * @param {Date} startDate - Ngày bắt đầu (dùng với filter='custom')
   * @param {Date} endDate - Ngày kết thúc (dùng với filter='custom')
   */
  getStatistics: async (filter = 'month', startDate = null, endDate = null) => {
    try {
      const params = { filter };

      if (filter === 'custom' && startDate && endDate) {
        params.startDate = startDate.toISOString();
        params.endDate = endDate.toISOString();
      }

      const response = await apiClient.get('/reports/statistics', { params });
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thống kê:', error);
      throw error;
    }
  },

  /**
   * Lấy báo cáo sự cố
   * @param {string} filter - 'week' | 'month' | 'quarter' | 'year' | 'custom'
   * @param {Date} startDate - Ngày bắt đầu (dùng với filter='custom')
   * @param {Date} endDate - Ngày kết thúc (dùng với filter='custom')
   */
  getIncidentReport: async (filter = 'month', startDate = null, endDate = null) => {
    try {
      const params = { filter };

      if (filter === 'custom' && startDate && endDate) {
        params.startDate = startDate.toISOString();
        params.endDate = endDate.toISOString();
      }

      const response = await apiClient.get('/reports/incidents', { params });
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy báo cáo sự cố:', error);
      throw error;
    }
  }
};
