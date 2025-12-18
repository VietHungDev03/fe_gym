import { useState, useEffect } from 'react';
import { Package, Activity, Wifi, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { equipmentService } from '../services/equipmentService';
import { trackingService } from '../services/trackingService';
import { useNotification } from '../contexts/NotificationContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import SeedDataButton from '../components/ui/SeedDataButton';
import RoleDashboard from '../components/dashboard/RoleDashboard';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEquipment: 0,
    activeEquipment: 0,
    maintenanceAlerts: 0,
    iotDevices: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load equipment stats
      const [allEquipment, activeEquipment, upcomingMaintenance] = await Promise.all([
        equipmentService.getAllEquipment(),
        equipmentService.getEquipmentByStatus('active'),
        trackingService.getUpcomingMaintenance(7) // Trong 7 ngày tới
      ]);

      setStats({
        totalEquipment: allEquipment.length,
        activeEquipment: activeEquipment.length,
        maintenanceAlerts: upcomingMaintenance.length,
        iotDevices: Math.floor(allEquipment.length * 0.6) // Giả định 60% thiết bị có IoT
      });

      // Tạo recent activity từ dữ liệu thực
      const activities = [];
      
      // Thêm maintenance alerts
      upcomingMaintenance.slice(0, 2).forEach(maintenance => {
        const equipment = allEquipment.find(eq => eq.id === maintenance.equipmentId);
        if (equipment) {
          activities.push({
            id: `maintenance_${maintenance.id}`,
            type: 'maintenance',
            message: `Cảnh báo bảo trì: ${equipment.name}`,
            time: formatRelativeTime(maintenance.scheduledDate)
          });
        }
      });

      // Thêm equipment activities
      allEquipment.slice(0, 2).forEach((equipment, index) => {
        activities.push({
          id: `equipment_${equipment.id}`,
          type: 'scan',
          message: `${equipment.name} - ${equipment.status === 'active' ? 'Hoạt động bình thường' : 'Cần kiểm tra'}`,
          time: `${Math.floor(Math.random() * 60)} phút trước`
        });
      });

      setRecentActivity(activities);
      
    } catch (error) {
      console.error('Lỗi tải dữ liệu dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (date) => {
    const now = new Date();
    const diff = date - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} ngày nữa`;
    if (hours > 0) return `${hours} giờ nữa`;
    return 'Sắp tới';
  };

  const StatCard = ({ icon: Icon, title, value, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-700',
      green: 'bg-green-50 text-green-700',
      yellow: 'bg-yellow-50 text-yellow-700',
      red: 'bg-red-50 text-red-700'
    };

    return (
      <div className="card-standard">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary">{value}</h3>
            <p className="text-sm text-secondary">{title}</p>
          </div>
        </div>
      </div>
    );
  };

  const RecentActivity = () => {
    return (
      <div className="card-standard">
        <h3 className="text-lg font-semibold text-primary mb-4">
          Hoạt động gần đây
        </h3>
        <div className="space-y-3">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-b-0">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'maintenance' ? 'bg-yellow-500' :
                  activity.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm text-primary">{activity.message}</p>
                  <p className="text-xs text-secondary">{activity.time}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-secondary">
              <p className="text-sm">Chưa có hoạt động nào</p>
              <p className="text-xs">Dữ liệu sẽ xuất hiện khi có thiết bị và lịch bảo trì</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-primary">Đang tải dữ liệu dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role-based Dashboard */}
      <RoleDashboard />
      

    </div>
  );
};

export default Dashboard;