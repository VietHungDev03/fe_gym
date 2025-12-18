import { useState, useEffect } from 'react';
import { 
  Users, Activity, Clock, Calendar, TrendingUp, 
  Search, Filter, User, BarChart3, Award
} from 'lucide-react';
import { trackingService } from '../../services/trackingService';
import { userService } from '../../services/userService';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../ui/LoadingSpinner';

const UserActivityTracking = () => {
  const [userActivities, setUserActivities] = useState([]);
  const [gymUsers, setGymUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [sortBy, setSortBy] = useState('totalUsage');

  const { showError } = useNotification();

  useEffect(() => {
    loadUserActivities();
  }, [selectedPeriod]);

  const loadUserActivities = async () => {
    try {
      setLoading(true);
      
      // Load gym users (exclude technicians/admins)
      const allUsers = await userService.getAllUsers();
      const gymUsers = allUsers.filter(user => user.role === 'user');
      setGymUsers(gymUsers);

      // Load usage history
      const usageHistory = await trackingService.getEquipmentUsageHistory();
      
      // Calculate activity stats for each gym user
      const activities = gymUsers.map(user => {
        const userUsage = usageHistory.filter(usage => usage.userId === user.id);
        
        // Calculate total usage time (in hours)
        const totalUsageMinutes = userUsage.reduce((total, usage) => {
          if (usage.endTime && usage.startTime) {
            const start = usage.startTime.toDate ? usage.startTime : new Date(usage.startTime);
            const end = usage.endTime.toDate ? usage.endTime : new Date(usage.endTime);
            return total + (end - start) / (1000 * 60); // minutes
          }
          return total;
        }, 0);

        const totalUsageHours = totalUsageMinutes / 60;
        
        // Calculate frequency (sessions per period)
        const uniqueDays = new Set(
          userUsage.map(usage => {
            const date = usage.startTime.toDate ? usage.startTime : new Date(usage.startTime);
            return date.toDateString();
          })
        ).size;

        // Calculate average session time
        const avgSessionTime = userUsage.length > 0 ? totalUsageMinutes / userUsage.length : 0;
        
        // Get most used equipment
        const equipmentCount = {};
        userUsage.forEach(usage => {
          const equipment = usage.equipmentName || 'Unknown';
          equipmentCount[equipment] = (equipmentCount[equipment] || 0) + 1;
        });
        
        const favoriteEquipment = Object.entries(equipmentCount)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Chưa sử dụng';

        // Calculate activity score
        const activityScore = Math.min(100, 
          (userUsage.length * 2) + // 2 points per session
          (uniqueDays * 3) + // 3 points per unique day
          Math.min(20, totalUsageHours) // max 20 points for hours
        );

        // Determine activity level
        let activityLevel = 'Không hoạt động';
        let activityColor = 'bg-gray-500';
        
        if (activityScore >= 60) {
          activityLevel = 'Rất tích cực';
          activityColor = 'bg-green-500';
        } else if (activityScore >= 30) {
          activityLevel = 'Tích cực';
          activityColor = 'bg-blue-500';
        } else if (activityScore >= 10) {
          activityLevel = 'Ít hoạt động';
          activityColor = 'bg-yellow-500';
        } else if (activityScore > 0) {
          activityLevel = 'Rất ít';
          activityColor = 'bg-red-500';
        }

        return {
          user,
          totalSessions: userUsage.length,
          totalUsageHours: totalUsageHours,
          uniqueDays,
          avgSessionTime,
          favoriteEquipment,
          activityScore,
          activityLevel,
          activityColor,
          lastActivity: userUsage.length > 0 
            ? Math.max(...userUsage.map(u => {
                const date = u.startTime.toDate ? u.startTime : new Date(u.startTime);
                return date.getTime();
              }))
            : null
        };
      });

      setUserActivities(activities.sort((a, b) => {
        switch (sortBy) {
          case 'totalUsage':
            return b.totalUsageHours - a.totalUsageHours;
          case 'sessions':
            return b.totalSessions - a.totalSessions;
          case 'activityScore':
            return b.activityScore - a.activityScore;
          case 'lastActivity':
            return (b.lastActivity || 0) - (a.lastActivity || 0);
          default:
            return b.totalUsageHours - a.totalUsageHours;
        }
      }));

    } catch (error) {
      console.error('Lỗi tải dữ liệu hoạt động người dùng:', error);
      showError('Không thể tải dữ liệu hoạt động người dùng');
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = userActivities.filter(activity => 
    searchTerm === '' || 
    activity.user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDuration = (hours) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}p`;
    }
    return `${hours.toFixed(1)}h`;
  };

  const formatLastActivity = (timestamp) => {
    if (!timestamp) return 'Chưa bao giờ';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    return `${Math.floor(diffDays / 30)} tháng trước`;
  };

  if (loading) {
    return <LoadingSpinner className="py-8" size="lg" />;
  }

  const totalUsers = gymUsers.length;
  const activeUsers = userActivities.filter(a => a.totalSessions > 0).length;
  const totalSessions = userActivities.reduce((sum, a) => sum + a.totalSessions, 0);
  const totalUsageHours = userActivities.reduce((sum, a) => sum + a.totalUsageHours, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-primary">
          Theo dõi hoạt động người dùng
        </h2>
        <p className="text-secondary mt-1">
          Phân tích và theo dõi hoạt động sử dụng thiết bị của thành viên gym
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng thành viên</p>
              <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Thành viên tích cực</p>
              <p className="text-2xl font-bold text-green-700">{activeUsers}</p>
              <p className="text-xs text-green-600">{((activeUsers / totalUsers) * 100).toFixed(1)}%</p>
            </div>
            <Activity className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Tổng phiên tập</p>
              <p className="text-2xl font-bold text-blue-700">{totalSessions}</p>
              <p className="text-xs text-blue-600">TB: {(totalSessions / totalUsers).toFixed(1)}/người</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">Tổng thời gian</p>
              <p className="text-2xl font-bold text-purple-700">{formatDuration(totalUsageHours)}</p>
              <p className="text-xs text-purple-600">TB: {formatDuration(totalUsageHours / totalUsers)}/người</p>
            </div>
            <Clock className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-standard">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm thành viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="thisWeek">Tuần này</option>
            <option value="thisMonth">Tháng này</option>
            <option value="lastMonth">Tháng trước</option>
            <option value="thisQuarter">Quý này</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="totalUsage">Thời gian sử dụng</option>
            <option value="sessions">Số phiên tập</option>
            <option value="activityScore">Điểm hoạt động</option>
            <option value="lastActivity">Hoạt động gần nhất</option>
          </select>

          <div className="flex items-center px-3 py-2 bg-gray-50 rounded-md text-sm text-secondary">
            <span>Hiển thị: {filteredActivities.length}/{totalUsers}</span>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="card-standard overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thành viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phiên tập
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TB/phiên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thiết bị yêu thích
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hoạt động cuối
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mức độ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Điểm
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredActivities.map((activity) => (
                <tr key={activity.user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {activity.user.fullName || 'Chưa có tên'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {activity.user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{activity.totalSessions}</div>
                    <div className="text-xs text-gray-500">{activity.uniqueDays} ngày</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDuration(activity.totalUsageHours)}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {activity.totalSessions > 0 ? formatDuration(activity.avgSessionTime / 60) : '-'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 max-w-32 truncate">
                      {activity.favoriteEquipment}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatLastActivity(activity.lastActivity)}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${activity.activityColor}`}></div>
                      <span className="text-sm text-gray-900">{activity.activityLevel}</span>
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-blue-600">
                      {activity.activityScore.toFixed(0)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Active Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-standard">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Top Active Users
          </h3>
          
          {filteredActivities
            .filter(a => a.totalSessions > 0)
            .slice(0, 5)
            .map((activity, index) => (
              <div key={activity.user.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{activity.user.fullName || 'Chưa có tên'}</div>
                    <div className="text-sm text-gray-500">
                      {activity.totalSessions} phiên, {formatDuration(activity.totalUsageHours)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">{activity.activityScore.toFixed(0)}</div>
                  <div className="text-xs text-gray-500">điểm</div>
                </div>
              </div>
            ))
          }
        </div>

        <div className="card-standard">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Thống kê tổng quan
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tỷ lệ thành viên tích cực:</span>
              <span className="font-bold text-green-600">
                {((activeUsers / totalUsers) * 100).toFixed(1)}%
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Trung bình phiên/người:</span>
              <span className="font-bold text-blue-600">
                {(totalSessions / totalUsers).toFixed(1)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Thời gian TB/phiên:</span>
              <span className="font-bold text-purple-600">
                {totalSessions > 0 ? formatDuration((totalUsageHours * 60) / totalSessions / 60) : '0p'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Điểm hoạt động TB:</span>
              <span className="font-bold text-gray-900">
                {userActivities.length > 0 
                  ? (userActivities.reduce((sum, a) => sum + a.activityScore, 0) / userActivities.length).toFixed(1)
                  : '0'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {filteredActivities.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">
            Không tìm thấy thành viên nào
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {searchTerm ? 'Thử thay đổi từ khóa tìm kiếm' : 'Chưa có dữ liệu hoạt động'}
          </p>
        </div>
      )}
    </div>
  );
};

export default UserActivityTracking;