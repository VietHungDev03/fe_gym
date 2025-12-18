import { useState, useEffect } from 'react';
import { 
  Activity, Calendar, Clock, Target, 
  TrendingUp, Award, Dumbbell, Heart, Trophy 
} from 'lucide-react';
import { trackingService } from '../services/trackingService';
import { equipmentService } from '../services/equipmentService';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const MyActivityPage = () => {
  const [myActivities, setMyActivities] = useState([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalDuration: 0,
    thisWeekSessions: 0,
    favoriteEquipment: ''
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');

  const { showError } = useNotification();
  const { userProfile } = useAuth();

  useEffect(() => {
    loadMyActivity();
  }, [selectedPeriod, userProfile?.id]);

  const loadMyActivity = async () => {
    try {
      setLoading(true);

      if (!userProfile?.id) {
        setMyActivities([]);
        setStats({
          totalSessions: 0,
          totalDuration: 0,
          thisWeekSessions: 0,
          favoriteEquipment: 'Chưa có'
        });
        return;
      }

      // Load real equipment data and user's usage history
      const allEquipment = await equipmentService.getAllEquipment();
      
      // Get all user's usage history from all equipment
      const userUsagePromises = allEquipment.map(eq => 
        trackingService.getEquipmentUsageHistory(eq.id, 100)
      );
      
      const allUsageResults = await Promise.all(userUsagePromises);
      
      // Flatten and filter for current user
      const userActivities = [];
      allEquipment.forEach((eq, index) => {
        const equipmentUsage = allUsageResults[index] || [];
        equipmentUsage.forEach(usage => {
          if ((usage.userId === userProfile.id || usage.userId === userProfile.uid) && usage.status === 'completed') {
            userActivities.push({
              id: usage.id || Math.random().toString(),
              equipmentId: eq.id,
              equipmentName: eq.name,
              startTime: usage.startTime?.toDate?.() || new Date(usage.startTime || 0),
              endTime: usage.endTime?.toDate?.() || new Date(usage.endTime || 0),
              duration: calculateDuration(usage.startTime, usage.endTime),
              type: getEquipmentType(eq.name),
              calories: calculateCalories(calculateDuration(usage.startTime, usage.endTime), getEquipmentType(eq.name)),
              notes: usage.notes
            });
          }
        });
      });

      // Filter by selected period
      const filteredActivities = filterByPeriod(userActivities, selectedPeriod);
      
      // Calculate stats
      const totalSessions = filteredActivities.length;
      const totalDuration = filteredActivities.reduce((sum, activity) => sum + activity.duration, 0);
      const thisWeekSessions = filteredActivities.filter(activity => {
        const activityDate = new Date(activity.startTime);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return activityDate >= weekAgo;
      }).length;

      // Find favorite equipment
      const equipmentCount = {};
      filteredActivities.forEach(activity => {
        equipmentCount[activity.equipmentName] = (equipmentCount[activity.equipmentName] || 0) + 1;
      });
      const favoriteEquipment = Object.keys(equipmentCount).length > 0 
        ? Object.keys(equipmentCount).reduce((a, b) => equipmentCount[a] > equipmentCount[b] ? a : b)
        : 'Chưa có';

      setStats({
        totalSessions,
        totalDuration,
        thisWeekSessions,
        favoriteEquipment
      });

      setMyActivities(filteredActivities.sort((a, b) => b.startTime - a.startTime));

    } catch (error) {
      console.error('Lỗi tải hoạt động cá nhân:', error);
      showError('Không thể tải dữ liệu hoạt động');
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    
    const start = startTime?.toDate?.() || new Date(startTime);
    const end = endTime?.toDate?.() || new Date(endTime);
    
    const diffMs = end - start;
    return Math.max(0, Math.round(diffMs / (1000 * 60))); // minutes
  };

  const getEquipmentType = (equipmentName) => {
    const name = equipmentName.toLowerCase();
    if (name.includes('chạy') || name.includes('đạp') || name.includes('cardio')) {
      return 'cardio';
    }
    return 'strength';
  };

  const calculateCalories = (durationMinutes, type) => {
    // Rough calorie calculation based on activity type and duration
    const baseCaloriesPerMinute = type === 'cardio' ? 8 : 6;
    return Math.round(durationMinutes * baseCaloriesPerMinute);
  };

  const filterByPeriod = (activities, period) => {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'thisWeek':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        return activities.filter(activity => {
          const activityDate = new Date(activity.startTime);
          return activityDate >= startDate && activityDate <= endDate;
        });
      case 'last3Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return activities.filter(activity => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate;
    });
  };

  const formatDateTime = (date) => {
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type) => {
    return type === 'cardio' ? Heart : Dumbbell;
  };

  const getActivityColor = (type) => {
    return type === 'cardio' ? 'text-red-500 bg-red-100' : 'text-blue-500 bg-blue-100';
  };

  if (loading) {
    return <LoadingSpinner className="py-8" size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">
            Hoạt động của tôi
          </h1>
          <p className="text-secondary mt-1">
            Theo dõi lịch sử tập luyện và tiến độ cá nhân
          </p>
        </div>
        
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="thisWeek">Tuần này</option>
          <option value="thisMonth">Tháng này</option>
          <option value="lastMonth">Tháng trước</option>
          <option value="last3Months">3 tháng gần nhất</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng buổi tập</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng thời gian</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDuration}m</p>
            </div>
            <Clock className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tuần này</p>
              <p className="text-2xl font-bold text-gray-900">{stats.thisWeekSessions}</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">TB mỗi buổi</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalSessions > 0 ? Math.round(stats.totalDuration / stats.totalSessions) : 0}m
              </p>
            </div>
            <Target className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          Tiến độ tập luyện
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Thiết bị yêu thích</h4>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{stats.favoriteEquipment}</p>
                  <p className="text-sm text-gray-500">Sử dụng nhiều nhất</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Mục tiêu tuần</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Buổi tập (3 buổi/tuần)</span>
                  <span>{stats.thisWeekSessions}/3</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min((stats.thisWeekSessions / 3) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity History */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          Lịch sử hoạt động
        </h3>
        
        {myActivities.length > 0 ? (
          <div className="space-y-4">
            {myActivities.map(activity => {
              const Icon = getActivityIcon(activity.type);
              const colorClass = getActivityColor(activity.type);
              
              return (
                <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{activity.equipmentName}</h4>
                      <p className="text-sm text-gray-500">{formatDateTime(activity.startTime)}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Thời gian</p>
                        <p className="font-medium text-gray-900">{activity.duration} phút</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Calories</p>
                        <p className="font-medium text-gray-900">{activity.calories}</p>
                      </div>
                      <div className="text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          activity.type === 'cardio' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {activity.type === 'cardio' ? 'Cardio' : 'Tăng cường'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Chưa có hoạt động nào</h3>
            <p className="text-sm text-gray-500 mt-1">
              Bắt đầu tập luyện để theo dõi tiến độ của bạn
            </p>
          </div>
        )}
      </div>

      {/* Motivation Section */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1">Tiếp tục phấn đấu!</h3>
            <p className="text-green-100">
              Bạn đã hoàn thành {stats.totalSessions} buổi tập. 
              {stats.thisWeekSessions >= 3 
                ? ' Xuất sắc! Bạn đã đạt mục tiêu tuần này.' 
                : ` Chỉ cần thêm ${3 - stats.thisWeekSessions} buổi tập nữa để hoàn thành mục tiêu tuần.`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyActivityPage;