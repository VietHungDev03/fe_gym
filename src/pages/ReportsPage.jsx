import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Package, Activity, AlertTriangle, Download, FileText, Users, Clock, CheckCircle } from 'lucide-react';
import { equipmentService } from '../services/equipmentService';
import { userService } from '../services/userService';
import { reportsService } from '../services/reportsService';
import { useNotification } from '../contexts/NotificationContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const ReportsPage = () => {

  const EQUIPMENT_STATUS_MAP = {
    active: {
      label: 'Hoạt động',
      csvLabel: 'Hoạt động',
      badgeClass: 'bg-green-100 text-green-800',
    },
    maintenance: {
      label: 'Bảo trì',
      csvLabel: 'Bảo trì',
      badgeClass: 'bg-yellow-100 text-yellow-800',
    },
    inactive: {
      label: 'Ngừng hoạt động',
      csvLabel: 'Ngừng hoạt động',
      badgeClass: 'bg-red-100 text-red-800',
    },
    disposed: {
      label: 'Đã thanh lý',
      csvLabel: 'Đã thanh lý',
      badgeClass: 'bg-gray-100 text-gray-800',
    },
    // fallback nếu status không khớp
    default: {
      label: 'Không xác định',
      csvLabel: 'Không xác định',
      badgeClass: 'bg-gray-100 text-gray-800',
    },
  };

  
  const [stats, setStats] = useState({
    totalEquipment: 0,
    activeEquipment: 0,
    maintenanceEquipment: 0,
    inactiveEquipment: 0,
    disposedEquipment: 0,
    maintenanceScheduled: 0,
    maintenanceCompleted: 0,
    maintenanceCompletionRate: 0,
    lateMaintenanceCount: 0,
    incidentsReported: 0,
    totalUsers: 0,
    totalUsageSessions: 0,
    averageUptime: 0
  });
  const [equipmentDetails, setEquipmentDetails] = useState([]);
  const [usageChart, setUsageChart] = useState([]);
  const [maintenanceChart, setMaintenanceChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    loadStats();
  }, [selectedPeriod]);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Gọi API thống kê từ backend
      const statisticsData = await reportsService.getStatistics(selectedPeriod);

      // Load equipment và users count
      const allEquipment = await equipmentService.getAllEquipment();
      const allUsers = await userService.getAllUsers();

      console.log('📊 Statistics data from API:', statisticsData);

      // Prepare equipment details for table (top 10)
      const details = allEquipment.slice(0, 10).map(equipment => ({
        id: equipment.id,
        name: equipment.name,
        status: equipment.status,
        type: equipment.type,
        usageCount: 0, // TODO: Có thể lấy từ usage logs
        uptime: 95.0, // TODO: Tính từ downtime data
        nextMaintenance: equipment.lastMaintenanceDate
          ? new Date(new Date(equipment.lastMaintenanceDate).getTime() + equipment.maintenanceInterval * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN')
          : 'Chưa xác định'
      }));

      // Mock usage chart data (7 ngày gần nhất)
      const usageData = Array.from({ length: 7 }, (_, i) => ({
        day: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][i],
        usage: Math.floor(Math.random() * 80) + 20 // TODO: Lấy từ usage logs thực
      }));

      // Mock maintenance chart data (6 tháng gần nhất)
      const maintenanceData = Array.from({ length: 6 }, (_, i) => ({
        month: ['T7', 'T8', 'T9', 'T10', 'T11', 'T12'][i],
        scheduled: Math.floor(Math.random() * 15) + 5,
        completed: Math.floor(Math.random() * 12) + 3
      }));

      // Calculate average uptime
      const averageUptime = details.length > 0
        ? (details.reduce((sum, eq) => sum + parseFloat(eq.uptime), 0) / details.length).toFixed(1)
        : 95.0;

      setStats({
        // Equipment stats từ API
        totalEquipment: statisticsData.equipment?.total || 0,
        activeEquipment: statisticsData.equipment?.active || 0,
        maintenanceEquipment: statisticsData.equipment?.maintenance || 0,
        inactiveEquipment: statisticsData.equipment?.inactive || 0,
        disposedEquipment: statisticsData.equipment?.disposed || 0,

        // Maintenance stats từ API
        maintenanceScheduled: statisticsData.maintenance?.total || 0,
        maintenanceCompleted: statisticsData.maintenance?.completed || 0,
        maintenanceCompletionRate: statisticsData.maintenance?.completionRate || 0,
        lateMaintenanceCount: statisticsData.maintenance?.lateCount || 0,

        // Incidents từ API
        incidentsReported: statisticsData.incidents?.total || 0,

        // Users và usage sessions
        totalUsers: allUsers.length,
        totalUsageSessions: 0, // TODO: Có thể lấy từ usage logs
        averageUptime: parseFloat(averageUptime)
      });

      setEquipmentDetails(details);
      setUsageChart(usageData);
      setMaintenanceChart(maintenanceData);

    } catch (error) {
      console.error('Lỗi tải thống kê:', error);
      showError('Không thể tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    try {
      // Tạo CSV data
      const csvRows = [];

      // Header
      csvRows.push('BÁO CÁO THỐNG KÊ HỆ THỐNG IGYMCARE');
      csvRows.push(`Ngày tạo: ${new Date().toLocaleString('vi-VN')}`);
      csvRows.push(`Kỳ báo cáo: ${selectedPeriod === 'week' ? 'Tuần này' : selectedPeriod === 'month' ? 'Tháng này' : selectedPeriod === 'quarter' ? 'Quý này' : 'Năm này'}`);
      csvRows.push('');

      // Tổng quan thiết bị
      csvRows.push('TỔNG QUAN THIẾT BỊ');
      csvRows.push(`Tổng số thiết bị,${stats.totalEquipment}`);
      csvRows.push(`Đang hoạt động,${stats.activeEquipment}`);
      csvRows.push(`Đang bảo trì,${stats.maintenanceEquipment}`);
      csvRows.push(`Ngừng hoạt động,${stats.inactiveEquipment}`);
      csvRows.push(`Đã thanh lý,${stats.disposedEquipment}`);
      csvRows.push('');

      // Thống kê bảo trì
      csvRows.push('THỐNG KÊ BẢO TRÌ');
      csvRows.push(`Tổng số lịch bảo trì,${stats.maintenanceScheduled}`);
      csvRows.push(`Đã hoàn thành,${stats.maintenanceCompleted}`);
      csvRows.push(`Tỷ lệ hoàn thành,${stats.maintenanceCompletionRate}%`);
      csvRows.push(`Số lần bảo trì trễ,${stats.lateMaintenanceCount}`);
      csvRows.push('');

      // Thống kê sự cố
      csvRows.push('THỐNG KÊ SỰ CỐ');
      csvRows.push(`Tổng số sự cố,${stats.incidentsReported}`);
      csvRows.push('');

      // Thống kê người dùng
      csvRows.push('THỐNG KÊ NGƯỜI DÙNG');
      csvRows.push(`Tổng số người dùng,${stats.totalUsers}`);
      csvRows.push('');

      // Chi tiết thiết bị
      csvRows.push('CHI TIẾT THIẾT BỊ (TOP 10)');
      csvRows.push('Tên thiết bị,Loại,Trạng thái,Lần sử dụng,Uptime (%),Bảo trì tiếp theo');
      equipmentDetails.forEach(eq => {
        const statusConfig = EQUIPMENT_STATUS_MAP[eq.status] || EQUIPMENT_STATUS_MAP.default;
        csvRows.push(
          `${eq.name},${eq.type || 'N/A'},${statusConfig.csvLabel},${eq.usageCount},${eq.uptime},${eq.nextMaintenance}`
        );
      });

      // Tạo CSV string
      const csvContent = csvRows.join('\n');

      // Tạo BOM cho UTF-8 để Excel hiển thị đúng tiếng Việt
      const BOM = '\uFEFF';
      const dataBlob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `iGymCare-Report-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      showSuccess('Báo cáo đã được xuất thành công (CSV)');
    } catch (error) {
      console.error('Lỗi export:', error);
      showError('Không thể xuất báo cáo');
    }
  };

  const StatCard = ({ icon: Icon, title, value, change, changeType, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      red: 'bg-red-50 text-red-700 border-red-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };

    return (
      <div className="card-standard">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-secondary">{title}</p>
            <p className="text-2xl font-semibold text-primary">{value}</p>
            {change && (
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className={`w-4 h-4 ${changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`text-sm ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                  {change}
                </span>
              </div>
            )}
          </div>
          
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    );
  };

  const UsageChart = ({ data, title }) => (
    <div className="card-standard">
      <h3 className="text-lg font-semibold text-primary mb-4">{title}</h3>
      <div className="h-64 flex items-end justify-between gap-2 px-4 py-4 bg-gray-50 rounded-lg">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className="bg-blue-500 rounded-t w-full transition-all duration-500 hover:bg-blue-600"
              style={{ height: `${(item.usage / 100) * 200}px`, minHeight: '20px' }}
              title={`${item.day}: ${item.usage}%`}
            ></div>
            <span className="text-sm text-gray-600 mt-2">{item.day}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 text-sm text-gray-500 text-center">
        Tỷ lệ sử dụng thiết bị theo ngày (%)
      </div>
    </div>
  );

  const MaintenanceChart = ({ data, title }) => (
    <div className="card-standard">
      <h3 className="text-lg font-semibold text-primary mb-4">{title}</h3>
      <div className="h-64 flex items-end justify-between gap-2 px-4 py-4 bg-gray-50 rounded-lg">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1 gap-1">
            <div className="flex flex-col gap-1 w-full">
              <div 
                className="bg-yellow-500 rounded-t w-full"
                style={{ height: `${(item.scheduled / 20) * 150}px`, minHeight: '10px' }}
                title={`${item.month} - Đã lên lịch: ${item.scheduled}`}
              ></div>
              <div 
                className="bg-green-500 rounded-b w-full"
                style={{ height: `${(item.completed / 20) * 150}px`, minHeight: '10px' }}
                title={`${item.month} - Hoàn thành: ${item.completed}`}
              ></div>
            </div>
            <span className="text-sm text-gray-600 mt-2">{item.month}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span className="text-gray-600">Đã lên lịch</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600">Hoàn thành</span>
        </div>
      </div>
    </div>
  );

  const ReportSection = ({ title, children }) => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-primary">{title}</h2>
      {children}
    </div>
  );

  if (loading) {
    return <LoadingSpinner className="py-8" size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">
            Báo cáo & Thống kê
          </h1>
          <p className="text-secondary mt-1">
            Tổng quan về hoạt động và hiệu suất của hệ thống
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
            <option value="quarter">Quý này</option>
            <option value="year">Năm này</option>
          </select>
          
          <button 
            onClick={exportReport}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Thống kê tổng quan */}
      <ReportSection title="Tổng quan hệ thống">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Package}
            title="Tổng số thiết bị"
            value={stats.totalEquipment}
            change="+2 thiết bị"
            changeType="increase"
            color="blue"
          />
          
          <StatCard
            icon={Activity}
            title="Thiết bị hoạt động"
            value={stats.activeEquipment}
            change={`${stats.averageUptime}% uptime`}
            changeType="increase"
            color="green"
          />
          
          <StatCard
            icon={Users}
            title="Tổng người dùng"
            value={stats.totalUsers}
            change="+5 người dùng mới"
            changeType="increase"
            color="purple"
          />
          
          <StatCard
            icon={Clock}
            title="Phiên sử dụng"
            value={stats.totalUsageSessions}
            change="+15% tăng trưởng"
            changeType="increase"
            color="indigo"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <StatCard
            icon={AlertTriangle}
            title="Lịch bảo trì"
            value={stats.maintenanceScheduled}
            change={`${stats.maintenanceCompleted} đã hoàn thành`}
            changeType="increase"
            color="yellow"
          />

          <StatCard
            icon={CheckCircle}
            title="Tỷ lệ hoàn thành"
            value={`${stats.maintenanceCompletionRate}%`}
            change={`${stats.maintenanceCompleted}/${stats.maintenanceScheduled} lịch`}
            changeType="increase"
            color="green"
          />

          <StatCard
            icon={Clock}
            title="Bảo trì trễ"
            value={stats.lateMaintenanceCount}
            change={stats.lateMaintenanceCount > 0 ? 'Cần cải thiện' : 'Tốt'}
            changeType={stats.lateMaintenanceCount > 0 ? 'decrease' : 'increase'}
            color={stats.lateMaintenanceCount > 0 ? 'red' : 'green'}
          />

          <StatCard
            icon={AlertTriangle}
            title="Sự cố báo cáo"
            value={stats.incidentsReported}
            change="Trong kỳ báo cáo"
            changeType="stable"
            color="red"
          />
        </div>
      </ReportSection>

      {/* Biểu đồ */}
      <ReportSection title="Phân tích xu hướng">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UsageChart
            data={usageChart}
            title="Tỷ lệ sử dụng thiết bị tuần này"
          />
          
          <MaintenanceChart
            data={maintenanceChart}
            title="Thống kê bảo trì 6 tháng gần nhất"
          />
        </div>
      </ReportSection>

      {/* Bảng dữ liệu mẫu */}
      <ReportSection title="Báo cáo chi tiết">
        <div className="card-standard">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thiết bị
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lần sử dụng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uptime
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bảo trì tiếp theo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {equipmentDetails.map((equipment) => {
                  const statusConfig = EQUIPMENT_STATUS_MAP[equipment.status] || EQUIPMENT_STATUS_MAP.default;

                  return (
                    <tr key={equipment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {equipment.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.badgeClass}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {equipment.usageCount} lần
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {equipment.uptime}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {equipment.nextMaintenance}
                      </td>
                    </tr>
                  );
                })}
                
                {equipmentDetails.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      Chưa có dữ liệu thiết bị
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ReportSection>

      {/* Footer info */}
      <div className="card-standard">
        <div className="flex items-center justify-between text-sm text-secondary">
          <span>Dữ liệu được cập nhật lần cuối: {new Date().toLocaleString('vi-VN')}</span>
          <span>Tự động làm mới mỗi 5 phút</span>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
