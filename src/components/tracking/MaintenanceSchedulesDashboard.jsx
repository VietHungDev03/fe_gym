import { useState, useEffect } from 'react';
import { Calendar, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { trackingService } from '../../services/trackingService';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * Component: MaintenanceSchedulesDashboard
 * Dashboard thống kê lịch bảo trì định kỳ
 */
const MaintenanceSchedulesDashboard = () => {
  const [stats, setStats] = useState({
    totalSchedules: 0,
    activeSchedules: 0,
    inactiveSchedules: 0,
    upcomingMaintenance: 0,
    schedulesCreatedThisMonth: 0
  });
  const [schedules, setSchedules] = useState([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [schedulesData, maintenanceData] = await Promise.all([
        trackingService.getMaintenanceSchedules(),
        trackingService.getMaintenanceRecords()
      ]);

      setSchedules(schedulesData);
      setMaintenanceRecords(maintenanceData);

      // Tính toán thống kê
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      const totalSchedules = schedulesData.length;
      const activeSchedules = schedulesData.filter(s => s.isActive).length;
      const inactiveSchedules = schedulesData.filter(s => !s.isActive).length;

      // Đếm lịch sắp tới (trong 7 ngày)
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const upcomingMaintenance = schedulesData.filter(s => {
        if (!s.isActive || !s.nextScheduledDate) return false;
        const nextDate = new Date(s.nextScheduledDate);
        return nextDate >= now && nextDate <= sevenDaysFromNow;
      }).length;

      // Đếm lịch tạo trong tháng này
      const schedulesCreatedThisMonth = schedulesData.filter(s => {
        const createdDate = new Date(s.createdAt);
        return createdDate.getMonth() === thisMonth && createdDate.getFullYear() === thisYear;
      }).length;

      setStats({
        totalSchedules,
        activeSchedules,
        inactiveSchedules,
        upcomingMaintenance,
        schedulesCreatedThisMonth
      });
    } catch (error) {
      console.error('Lỗi tải dữ liệu dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Lấy 5 lịch sắp diễn ra
  const upcomingSchedules = schedules
    .filter(s => s.isActive && s.nextScheduledDate)
    .sort((a, b) => new Date(a.nextScheduledDate) - new Date(b.nextScheduledDate))
    .slice(0, 5);

  if (loading) {
    return <LoadingSpinner className="py-8" size="lg" />;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Thống Kê Lịch Bảo Trì</h2>

      {/* Cards thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tổng số lịch */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">
              {stats.totalSchedules}
            </span>
          </div>
          <p className="text-sm text-gray-600">Tổng số lịch</p>
        </div>

        {/* Đang hoạt động */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">
              {stats.activeSchedules}
            </span>
          </div>
          <p className="text-sm text-gray-600">Đang hoạt động</p>
        </div>

        {/* Sắp diễn ra */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
            <span className="text-2xl font-bold text-gray-900">
              {stats.upcomingMaintenance}
            </span>
          </div>
          <p className="text-sm text-gray-600">Sắp diễn ra (7 ngày)</p>
        </div>

        {/* Tạo mới tháng này */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold text-gray-900">
              {stats.schedulesCreatedThisMonth}
            </span>
          </div>
          <p className="text-sm text-gray-600">Mới tháng này</p>
        </div>
      </div>

      {/* Biểu đồ hoạt động */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lịch sắp diễn ra */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Lịch Sắp Diễn Ra
          </h3>

          {upcomingSchedules.length > 0 ? (
            <div className="space-y-3">
              {upcomingSchedules.map(schedule => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {schedule.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      Chu kỳ: {schedule.recurrenceInterval} ngày
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-600">
                      {formatDate(schedule.nextScheduledDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              Không có lịch sắp diễn ra
            </p>
          )}
        </div>

        {/* Phân bố theo trạng thái */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Phân Bố Trạng Thái
          </h3>

          <div className="space-y-4">
            {/* Active */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Đang hoạt động</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.activeSchedules} / {stats.totalSchedules}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${stats.totalSchedules > 0 ? (stats.activeSchedules / stats.totalSchedules) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            {/* Inactive */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Tạm dừng</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.inactiveSchedules} / {stats.totalSchedules}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-400 h-2 rounded-full transition-all"
                  style={{
                    width: `${stats.totalSchedules > 0 ? (stats.inactiveSchedules / stats.totalSchedules) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Tổng quan */}
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-gray-700">
              <span className="font-medium text-blue-900">
                {stats.activeSchedules > 0 ? Math.round((stats.activeSchedules / stats.totalSchedules) * 100) : 0}%
              </span>
              {' '}lịch bảo trì đang hoạt động
            </p>
          </div>
        </div>
      </div>

      {/* Hoạt động gần đây */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Bản Ghi Bảo Trì Gần Đây
        </h3>

        {maintenanceRecords.length > 0 ? (
          <div className="space-y-2">
            {maintenanceRecords.slice(0, 5).map(record => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {record.description}
                  </p>
                  <p className="text-xs text-gray-600">
                    {formatDate(record.scheduledDate)}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  record.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : record.status === 'in_progress'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {record.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">
            Chưa có bản ghi bảo trì nào
          </p>
        )}
      </div>
    </div>
  );
};

export default MaintenanceSchedulesDashboard;
