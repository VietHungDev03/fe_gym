import apiClient from './api.config';

export const trackingService = {
  // ===== USAGE TRACKING =====

  // Ghi nhận sử dụng thiết bị
  logUsage: async (equipmentId, userId = null, notes = '') => {
    try {
      const response = await apiClient.post('/tracking/usage/start', {
        equipmentId,
        userId,
        notes,
      });
      return response.data.id;
    } catch (error) {
      console.error('Lỗi ghi nhận sử dụng:', error);
      throw error;
    }
  },

  // Kết thúc sử dụng thiết bị
  endUsage: async (usageId, notes = '') => {
    try {
      const response = await apiClient.patch(`/tracking/usage/${usageId}/end`, {
        notes,
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi kết thúc sử dụng:', error);
      throw error;
    }
  },

  // Lấy lịch sử sử dụng thiết bị
  getEquipmentUsageHistory: async (equipmentId, limitCount = 50) => {
    try {
      const response = await apiClient.get(`/tracking/usage/equipment/${equipmentId}`, {
        params: { limit: limitCount },
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy lịch sử sử dụng:', error);
      return [];
    }
  },

  // Lấy thống kê sử dụng
  getUsageStats: async (equipmentId, startDate, endDate) => {
    try {
      const response = await apiClient.get('/tracking/usage/stats', {
        params: {
          equipmentId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thống kê sử dụng:', error);
      return {
        totalUsage: 0,
        completedUsage: 0,
        totalDuration: 0,
        averageDuration: 0,
        usageLogs: []
      };
    }
  },

  // ===== MAINTENANCE TRACKING =====

  // Tạo lịch bảo trì
  scheduleMaintenance: async (equipmentId, scheduledDate, type, description, priority = 'medium') => {
    try {
      const response = await apiClient.post('/tracking/maintenance', {
        equipmentId,
        scheduledDate: new Date(scheduledDate).toISOString(),
        type,
        description,
        priority,
      });
      return response.data.id;
    } catch (error) {
      console.error('Lỗi tạo lịch bảo trì:', error);
      throw error;
    }
  },

  // Cập nhật trạng thái bảo trì
  updateMaintenanceStatus: async (maintenanceId, status, updateData = {}) => {
    try {
      const response = await apiClient.patch(`/tracking/maintenance/${maintenanceId}`, {
        status,
        ...updateData,
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái bảo trì:', error);
      throw error;
    }
  },

  // Lấy danh sách bảo trì
  getMaintenanceRecords: async (status = null, equipmentId = null) => {
    try {
      const params = {};
      if (status) params.status = status;
      if (equipmentId) params.equipmentId = equipmentId;

      const response = await apiClient.get('/tracking/maintenance', { params });
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy danh sách bảo trì:', error);
      return [];
    }
  },

  // Lấy cảnh báo bảo trì sắp đến hạn
  getUpcomingMaintenance: async (daysAhead = 7) => {
    try {
      const response = await apiClient.get('/tracking/maintenance/upcoming', {
        params: { days: daysAhead },
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy cảnh báo bảo trì:', error);
      return [];
    }
  },

  // Submit phản hồi bảo trì từ kỹ thuật viên
  submitMaintenanceFeedback: async (maintenanceId, feedbackData) => {
    try {
      const response = await apiClient.post(`/tracking/maintenance/${maintenanceId}/feedback`, feedbackData);
      return response.data;
    } catch (error) {
      console.error('Lỗi submit phản hồi bảo trì:', error);
      throw error;
    }
  },

  // ===== INCIDENT TRACKING =====

  // Báo cáo sự cố
  reportIncident: async (equipmentId, description, severity = 'medium', reportedBy = null) => {
    try {
      const response = await apiClient.post('/tracking/incidents', {
        equipmentId,
        description,
        severity,
        reportedBy,
      });
      return response.data.id;
    } catch (error) {
      console.error('Lỗi báo cáo sự cố:', error);
      throw error;
    }
  },

  // Lấy danh sách báo cáo sự cố
  getIncidentReports: async (status = null, equipmentId = null) => {
    try {
      const params = {};
      if (status) params.status = status;
      if (equipmentId) params.equipmentId = equipmentId;

      const response = await apiClient.get('/tracking/incidents', { params });
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy danh sách sự cố:', error);
      return [];
    }
  },

  // Cập nhật trạng thái incident
  updateIncident: async (incidentId, status, resolution = '') => {
    try {
      const response = await apiClient.patch(`/tracking/incidents/${incidentId}`, {
        status,
        resolution,
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi cập nhật sự cố:', error);
      throw error;
    }
  },

  // Cập nhật trạng thái sự cố (endpoint mới)
  updateIncidentStatus: async (incidentId, status, resolution = '') => {
    try {
      const response = await apiClient.patch(`/tracking/incidents/${incidentId}/status`, {
        status,
        resolution
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái sự cố:', error);
      throw error;
    }
  },

  // Giao sự cố cho technician
  assignIncident: async (incidentId, assignedTo, notes = '') => {
    try {
      const response = await apiClient.patch(`/tracking/incidents/${incidentId}/assign`, {
        assignedTo,
        notes
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi giao sự cố:', error);
      throw error;
    }
  },

  // ===== MAINTENANCE SCHEDULES (LỊCH BẢO TRÌ ĐỊNH KỲ) =====

  // Tạo lịch bảo trì định kỳ
  createMaintenanceSchedule: async (scheduleData) => {
    try {
      const response = await apiClient.post('/maintenance-schedules', scheduleData);
      return response.data;
    } catch (error) {
      console.error('Lỗi tạo lịch bảo trì định kỳ:', error);
      throw error;
    }
  },

  // Lấy danh sách lịch bảo trì định kỳ
  getMaintenanceSchedules: async (isActive = null, branchId = null) => {
    try {
      const params = {};
      if (isActive !== null) params.isActive = isActive;
      if (branchId) params.branchId = branchId;

      const response = await apiClient.get('/maintenance-schedules', { params });
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy danh sách lịch bảo trì:', error);
      return [];
    }
  },

  // Lấy chi tiết lịch bảo trì định kỳ
  getMaintenanceScheduleDetail: async (scheduleId) => {
    try {
      const response = await apiClient.get(`/maintenance-schedules/${scheduleId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy chi tiết lịch:', error);
      throw error;
    }
  },

  // Cập nhật lịch bảo trì định kỳ
  updateMaintenanceSchedule: async (scheduleId, updateData) => {
    try {
      const response = await apiClient.patch(`/maintenance-schedules/${scheduleId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Lỗi cập nhật lịch bảo trì:', error);
      throw error;
    }
  },

  // Xóa lịch bảo trì định kỳ
  deleteMaintenanceSchedule: async (scheduleId) => {
    try {
      const response = await apiClient.delete(`/maintenance-schedules/${scheduleId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi xóa lịch bảo trì:', error);
      throw error;
    }
  },

  // Xem thiết bị áp dụng cho lịch bảo trì
  getScheduleEquipment: async (scheduleId) => {
    try {
      const response = await apiClient.get(`/maintenance-schedules/${scheduleId}/equipment`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thiết bị áp dụng:', error);
      return [];
    }
  },

  // Tạo maintenance records thủ công từ lịch
  generateMaintenanceRecords: async (scheduleId) => {
    try {
      const response = await apiClient.post(`/maintenance-schedules/${scheduleId}/generate`);
      return response.data;
    } catch (error) {
      console.error('Lỗi tạo maintenance records:', error);
      throw error;
    }
  },

  // Xử lý tất cả lịch bảo trì đến hạn (admin only)
  processAllSchedules: async () => {
    try {
      const response = await apiClient.post('/maintenance-schedules/process/all');
      return response.data;
    } catch (error) {
      console.error('Lỗi xử lý lịch bảo trì:', error);
      throw error;
    }
  },

  // ===== AUTO-SCHEDULE MAINTENANCE =====

  // Kích hoạt tự động tạo lịch bảo trì cho tất cả thiết bị cần bảo trì
  triggerAutoSchedule: async () => {
    try {
      const response = await apiClient.post('/tracking/maintenance/auto-schedule/trigger');
      return response.data;
    } catch (error) {
      console.error('Lỗi trigger auto-schedule:', error);
      throw error;
    }
  },

  // ===== BRANCH-BASED OPERATIONS =====

  // Chuyển tiếp sự cố lên quản trị viên (technician escalate)
  escalateIncident: async (incidentId, reason) => {
    try {
      const response = await apiClient.post(`/tracking/incidents/${incidentId}/escalate`, { reason });
      return response.data;
    } catch (error) {
      console.error('Lỗi chuyển tiếp sự cố:', error);
      throw error;
    }
  },

  // Lấy danh sách sự cố của chi nhánh hiện tại (dành cho receptionist)
  getMyBranchIncidents: async () => {
    try {
      const response = await apiClient.get('/tracking/incidents/my-branch');
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy sự cố chi nhánh:', error);
      return [];
    }
  }
};
