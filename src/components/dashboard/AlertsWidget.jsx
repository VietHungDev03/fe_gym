import { useState, useEffect } from 'react';
import { AlertTriangle, Wrench, Activity, ChevronRight, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackingService } from '../../services/trackingService';
import { equipmentService } from '../../services/equipmentService';
import LoadingSpinner from '../ui/LoadingSpinner';

const AlertsWidget = ({ maxAlerts = 5 }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTopAlerts();
  }, []);

  const loadTopAlerts = async () => {
    try {
      setLoading(true);
      const alertsList = [];

      // Lấy cảnh báo bảo trì sắp đến hạn
      const upcomingMaintenance = await trackingService.getUpcomingMaintenance(7);
      for (const maintenance of upcomingMaintenance.slice(0, 3)) {
        try {
          const equipment = await equipmentService.getEquipmentById(maintenance.equipmentId);
          const daysUntil = Math.ceil((new Date(maintenance.scheduledDate) - new Date()) / (1000 * 60 * 60 * 24));

          alertsList.push({
            id: `maintenance_${maintenance.id}`,
            type: 'maintenance',
            severity: daysUntil <= 2 ? 'high' : 'medium',
            title: `Sắp đến hạn bảo trì`,
            message: `${equipment.name} - còn ${daysUntil} ngày`,
            timestamp: maintenance.scheduledDate,
            action: () => navigate('/tracking')
          });
        } catch (error) {
          console.error('Lỗi tải thông tin thiết bị:', error);
        }
      }

      // Lấy thiết bị quá hạn bảo trì
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
                message: `${equipment.name} - quá hạn ${daysOverdue} ngày`,
                timestamp: nextMaintenance,
                action: () => navigate('/equipment')
              });
            }
          }
        }
      }

      // Lấy thiết bị không hoạt động
      const inactiveEquipment = await equipmentService.getEquipmentByStatus('inactive');
      for (const equipment of inactiveEquipment.slice(0, 2)) {
        alertsList.push({
          id: `inactive_${equipment.id}`,
          type: 'system',
          severity: 'medium',
          title: 'Thiết bị không hoạt động',
          message: equipment.name,
          timestamp: new Date(),
          action: () => navigate('/equipment')
        });
      }

      // Sắp xếp theo độ ưu tiên
      const sortedAlerts = alertsList.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });

      setAlerts(sortedAlerts.slice(0, maxAlerts));
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

  const getAlertIcon = (type) => {
    switch (type) {
      case 'maintenance':
        return Wrench;
      case 'iot':
        return Activity;
      default:
        return AlertTriangle;
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

  if (loading) {
    return (
      <div className="card-standard">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      </div>
    );
  }

  return (
    <div className="card-standard">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          Cảnh báo quan trọng
        </h3>
        {alerts.length > 0 && (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            {alerts.length}
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">Tất cả đều ổn!</p>
          <p className="text-xs text-gray-500">Không có cảnh báo nào cần xử lý</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = getAlertIcon(alert.type);
            const colors = getAlertColor(alert.severity);

            return (
              <div
                key={alert.id}
                onClick={alert.action}
                className={`flex items-start gap-3 p-3 ${colors.bg} border ${colors.border} rounded-lg cursor-pointer hover:shadow-md transition-all`}
              >
                <div className={`w-8 h-8 ${colors.bg} border ${colors.border} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${colors.icon}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {alert.title}
                    </h4>
                    <div className={`w-2 h-2 ${colors.dot} rounded-full mt-1.5 animate-pulse`} />
                  </div>
                  <p className="text-sm text-gray-700">
                    {alert.message}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
              </div>
            );
          })}

          <button
            onClick={() => navigate('/tracking')}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 hover:bg-blue-50 rounded-md transition-colors"
          >
            Xem tất cả cảnh báo →
          </button>
        </div>
      )}
    </div>
  );
};

export default AlertsWidget;
