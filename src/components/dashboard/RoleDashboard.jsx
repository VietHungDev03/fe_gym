import { useState, useEffect } from 'react';
import {
  Shield, Users, Wrench, User as UserIcon, Settings, Database, Activity,
  AlertTriangle, TrendingUp, BarChart3,
  UserCheck, Eye, RefreshCw, Building2, Package, Clock, CheckCircle2
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { trackingService } from '../../services/trackingService';
import { userService } from '../../services/userService';
import { equipmentService } from '../../services/equipmentService';
import { branchService } from '../../services/branchService';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import TechnicianTaskDashboard from './TechnicianTaskDashboard';
import ManagerDashboard from './ManagerDashboard';
import UserDashboard from './UserDashboard';
import AlertsWidget from './AlertsWidget';

// Dashboard cho Admin với dữ liệu thật
const AdminDashboard = () => {
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    totalEquipment: 0,
    totalMaintenanceRecords: 0,
    totalIncidents: 0,
    activeUsers: 0,
    equipmentInMaintenance: 0,
    pendingIncidents: 0,
    systemUptime: 99.8
  });

  const [recentSystemActivity, setRecentSystemActivity] = useState([]);
  const [userRoleDistribution, setUserRoleDistribution] = useState([]);
  const [equipmentStatusStats, setEquipmentStatusStats] = useState([]);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const { showError, showSuccess } = useNotification();
  const { userProfile } = useAuth();

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);

      // Load all system data in parallel
      const [users, equipment, maintenanceRecords, incidents] = await Promise.all([
        userService.getAllUsers(),
        equipmentService.getAllEquipment(),
        trackingService.getMaintenanceRecords(),
        trackingService.getIncidentReports()
      ]);

      // Calculate admin statistics
      const totalUsers = users.length;
      const totalEquipment = equipment.length;
      const totalMaintenanceRecords = maintenanceRecords.length;
      const totalIncidents = incidents.length;

      // Active users (users with recent activity)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const activeUsers = users.filter(user => {
        const lastActive = user.lastActiveAt?.toDate?.() || new Date(user.lastActiveAt || user.createdAt || 0);
        return lastActive >= thirtyDaysAgo;
      }).length;

      // Equipment in maintenance
      const equipmentInMaintenance = equipment.filter(eq => eq.status === 'maintenance').length;

      // Pending incidents
      const pendingIncidents = incidents.filter(incident => 
        ['reported', 'investigating'].includes(incident.status)
      ).length;

      setAdminStats({
        totalUsers,
        totalEquipment,
        totalMaintenanceRecords,
        totalIncidents,
        activeUsers,
        equipmentInMaintenance,
        pendingIncidents,
        systemUptime: 99.8 // This would come from actual monitoring
      });

      // User role distribution
      const roleDistribution = users.reduce((acc, user) => {
        const role = user.role || 'user';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});

      setUserRoleDistribution([
        { role: 'Admin', count: roleDistribution.admin || 0, color: 'bg-red-500' },
        { role: 'Manager', count: roleDistribution.manager || 0, color: 'bg-blue-500' },
        { role: 'Technician', count: roleDistribution.technician || 0, color: 'bg-green-500' },
        { role: 'User', count: roleDistribution.user || 0, color: 'bg-gray-500' }
      ]);

      // Equipment status statistics
      const statusStats = equipment.reduce((acc, eq) => {
        const status = eq.status || 'active';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      setEquipmentStatusStats([
        { status: 'Hoạt động', count: statusStats.active || 0, color: 'bg-green-500' },
        { status: 'Bảo trì', count: statusStats.maintenance || 0, color: 'bg-yellow-500' },
        { status: 'Ngừng hoạt động', count: statusStats.inactive || 0, color: 'bg-red-500' }
      ]);

      // Recent system activity (from maintenance and incidents)
      const recentActivity = [
        ...maintenanceRecords.slice(0, 3).map(record => ({
          id: `maint_${record.id}`,
          type: 'maintenance',
          title: `Bảo trì ${record.equipmentName || 'thiết bị'}`,
          description: record.description || 'Bảo trì định kỳ',
          timestamp: record.createdAt || record.scheduledDate,
          status: record.status,
          user: record.assignedTo
        })),
        ...incidents.slice(0, 3).map(incident => ({
          id: `incident_${incident.id}`,
          type: 'incident',
          title: `Sự cố: ${incident.title || 'Báo cáo sự cố'}`,
          description: incident.description || 'Sự cố với thiết bị',
          timestamp: incident.reportedAt || incident.createdAt,
          status: incident.status,
          user: incident.reportedBy
        }))
      ].sort((a, b) => {
        const dateA = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
        const dateB = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
        return dateB - dateA;
      }).slice(0, 5);

      setRecentSystemActivity(recentActivity);

      // Critical alerts
      const alerts = [
        ...incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved').map(incident => ({
          id: `alert_incident_${incident.id}`,
          type: 'critical_incident',
          title: `Sự cố nghiêm trọng: ${incident.equipmentName || 'Thiết bị'}`,
          description: incident.description || 'Cần xử lý ngay',
          timestamp: incident.reportedAt || incident.createdAt,
          priority: 'high'
        })),
        ...maintenanceRecords.filter(m => {
          const scheduled = m.scheduledDate?.toDate?.() || new Date(m.scheduledDate || 0);
          const overdue = scheduled < new Date() && m.status !== 'completed';
          return overdue;
        }).map(maintenance => ({
          id: `alert_maintenance_${maintenance.id}`,
          type: 'overdue_maintenance', 
          title: `Bảo trì quá hạn: ${maintenance.equipmentName || 'Thiết bị'}`,
          description: 'Cần thực hiện bảo trì ngay',
          timestamp: maintenance.scheduledDate,
          priority: 'medium'
        }))
      ].sort((a, b) => {
        const dateA = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
        const dateB = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
        return dateB - dateA;
      }).slice(0, 5);

      setCriticalAlerts(alerts);

      // No fake system health metrics

    } catch (error) {
      console.error('Lỗi tải dữ liệu admin:', error);
      showError('Không thể tải dữ liệu dashboard admin');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'Không xác định';
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'completed': 'text-green-600 bg-green-100',
      'in_progress': 'text-blue-600 bg-blue-100',
      'pending': 'text-yellow-600 bg-yellow-100',
      'scheduled': 'text-blue-600 bg-blue-100',
      'reported': 'text-orange-600 bg-orange-100',
      'investigating': 'text-blue-600 bg-blue-100',
      'resolved': 'text-green-600 bg-green-100',
      'cancelled': 'text-gray-600 bg-gray-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };


  if (loading) {
    return <LoadingSpinner className="py-8" size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Admin Dashboard</h2>
              <p className="text-blue-100">Quản trị hệ thống toàn diện - {userProfile?.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAdminData}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng người dùng</p>
              <p className="text-2xl font-bold text-gray-900">{adminStats.totalUsers}</p>
              <p className="text-xs text-green-600">{adminStats.activeUsers} hoạt động</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng thiết bị</p>
              <p className="text-2xl font-bold text-gray-900">{adminStats.totalEquipment}</p>
              <p className="text-xs text-yellow-600">{adminStats.equipmentInMaintenance} đang bảo trì</p>
            </div>
            <Settings className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bảo trì & Sự cố</p>
              <p className="text-2xl font-bold text-gray-900">
                {adminStats.totalMaintenanceRecords + adminStats.totalIncidents}
              </p>
              <p className="text-xs text-red-600">{adminStats.pendingIncidents} đang chờ</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Uptime hệ thống</p>
              <p className="text-2xl font-bold text-gray-900">{adminStats.systemUptime}%</p>
              <p className="text-xs text-green-600">Ổn định</p>
            </div>
            <Database className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Alerts Widget */}
      <AlertsWidget maxAlerts={5} />

      {/* Analytics and System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Role Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-500" />
            Phân bổ vai trò người dùng
          </h3>
          <div className="space-y-4">
            {userRoleDistribution.map(item => (
              <div key={item.role} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                  <span className="font-medium text-gray-900">{item.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">{item.count}</span>
                  <span className="text-sm text-gray-500">người</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Equipment Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-500" />
            Trạng thái thiết bị
          </h3>
          <div className="space-y-4">
            {equipmentStatusStats.map(item => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                  <span className="font-medium text-gray-900">{item.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">{item.count}</span>
                  <span className="text-sm text-gray-500">thiết bị</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent System Activity */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-500" />
          Hoạt động hệ thống gần đây
        </h3>
        <div className="space-y-4">
          {recentSystemActivity.map(activity => (
            <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                activity.type === 'maintenance' ? 'bg-blue-100' : 'bg-orange-100'
              }`}>
                {activity.type === 'maintenance' ? 
                  <Settings className="w-4 h-4 text-blue-600" /> :
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                }
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-xs text-gray-500">{activity.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </span>
                  <span className="text-xs text-gray-400">{formatDateTime(activity.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Dashboard cho Manager - sử dụng ManagerDashboard chuyên biệt
const ManagerDashboardWrapper = () => <ManagerDashboard />;

// Dashboard cho Technician - sử dụng TechnicianTaskDashboard chuyên biệt
const TechnicianDashboard = () => <TechnicianTaskDashboard />;

// Dashboard cho User - sử dụng UserDashboard chuyên biệt
const UserDashboardWrapper = () => <UserDashboard />;

// Dashboard cho Receptionist
const ReceptionistDashboard = () => {
  const { userProfile } = useAuth();
  const { showError } = useNotification();
  const [stats, setStats] = useState({
    totalEquipment: 0,
    pendingIncidents: 0,
    processingIncidents: 0,
    resolvedIncidents: 0
  });
  const [branchInfo, setBranchInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userProfile]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (userProfile?.assignedBranchId) {
        // Load branch info
        const branch = await branchService.getBranchByIdSilent(userProfile.assignedBranchId);
        setBranchInfo(branch);

        // Load equipment of branch
        const allEquipment = await equipmentService.getAllEquipment();
        const branchEquipment = allEquipment.filter(eq => eq.branchId === userProfile.assignedBranchId);

        // Load incidents
        const incidents = await trackingService.getMyBranchIncidents();

        setStats({
          totalEquipment: branchEquipment.length,
          pendingIncidents: incidents.filter(i => i.status === 'reported').length,
          processingIncidents: incidents.filter(i => i.status === 'investigating').length,
          resolvedIncidents: incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length
        });
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner className="py-8" size="lg" />;
  }

  if (!userProfile?.assignedBranchId) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Chưa được phân công chi nhánh</h2>
        <p className="text-gray-600">
          Vui lòng liên hệ quản trị viên để được phân công vào chi nhánh làm việc.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Xin chào, {userProfile?.fullName}</h2>
            <p className="text-teal-100">
              Lễ tân chi nhánh: {branchInfo?.name || 'Đang tải...'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Thiết bị chi nhánh</p>
              <p className="text-2xl font-bold text-blue-700">{stats.totalEquipment}</p>
            </div>
            <Package className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Chờ xử lý</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.pendingIncidents}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600">Đang xử lý</p>
              <p className="text-2xl font-bold text-orange-700">{stats.processingIncidents}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-400" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Đã giải quyết</p>
              <p className="text-2xl font-bold text-green-700">{stats.resolvedIncidents}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/receptionist-incidents"
            className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-medium text-red-800">Báo cáo sự cố</p>
              <p className="text-sm text-red-600">Tạo báo cáo khi phát hiện vấn đề thiết bị</p>
            </div>
          </Link>

          <Link
            to="/receptionist-incidents"
            className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Package className="w-6 h-6 text-blue-600" />
            <div>
              <p className="font-medium text-blue-800">Xem thiết bị chi nhánh</p>
              <p className="text-sm text-blue-600">Danh sách thiết bị tại chi nhánh của bạn</p>
            </div>
          </Link>

          <Link
            to="/scan"
            className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Eye className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Quét QR thiết bị</p>
              <p className="text-sm text-green-600">Tra cứu thông tin thiết bị nhanh</p>
            </div>
          </Link>

          <Link
            to="/profile"
            className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <UserIcon className="w-6 h-6 text-gray-600" />
            <div>
              <p className="font-medium text-gray-800">Thông tin cá nhân</p>
              <p className="text-sm text-gray-600">Xem và cập nhật thông tin của bạn</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

// Component chính
const RoleDashboard = () => {
  const { userProfile } = useAuth();
  const userRole = userProfile?.role || 'user';

  switch (userRole) {
    case 'admin':
      return <AdminDashboard />;
    case 'manager':
      return <ManagerDashboardWrapper />;
    case 'technician':
      return <TechnicianDashboard />;
    case 'receptionist':
      return <ReceptionistDashboard />;
    case 'user':
    default:
      return <UserDashboardWrapper />;
  }
};

export default RoleDashboard;