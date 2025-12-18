import { useState, useEffect } from 'react';
import {
  Users, Settings, TrendingUp, CheckCircle,
  AlertTriangle, Clock, FileText, UserCheck,
  Calendar, Award, Target, Activity
} from 'lucide-react';
import { trackingService } from '../../services/trackingService';
import { userService } from '../../services/userService';
import { equipmentService } from '../../services/equipmentService';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import AlertsWidget from './AlertsWidget';

const ManagerDashboard = () => {
  const [stats, setStats] = useState({
    totalTechnicians: 0,
    activeTasks: 0,
    completedThisMonth: 0,
    pendingApprovals: 0,
    totalEquipment: 0,
    maintenanceOverdue: 0,
    incidentsPending: 0,
    teamEfficiency: 0
  });

  const [teamPerformance, setTeamPerformance] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const { showError } = useNotification();
  const { userProfile } = useAuth();

  useEffect(() => {
    loadManagerData();
  }, []);

  const loadManagerData = async () => {
    try {
      setLoading(true);

      // Load users data
      const allUsers = await userService.getAllUsers();
      const technicians = allUsers.filter(user => user.role === 'technician');

      // Load equipment data
      const allEquipment = await equipmentService.getAllEquipment();

      // Load maintenance and incidents data
      const maintenanceRecords = await trackingService.getMaintenanceRecords();
      const incidents = await trackingService.getIncidentReports();

      // Calculate team performance
      const teamPerf = technicians.map(tech => {
        const assignedMaintenance = maintenanceRecords.filter(record => 
          record.assignedTo === tech.id
        );
        const assignedIncidents = incidents.filter(incident => 
          incident.assignedTo === tech.id
        );

        const totalTasks = assignedMaintenance.length + assignedIncidents.length;
        const completedTasks = [
          ...assignedMaintenance.filter(r => r.status === 'completed'),
          ...assignedIncidents.filter(i => ['resolved', 'closed'].includes(i.status))
        ].length;

        const efficiency = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

        return {
          id: tech.id,
          name: tech.fullName,
          role: tech.role,
          totalTasks,
          completedTasks,
          efficiency,
          status: totalTasks > 15 ? 'overloaded' : totalTasks > 8 ? 'busy' : 'available'
        };
      });

      // Calculate stats
      const activeTasks = maintenanceRecords.filter(r => 
        ['scheduled', 'in-progress'].includes(r.status)
      ).length + incidents.filter(i => 
        ['reported', 'investigating'].includes(i.status)
      ).length;

      const completedThisMonth = maintenanceRecords.filter(r => {
        if (r.status !== 'completed' || !r.actualDate) return false;
        const completedDate = r.actualDate.toDate ? r.actualDate : new Date(r.actualDate);
        const thisMonth = new Date();
        return completedDate.getMonth() === thisMonth.getMonth() &&
               completedDate.getFullYear() === thisMonth.getFullYear();
      }).length;

      const maintenanceOverdue = maintenanceRecords.filter(r => {
        if (r.status === 'completed') return false;
        const scheduledDate = r.scheduledDate?.toDate ? r.scheduledDate : new Date(r.scheduledDate);
        return scheduledDate < new Date();
      }).length;

      const incidentsPending = incidents.filter(i => i.status === 'reported').length;
      
      // Calculate pending approvals - maintenance records waiting for approval
      const pendingApprovals = maintenanceRecords.filter(r => r.status === 'pending').length + 
                              incidents.filter(i => i.status === 'reported').length;

      const teamEfficiency = teamPerf.length > 0 
        ? Math.round(teamPerf.reduce((sum, t) => sum + t.efficiency, 0) / teamPerf.length)
        : 0;

      setStats({
        totalTechnicians: technicians.length,
        activeTasks,
        completedThisMonth,
        pendingApprovals,
        totalEquipment: allEquipment.length,
        maintenanceOverdue,
        incidentsPending,
        teamEfficiency
      });

      setTeamPerformance(teamPerf.sort((a, b) => b.efficiency - a.efficiency));

      // Generate recent activities from real data
      const recentMaintenanceActivities = maintenanceRecords
        .filter(r => r.updatedAt || r.createdAt)
        .sort((a, b) => {
          const dateA = (a.updatedAt || a.createdAt)?.toDate?.() || new Date(a.updatedAt || a.createdAt || 0);
          const dateB = (b.updatedAt || b.createdAt)?.toDate?.() || new Date(b.updatedAt || b.createdAt || 0);
          return dateB - dateA;
        })
        .slice(0, 3)
        .map(r => {
          const assignedUser = technicians.find(t => t.id === r.assignedTo);
          const actionMap = {
            'completed': 'hoàn thành bảo trì',
            'in-progress': 'bắt đầu bảo trì', 
            'scheduled': 'được gán bảo trì'
          };
          const timestamp = r.updatedAt || r.createdAt;
          const timeAgo = getTimeAgo(timestamp);
          
          return {
            id: `maint_${r.id}`,
            user: assignedUser?.fullName || 'Nhân viên',
            action: actionMap[r.status] || 'cập nhật bảo trì',
            item: r.equipmentName || 'thiết bị',
            time: timeAgo,
            timestamp: timestamp
          };
        });

      const recentIncidentActivities = incidents
        .filter(i => i.reportedAt || i.createdAt)
        .sort((a, b) => {
          const dateA = (a.reportedAt || a.createdAt)?.toDate?.() || new Date(a.reportedAt || a.createdAt || 0);
          const dateB = (b.reportedAt || b.createdAt)?.toDate?.() || new Date(b.reportedAt || b.createdAt || 0);
          return dateB - dateA;
        })
        .slice(0, 2)
        .map(i => {
          const reportedUser = allUsers.find(u => u.id === i.reportedBy);
          const actionMap = {
            'resolved': 'giải quyết sự cố',
            'investigating': 'điều tra sự cố',
            'reported': 'báo cáo sự cố'
          };
          const timestamp = i.reportedAt || i.createdAt;
          const timeAgo = getTimeAgo(timestamp);
          
          return {
            id: `incident_${i.id}`,
            user: reportedUser?.fullName || 'Người dùng',
            action: actionMap[i.status] || 'báo cáo sự cố',
            item: i.equipmentName || 'thiết bị',
            time: timeAgo,
            timestamp: timestamp
          };
        });

      // Combine and sort all activities by timestamp
      const allActivities = [...recentMaintenanceActivities, ...recentIncidentActivities]
        .sort((a, b) => {
          const dateA = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
          const dateB = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
          return dateB - dateA;
        })
        .slice(0, 4);

      setRecentActivities(allActivities);

      // Generate upcoming tasks
      const upcoming = maintenanceRecords
        .filter(r => r.status === 'scheduled')
        .slice(0, 5)
        .map(r => ({
          id: r.id,
          title: `Bảo trì ${r.equipmentName || 'thiết bị'}`,
          assignedTo: technicians.find(t => t.id === r.assignedTo)?.fullName || 'Chưa gán',
          dueDate: r.scheduledDate,
          priority: r.priority || 'medium'
        }));

      setUpcomingTasks(upcoming);

    } catch (error) {
      console.error('Lỗi tải dữ liệu manager:', error);
      showError('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Không xác định';
    const date = timestamp.toDate ? timestamp : new Date(timestamp);
    return date.toLocaleDateString('vi-VN');
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Không xác định';
    const date = timestamp.toDate ? timestamp : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'text-green-600 bg-green-100',
      busy: 'text-yellow-600 bg-yellow-100', 
      overloaded: 'text-red-600 bg-red-100'
    };
    return colors[status] || colors.available;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[priority] || colors.medium;
  };

  if (loading) {
    return <LoadingSpinner className="py-8" size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Dashboard Quản lý</h2>
            <p className="text-purple-100">Chào mừng {userProfile?.fullName}, hôm nay bạn có {stats.activeTasks} nhiệm vụ đang chờ xử lý</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Nhân viên kỹ thuật</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTechnicians}</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Nhiệm vụ đang thực hiện</p>
              <p className="text-2xl font-bold text-blue-700">{stats.activeTasks}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Hoàn thành tháng này</p>
              <p className="text-2xl font-bold text-green-700">{stats.completedThisMonth}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Cần phê duyệt</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.pendingApprovals}</p>
            </div>
            <FileText className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Hiệu suất team</h3>
            <Target className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.teamEfficiency}%</div>
            <p className="text-sm text-gray-500 mt-1">Tỷ lệ hoàn thành công việc</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Bảo trì quá hạn</h3>
            <Clock className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{stats.maintenanceOverdue}</div>
            <p className="text-sm text-gray-500 mt-1">Cần xử lý ngay</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sự cố chờ xử lý</h3>
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.incidentsPending}</div>
            <p className="text-sm text-gray-500 mt-1">Cần gán nhân viên</p>
          </div>
        </div>
      </div>

      {/* Alerts Widget */}
      <AlertsWidget maxAlerts={5} />

      {/* Team Performance and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Hiệu suất nhân viên</h3>
            <Award className="w-5 h-5 text-purple-500" />
          </div>
          <div className="space-y-4">
            {teamPerformance.slice(0, 5).map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.completedTasks}/{member.totalTasks} nhiệm vụ</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(member.status)}`}>
                    {member.status === 'available' ? 'Sẵn sàng' :
                     member.status === 'busy' ? 'Bận' : 'Quá tải'}
                  </span>
                  <span className="font-bold text-purple-600">{member.efficiency}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Hoạt động gần đây</h3>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-4">
            {recentActivities.map(activity => (
              <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span> {activity.action} <span className="font-medium">{activity.item}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Nhiệm vụ sắp tới</h3>
          <Calendar className="w-5 h-5 text-green-500" />
        </div>
        
        {upcomingTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Nhiệm vụ</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Được gán cho</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Ngày thực hiện</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Ưu tiên</th>
                </tr>
              </thead>
              <tbody>
                {upcomingTasks.map(task => (
                  <tr key={task.id} className="border-b border-gray-100">
                    <td className="py-3 text-sm text-gray-900">{task.title}</td>
                    <td className="py-3 text-sm text-gray-600">{task.assignedTo}</td>
                    <td className="py-3 text-sm text-gray-600">{formatDate(task.dueDate)}</td>
                    <td className="py-3">
                      <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority === 'critical' ? 'Khẩn cấp' :
                         task.priority === 'high' ? 'Cao' :
                         task.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Không có nhiệm vụ nào sắp tới</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default ManagerDashboard;