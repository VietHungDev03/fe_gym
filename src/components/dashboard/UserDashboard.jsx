import { useState, useEffect } from 'react';
import {
  User as UserIcon, Activity, Clock, Calendar,
  MapPin, QrCode, AlertTriangle, Trophy,
  Target, TrendingUp, Dumbbell, Heart
} from 'lucide-react';
import { equipmentService } from '../../services/equipmentService';
import { trackingService } from '../../services/trackingService';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import AlertsWidget from './AlertsWidget';

const UserDashboard = () => {
  const [userStats, setUserStats] = useState({
    totalWorkouts: 0,
    totalDuration: 0,
    favoriteEquipment: '',
    streakDays: 0,
    thisWeekWorkouts: 0,
    thisMonthWorkouts: 0,
    averageWorkoutTime: 0
  });

  const [availableEquipment, setAvailableEquipment] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState('fitness');

  const { showError } = useNotification();
  const { userProfile } = useAuth();

  useEffect(() => {
    loadUserData();
  }, [userProfile?.id]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Load available equipment
      const allEquipment = await equipmentService.getAllEquipment();
      const available = allEquipment.filter(eq => eq.status === 'active').slice(0, 6);
      setAvailableEquipment(available);

      // Load real user usage data
      if (userProfile?.id) {
        // Get all user's usage history
        const userUsagePromises = allEquipment.map(eq => 
          trackingService.getEquipmentUsageHistory(eq.id, 50)
        );
        
        const allUsageResults = await Promise.all(userUsagePromises);
        
        // Flatten and filter for current user
        const userUsageHistory = [];
        allEquipment.forEach((eq, index) => {
          const equipmentUsage = allUsageResults[index] || [];
          equipmentUsage.forEach(usage => {
            if (usage.userId === userProfile.id || usage.userId === userProfile.uid) {
              userUsageHistory.push({
                ...usage,
                equipmentName: eq.name,
                equipmentId: eq.id
              });
            }
          });
        });

        // Calculate real statistics
        const totalWorkouts = userUsageHistory.filter(u => u.status === 'completed').length;
        
        // Calculate total duration in hours
        let totalDurationMinutes = 0;
        userUsageHistory.forEach(usage => {
          if (usage.status === 'completed' && usage.startTime && usage.endTime) {
            const start = usage.startTime.toDate ? usage.startTime : new Date(usage.startTime);
            const end = usage.endTime.toDate ? usage.endTime : new Date(usage.endTime);
            totalDurationMinutes += Math.max(0, (end - start) / (1000 * 60));
          }
        });
        const totalDuration = Math.round(totalDurationMinutes / 60 * 10) / 10; // hours with 1 decimal

        // Calculate this week's workouts
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const thisWeekWorkouts = userUsageHistory.filter(usage => {
          const usageDate = usage.startTime?.toDate?.() || new Date(usage.startTime || 0);
          return usageDate >= oneWeekAgo && usage.status === 'completed';
        }).length;

        // Calculate this month's workouts
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
        const thisMonthWorkouts = userUsageHistory.filter(usage => {
          const usageDate = usage.startTime?.toDate?.() || new Date(usage.startTime || 0);
          return usageDate >= oneMonthAgo && usage.status === 'completed';
        }).length;

        // Calculate streak days (consecutive days with workouts)
        const sortedUsageDates = userUsageHistory
          .filter(u => u.status === 'completed')
          .map(u => {
            const date = u.startTime?.toDate?.() || new Date(u.startTime || 0);
            return date.toDateString();
          })
          .filter((date, index, arr) => arr.indexOf(date) === index) // unique dates
          .sort((a, b) => new Date(b) - new Date(a)); // newest first
        
        let streakDays = 0;
        let currentDate = new Date();
        for (const dateStr of sortedUsageDates) {
          const usageDate = new Date(dateStr);
          const diffDays = Math.floor((currentDate - usageDate) / (1000 * 60 * 60 * 24));
          if (diffDays === streakDays || (streakDays === 0 && diffDays <= 1)) {
            streakDays++;
            currentDate = usageDate;
          } else {
            break;
          }
        }

        // Calculate average workout time in minutes
        const averageWorkoutTime = totalWorkouts > 0 
          ? Math.round(totalDurationMinutes / totalWorkouts) 
          : 0;

        // Find favorite equipment (most used)
        const equipmentUsageCount = {};
        userUsageHistory.forEach(usage => {
          if (usage.status === 'completed') {
            equipmentUsageCount[usage.equipmentName] = (equipmentUsageCount[usage.equipmentName] || 0) + 1;
          }
        });
        
        const favoriteEquipment = Object.keys(equipmentUsageCount).length > 0
          ? Object.entries(equipmentUsageCount)
              .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Chưa có'
          : 'Chưa có';

        setUserStats({
          totalWorkouts,
          totalDuration,
          favoriteEquipment,
          streakDays,
          thisWeekWorkouts,
          thisMonthWorkouts,
          averageWorkoutTime
        });

        // Set recent activity from real data
        const recentActivities = userUsageHistory
          .filter(u => u.status === 'completed')
          .sort((a, b) => {
            const dateA = a.startTime?.toDate?.() || new Date(a.startTime || 0);
            const dateB = b.startTime?.toDate?.() || new Date(b.startTime || 0);
            return dateB - dateA;
          })
          .slice(0, 4)
          .map(usage => {
            const startTime = usage.startTime?.toDate?.() || new Date(usage.startTime || 0);
            const endTime = usage.endTime?.toDate?.() || new Date(usage.endTime || 0);
            const duration = Math.round((endTime - startTime) / (1000 * 60)); // minutes
            const timeAgo = getTimeAgo(startTime);
            
            return {
              id: usage.id || Math.random().toString(),
              equipment: usage.equipmentName,
              duration: `${duration} phút`,
              time: timeAgo,
              type: usage.equipmentName?.toLowerCase().includes('chạy') || 
                    usage.equipmentName?.toLowerCase().includes('đạp') ? 'cardio' : 'strength'
            };
          });
        
        setRecentActivity(recentActivities);
      } else {
        // No user logged in, set empty stats
        setUserStats({
          totalWorkouts: 0,
          totalDuration: 0,
          favoriteEquipment: 'Chưa có',
          streakDays: 0,
          thisWeekWorkouts: 0,
          thisMonthWorkouts: 0,
          averageWorkoutTime: 0
        });
        setRecentActivity([]);
      }


    } catch (error) {
      console.error('Lỗi tải dữ liệu người dùng:', error);
      showError('Không thể tải dữ liệu cá nhân');
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Không xác định';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) {
      if (diffHours === 0) return 'Vừa xong';
      return `${diffHours} giờ trước`;
    }
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const getEquipmentIcon = (equipmentName) => {
    if (equipmentName.toLowerCase().includes('chạy') || equipmentName.toLowerCase().includes('đạp')) {
      return Heart;
    }
    return Dumbbell;
  };

  const getActivityIcon = (type) => {
    return type === 'cardio' ? Heart : Dumbbell;
  };

  const goals = [
    { id: 'fitness', name: 'Tăng cường sức khỏe', target: '3 lần/tuần', current: userStats.thisWeekWorkouts, icon: Heart, color: 'text-red-500' },
    { id: 'strength', name: 'Tăng cường sức mạnh', target: '4 lần/tuần', current: Math.floor(userStats.thisWeekWorkouts * 0.7), icon: Dumbbell, color: 'text-blue-500' },
    { id: 'endurance', name: 'Tăng sức bền', target: '60 phút/ngày', current: userStats.averageWorkoutTime, icon: Activity, color: 'text-green-500' }
  ];

  if (loading) {
    return <LoadingSpinner className="py-8" size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3">
          <UserIcon className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Chào mừng {userProfile?.fullName}!</h2>
            <p className="text-green-100">Hôm nay bạn đã tập {userStats.thisWeekWorkouts > 0 ? 'rồi' : 'chưa'}. Hãy duy trì lịch tập luyện nhé!</p>
          </div>
        </div>
      </div>

      {/* Personal Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{userStats.totalWorkouts}</p>
            <p className="text-sm text-gray-600">Tổng buổi tập</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{userStats.totalDuration}h</p>
            <p className="text-sm text-gray-600">Tổng thời gian</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Trophy className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{userStats.streakDays}</p>
            <p className="text-sm text-gray-600">Ngày liên tiếp</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{userStats.thisWeekWorkouts}</p>
            <p className="text-sm text-gray-600">Tuần này</p>
          </div>
        </div>
      </div>

      {/* Alerts Widget */}
      <AlertsWidget maxAlerts={5} />

      {/* Goals Progress */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-green-500" />
          Mục tiêu của bạn
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {goals.map(goal => {
            const Icon = goal.icon;
            const progress = goal.id === 'endurance' 
              ? Math.min((goal.current / 60) * 100, 100)
              : Math.min((goal.current / parseInt(goal.target)) * 100, 100);
            
            return (
              <div key={goal.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-5 h-5 ${goal.color}`} />
                  <span className="font-medium text-gray-900">{goal.name}</span>
                </div>
                
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {goal.id === 'endurance' ? `${goal.current} phút` : `${goal.current} lần`}
                  </span>
                  <span className="text-gray-500">Mục tiêu: {goal.target}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Equipment and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Equipment */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-blue-500" />
            Thiết bị có sẵn
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {availableEquipment.map(equipment => {
              const Icon = getEquipmentIcon(equipment.name);
              return (
                <div key={equipment.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">{equipment.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600">Có sẵn</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <button className="w-full mt-4 py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
            <QrCode className="w-4 h-4" />
            Quét QR để sử dụng
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-500" />
            Hoạt động gần đây
          </h3>
          
          <div className="space-y-3">
            {recentActivity.map(activity => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Icon className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.equipment}</p>
                    <p className="text-xs text-gray-500">Thời gian: {activity.duration}</p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
          
          {recentActivity.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Chưa có hoạt động nào</p>
              <p className="text-xs text-gray-400 mt-1">Hãy bắt đầu buổi tập đầu tiên!</p>
            </div>
          )}
        </div>
      </div>


      {/* Tips and Motivation */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Trophy className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Mẹo tập luyện hôm nay</h3>
            <p className="text-sm text-gray-600">Thiết bị yêu thích của bạn: {userStats.favoriteEquipment}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            🏃‍♀️ <strong>Khởi động:</strong> Luôn khởi động 5-10 phút trước khi tập luyện để tránh chấn thương.<br/>
            💧 <strong>Hydration:</strong> Uống đủ nước trước, trong và sau khi tập.<br/>
            📈 <strong>Tiến độ:</strong> Ghi nhận tiến độ hàng ngày để theo dõi sự phát triển của bản thân.<br/>
            🎯 <strong>Mục tiêu:</strong> Đặt mục tiêu nhỏ và khả thi để duy trì động lực tập luyện.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;