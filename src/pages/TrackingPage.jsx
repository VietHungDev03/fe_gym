import { useState } from 'react';
import { Calendar, AlertTriangle, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS, hasPermission } from '../utils/permissions';
import MaintenanceSchedule from '../components/tracking/MaintenanceSchedule';
import IncidentReports from '../components/tracking/IncidentReports';
import AssignmentManagement from '../components/tracking/AssignmentManagement';
import WorkloadDashboard from '../components/tracking/WorkloadDashboard';

const TrackingPage = () => {
  const [activeTab, setActiveTab] = useState('maintenance');
  const { userProfile } = useAuth();
  
  // Tất cả tabs có thể có
  const allTabs = [
    {
      id: 'maintenance',
      label: 'Lịch bảo trì',
      icon: Calendar,
      component: MaintenanceSchedule,
      permission: PERMISSIONS.TRACKING_VIEW
    },
    {
      id: 'incidents',
      label: 'Báo cáo sự cố',
      icon: AlertTriangle,
      component: IncidentReports,
      permission: PERMISSIONS.INCIDENT_CREATE
    },
    {
      id: 'assignments',
      label: 'Phân công việc',
      icon: Users,
      component: AssignmentManagement,
      permission: PERMISSIONS.MAINTENANCE_CREATE, // Chỉ manager/admin thấy
      roles: ['admin', 'manager']
    },
    {
      id: 'workload',
      label: 'Khối lượng CV',
      icon: BarChart3,
      component: WorkloadDashboard,
      permission: PERMISSIONS.ANALYTICS_VIEW, // Chỉ manager/admin thấy
      roles: ['admin', 'manager']
    }
  ];
  
  // Lọc tabs theo quyền hạn
  const tabs = allTabs.filter(tab => {
    // Kiểm tra permission cơ bản
    if (tab.permission && !hasPermission(userProfile?.role, tab.permission)) {
      return false;
    }
    
    // Kiểm tra roles cụ thể nếu có
    if (tab.roles && !tab.roles.includes(userProfile?.role)) {
      return false;
    }
    
    return true;
  });

  // Đảm bảo activeTab luôn hợp lệ
  const validActiveTab = tabs.some(tab => tab.id === activeTab) ? activeTab : tabs[0]?.id || 'maintenance';
  const ActiveComponent = tabs.find(tab => tab.id === validActiveTab)?.component || MaintenanceSchedule;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-primary">
          Theo dõi sử dụng & Bảo trì
        </h1>
        <p className="text-secondary mt-1">
          Quản lý lịch bảo trì và theo dõi việc sử dụng thiết bị
        </p>
      </div>

      {/* Tabs */}
      <div className="card-standard">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  validActiveTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Nội dung tab */}
      <div>
        <ActiveComponent />
      </div>
    </div>
  );
};

export default TrackingPage;
