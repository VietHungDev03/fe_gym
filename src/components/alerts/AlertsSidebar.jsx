import { useState, useEffect } from 'react';
import { X, Bell, AlertTriangle, Wrench, Activity, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { trackingService } from '../../services/trackingService';
import { equipmentService } from '../../services/equipmentService';
import LoadingSpinner from '../ui/LoadingSpinner';

const AlertsSidebar = ({ isOpen, onClose }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, maintenance, iot, system
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  useEffect(() => {
    if (isOpen) {
      loadAlerts();
    }
  }, [isOpen, userProfile]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const alertsList = [];

      // 1. Cảnh báo bảo trì sắp đến hạn (7 ngày tới)
      try {
        const upcomingMaintenance = await trackingService.getUpcomingMaintenance(7);

        for (const maintenance of upcomingMaintenance) {
          const equipment = await equipmentService.getEquipmentById(maintenance.equipmentId);
          const daysUntil = Math.ceil((new Date(maintenance.scheduledDate) - new Date()) / (1000 * 60 * 60 * 24));

          alertsList.push({
            id: `maintenance_${maintenance.id}`,
            type: 'maintenance',
            severity: daysUntil <= 2 ? 'high' : daysUntil <= 5 ? 'medium' : 'low',
            title: 'Sắp đến hạn bảo trì',
            message: `${equipment.name} cần bảo trì trong ${daysUntil} ngày`,
            equipment: equipment.name,
            equipmentId: equipment.id,
            timestamp: maintenance.scheduledDate,
            read: false,
            action: () => navigate('/tracking')
          });
        }
      } catch (error) {
        console.error('Lỗi tải cảnh báo bảo trì:', error);
      }

      // 2. Cảnh báo thiết bị quá hạn bảo trì
      try {
        const allEquipment = await equipmentService.getAllEquipment();

        for (const equipment of allEquipment) {
          if (equipment.status !== 'disposed') {
            const nextMaintenance = calculateNextMaintenanceDate(equipment);
            if (nextMaintenance) {
              const daysOverdue = Math.ceil((new Date() - nextMaintenance) / (1000 * 60 * 60 * 24));

              if (daysOverdue > 0) {
                alertsList.push({
                  id: `overdue_${equipment.id}`,
                  type: 'maintenance',
                  severity: 'high',
                  title: 'Quá hạn bảo trì',
                  message: `${equipment.name} đã quá hạn ${daysOverdue} ngày`,
                  equipment: equipment.name,
                  equipmentId: equipment.id,
                  timestamp: nextMaintenance,
                  read: false,
                  action: () => navigate(`/equipment`)
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Lỗi kiểm tra quá hạn bảo trì:', error);
      }

      // 3. Cảnh báo thiết bị không hoạt động
      try {
        const inactiveEquipment = await equipmentService.getEquipmentByStatus('inactive');

        for (const equipment of inactiveEquipment) {
          alertsList.push({
            id: `inactive_${equipment.id}`,
            type: 'system',
            severity: 'medium',
            title: 'Thiết bị không hoạt động',
            message: `${equipment.name} đang ở trạng thái không hoạt động`,
            equipment: equipment.name,
            equipmentId: equipment.id,
            timestamp: new Date(),
            read: false,
            action: () => navigate('/equipment')
          });
        }
      } catch (error) {
        console.error('Lỗi tải thiết bị không hoạt động:', error);
      }

      // 4. Cảnh báo thiết bị đang bảo trì
      try {
        const maintenanceEquipment = await equipmentService.getEquipmentByStatus('maintenance');

        for (const equipment of maintenanceEquipment) {
          alertsList.push({
            id: `in_maintenance_${equipment.id}`,
            type: 'maintenance',
            severity: 'low',
            title: 'Thiết bị đang bảo trì',
            message: `${equipment.name} hiện đang được bảo trì`,
            equipment: equipment.name,
            equipmentId: equipment.id,
            timestamp: new Date(),
            read: false,
            action: () => navigate('/tracking')
          });
        }
      } catch (error) {
        console.error('Lỗi tải thiết bị bảo trì:', error);
      }

      // 5. Cảnh báo IoT (giả lập - trong thực tế sẽ lấy từ IoT service)
      // Admin, Manager, Technician có thể thấy cảnh báo IoT
      if (['admin', 'manager', 'technician'].includes(userProfile?.role)) {
        // Giả lập một số cảnh báo IoT
        const iotAlerts = generateMockIoTAlerts(allEquipment?.slice(0, 2) || []);
        alertsList.push(...iotAlerts);
      }

      // Sắp xếp theo độ ưu tiên và thời gian
      const sortedAlerts = alertsList.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[b.severity] - severityOrder[a.severity];
        }
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      setAlerts(sortedAlerts);
    } catch (error) {
      console.error('Lỗi tải cảnh báo:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseDate = (value) => {
    if (!value) return null;
    if (value.toDate && typeof value.toDate === 'function') return value.toDate();
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const calculateNextMaintenanceDate = (equipment) => {
    const direct = parseDate(
      equipment.nextMaintenanceDate ||
      equipment.nextMaintenance ||
      equipment.scheduledMaintenanceDate
    );
    if (direct) return direct;

    const baseDate =
      parseDate(equipment.lastMaintenanceDate) ||
      parseDate(equipment.purchaseDate) ||
      parseDate(equipment.createdAt);

    if (!baseDate) return null;

    const interval = equipment.maintenanceInterval || 30;
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + interval);

    return nextDate;
  };

  const generateMockIoTAlerts = (equipmentList) => {
    const iotAlerts = [];

    equipmentList.forEach((equipment, index) => {
      if (index % 3 === 0) { // 1/3 thiết bị có cảnh báo nhiệt độ
        iotAlerts.push({
          id: `iot_temp_${equipment.id}`,
          type: 'iot',
          severity: 'high',
          title: 'Nhiệt độ bất thường',
          message: `${equipment.name} phát hiện nhiệt độ cao (42°C)`,
          equipment: equipment.name,
          equipmentId: equipment.id,
          timestamp: new Date(Date.now() - Math.random() * 3600000),
          read: false,
          action: () => navigate('/iot')
        });
      }

      if (index % 4 === 0) { // 1/4 thiết bị có cảnh báo rung
        iotAlerts.push({
          id: `iot_vibration_${equipment.id}`,
          type: 'iot',
          severity: 'medium',
          title: 'Rung động bất thường',
          message: `${equipment.name} phát hiện rung động cao hơn bình thường`,
          equipment: equipment.name,
          equipmentId: equipment.id,
          timestamp: new Date(Date.now() - Math.random() * 7200000),
          read: false,
          action: () => navigate('/iot')
        });
      }
    });

    return iotAlerts;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString('vi-VN');
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'maintenance':
        return Wrench;
      case 'iot':
        return Activity;
      case 'system':
        return AlertTriangle;
      default:
        return Bell;
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'high':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          dot: 'bg-red-500'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          dot: 'bg-yellow-500'
        };
      case 'low':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          dot: 'bg-blue-500'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: 'text-gray-600',
          dot: 'bg-gray-500'
        };
    }
  };

  const handleAlertClick = (alert) => {
    if (alert.action) {
      alert.action();
      onClose();
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.type === filter;
  });

  const unreadCount = alerts.filter(a => !a.read).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-xl z-50 transform transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Cảnh báo</h2>
              <p className="text-xs text-blue-100">
                {unreadCount} chưa đọc
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Tất cả ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('maintenance')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === 'maintenance'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Bảo trì ({alerts.filter(a => a.type === 'maintenance').length})
            </button>
            <button
              onClick={() => setFilter('iot')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === 'iot'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              IoT ({alerts.filter(a => a.type === 'iot').length})
            </button>
            <button
              onClick={() => setFilter('system')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === 'system'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Hệ thống ({alerts.filter(a => a.type === 'system').length})
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="overflow-y-auto h-[calc(100vh-180px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Không có cảnh báo
              </h3>
              <p className="text-sm text-gray-500 text-center">
                {filter === 'all'
                  ? 'Tất cả thiết bị đang hoạt động bình thường'
                  : 'Không có cảnh báo trong danh mục này'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAlerts.map((alert) => {
                const Icon = getAlertIcon(alert.type);
                const colors = getAlertColor(alert.severity);

                return (
                  <div
                    key={alert.id}
                    onClick={() => handleAlertClick(alert)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !alert.read ? 'bg-blue-50 bg-opacity-30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 ${colors.bg} border ${colors.border} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${colors.icon}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {alert.title}
                          </h4>
                          {!alert.read && (
                            <div className={`w-2 h-2 ${colors.dot} rounded-full mt-1.5`} />
                          )}
                        </div>

                        <p className="text-sm text-gray-700 mb-2">
                          {alert.message}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(alert.timestamp)}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AlertsSidebar;
