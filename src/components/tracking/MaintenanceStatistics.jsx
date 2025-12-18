import { useState, useEffect } from 'react';
import { Calendar, User, Package, BarChart3, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { maintenanceService } from '../../services/maintenanceService';
import { equipmentService } from '../../services/equipmentService';
import { userService } from '../../services/userService';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../ui/LoadingSpinner';

const MaintenanceStatistics = () => {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [filters, setFilters] = useState({
    equipmentId: '',
    assignedTo: '',
    startDate: '',
    endDate: '',
  });
  const [equipment, setEquipment] = useState([]);
  const [users, setUsers] = useState([]);
  const { showError } = useNotification();

  useEffect(() => {
    loadEquipment();
    loadUsers();
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [filters]);

  const loadEquipment = async () => {
    try {
      const data = await equipmentService.getAllEquipment();
      setEquipment(data);
    } catch (error) {
      console.error('Lỗi tải danh sách thiết bị:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(data.filter(u => u.role === 'technician'));
    } catch (error) {
      console.error('Lỗi tải danh sách người dùng:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const queryParams = {};
      if (filters.equipmentId) queryParams.equipmentId = filters.equipmentId;
      if (filters.assignedTo) queryParams.assignedTo = filters.assignedTo;
      if (filters.startDate) queryParams.startDate = filters.startDate;
      if (filters.endDate) queryParams.endDate = filters.endDate;

      const data = await maintenanceService.getStatistics(queryParams);
      setStatistics(data);
    } catch (error) {
      console.error('Lỗi tải thống kê:', error);
      showError('Không thể tải thống kê bảo trì');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      equipmentId: '',
      assignedTo: '',
      startDate: '',
      endDate: '',
    });
  };

  if (loading && !statistics) {
    return <LoadingSpinner className="py-8" size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Thống kê bảo trì</h2>
        <p className="text-sm text-gray-600">Xem thống kê và phân tích hoạt động bảo trì thiết bị</p>
      </div>

      {/* Filters */}
      <div className="card-standard">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bộ lọc</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Equipment Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Package className="w-4 h-4 text-gray-500" />
              Thiết bị
            </label>
            <select
              value={filters.equipmentId}
              onChange={(e) => handleFilterChange('equipmentId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả thiết bị</option>
              {equipment.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned To Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 text-gray-500" />
              Nhân viên
            </label>
            <select
              value={filters.assignedTo}
              onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả nhân viên</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName || user.username}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              Từ ngày
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* End Date Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              Đến ngày
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {(filters.equipmentId || filters.assignedTo || filters.startDate || filters.endDate) && (
          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}
      </div>

      {statistics && (
        <>
          {/* Overview Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Tổng bảo trì</p>
                  <p className="text-2xl font-bold text-blue-700">{statistics.total}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Hoàn thành</p>
                  <p className="text-2xl font-bold text-green-700">{statistics.byStatus.completed}</p>
                  <p className="text-xs text-green-600 mt-1">{statistics.completionRate}%</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600">Đang chờ</p>
                  <p className="text-2xl font-bold text-yellow-700">{statistics.byStatus.scheduled}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Quá hạn</p>
                  <p className="text-2xl font-bold text-red-700">{statistics.byStatus.overdue}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By Status */}
            <div className="card-standard">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Theo trạng thái</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Đã lên lịch</span>
                  <span className="text-sm font-semibold text-gray-900">{statistics.byStatus.scheduled}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Đang thực hiện</span>
                  <span className="text-sm font-semibold text-gray-900">{statistics.byStatus.inProgress}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Hoàn thành</span>
                  <span className="text-sm font-semibold text-gray-900">{statistics.byStatus.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Đã hủy</span>
                  <span className="text-sm font-semibold text-gray-900">{statistics.byStatus.cancelled}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-sm text-gray-600">Quá hạn</span>
                  <span className="text-sm font-semibold text-red-600">{statistics.byStatus.overdue}</span>
                </div>
              </div>
            </div>

            {/* By Type */}
            <div className="card-standard">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Theo loại</h3>
              <div className="space-y-3">
                {Object.entries(statistics.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{type}</span>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
                {Object.keys(statistics.byType).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">Không có dữ liệu</p>
                )}
              </div>
            </div>

            {/* By Priority */}
            <div className="card-standard">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Theo mức độ ưu tiên</h3>
              <div className="space-y-3">
                {Object.entries(statistics.byPriority).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{priority}</span>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
                {Object.keys(statistics.byPriority).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">Không có dữ liệu</p>
                )}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="card-standard">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hiệu suất</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Tỷ lệ hoàn thành</span>
                    <span className="text-sm font-semibold text-gray-900">{statistics.completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${statistics.completionRate}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-4 border-t">
                  <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Thời gian hoàn thành trung bình</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {statistics.avgCompletionTimeHours} giờ
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MaintenanceStatistics;
