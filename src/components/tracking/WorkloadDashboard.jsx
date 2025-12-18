import { useState, useEffect } from 'react';
import { 
  BarChart3, User, Clock, TrendingUp, Award,
  AlertTriangle, CheckCircle, Calendar, Users
} from 'lucide-react';
import { trackingService } from '../../services/trackingService';
import { userService } from '../../services/userService';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../ui/LoadingSpinner';

const WorkloadDashboard = () => {
  const [workloadData, setWorkloadData] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');

  const { showError } = useNotification();

  useEffect(() => {
    loadWorkloadData();
  }, [selectedPeriod]);

  const loadWorkloadData = async () => {
    try {
      setLoading(true);
      
      // Load technicians
      const allUsers = await userService.getAllUsers();
      const techUsers = allUsers.filter(user => 
        ['technician', 'manager', 'admin'].includes(user.role)
      );
      setTechnicians(techUsers);

      // Load maintenance và incidents
      const maintenanceRecords = await trackingService.getMaintenanceRecords();
      const incidents = await trackingService.getIncidentReports();

      // Calculate workload for each technician
      const workloads = techUsers.map(tech => {
        const assignedMaintenance = maintenanceRecords.filter(record => 
          record.assignedTo === tech.id
        );
        
        const assignedIncidents = incidents.filter(incident => 
          incident.assignedTo === tech.id || incident.investigator === tech.id
        );

        const totalTasks = assignedMaintenance.length + assignedIncidents.length;
        const completedTasks = [
          ...assignedMaintenance.filter(r => r.status === 'completed'),
          ...assignedIncidents.filter(i => ['resolved', 'closed'].includes(i.status))
        ].length;
        
        const pendingTasks = [
          ...assignedMaintenance.filter(r => r.status === 'pending'),
          ...assignedIncidents.filter(i => i.status === 'reported')
        ].length;
        
        const inProgressTasks = [
          ...assignedMaintenance.filter(r => r.status === 'in-progress'),
          ...assignedIncidents.filter(i => ['investigating', 'in-progress'].includes(i.status))
        ].length;

        // Calculate completion rate
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // Calculate average resolution time (mock data for now)
        const avgResolutionHours = Math.floor(Math.random() * 24) + 8; // 8-32 hours

        return {
          user: tech,
          totalTasks,
          completedTasks,
          pendingTasks,
          inProgressTasks,
          completionRate,
          avgResolutionHours,
          maintenanceCount: assignedMaintenance.length,
          incidentCount: assignedIncidents.length,
          // Performance score based on completion rate and speed
          performanceScore: Math.min(100, completionRate + (48 - avgResolutionHours))
        };
      });

      setWorkloadData(workloads.sort((a, b) => b.totalTasks - a.totalTasks));
    } catch (error) {
      console.error('Lỗi tải dữ liệu khối lượng công việc:', error);
      showError('Không thể tải dữ liệu khối lượng công việc');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getWorkloadLevel = (totalTasks) => {
    if (totalTasks >= 20) return { label: 'Cao', color: 'bg-red-500' };
    if (totalTasks >= 10) return { label: 'Trung bình', color: 'bg-yellow-500' };
    if (totalTasks >= 5) return { label: 'Thấp', color: 'bg-green-500' };
    return { label: 'Rất thấp', color: 'bg-blue-500' };
  };

  if (loading) {
    return <LoadingSpinner className="py-8" size="lg" />;
  }

  const totalTechnicians = technicians.length;
  const totalActiveTasks = workloadData.reduce((sum, w) => sum + w.inProgressTasks, 0);
  const totalCompletedTasks = workloadData.reduce((sum, w) => sum + w.completedTasks, 0);
  const avgCompletionRate = workloadData.length > 0 
    ? workloadData.reduce((sum, w) => sum + w.completionRate, 0) / workloadData.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-primary">
          Dashboard khối lượng công việc
        </h2>
        <p className="text-secondary mt-1">
          Theo dõi và phân tích khối lượng công việc của từng nhân viên kỹ thuật
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng nhân viên</p>
              <p className="text-2xl font-bold text-gray-900">{totalTechnicians}</p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Công việc đang thực hiện</p>
              <p className="text-2xl font-bold text-blue-700">{totalActiveTasks}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Đã hoàn thành</p>
              <p className="text-2xl font-bold text-green-700">{totalCompletedTasks}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">Tỷ lệ hoàn thành TB</p>
              <p className="text-2xl font-bold text-purple-700">{avgCompletionRate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Thời kỳ:</label>
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
      </div>

      {/* Workload Table */}
      <div className="card-standard overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Chi tiết khối lượng công việc
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhân viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng CV
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đang thực hiện
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hoàn thành
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tỷ lệ HT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian TB
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hiệu suất
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mức độ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workloadData.map((workload) => {
                const workloadLevel = getWorkloadLevel(workload.totalTasks);
                
                return (
                  <tr key={workload.user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {workload.user.fullName}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {workload.user.role}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{workload.totalTasks}</div>
                      <div className="text-xs text-gray-500">
                        {workload.maintenanceCount}BT + {workload.incidentCount}SC
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-blue-600 font-medium">{workload.inProgressTasks}</div>
                      {workload.pendingTasks > 0 && (
                        <div className="text-xs text-yellow-600">+{workload.pendingTasks} chờ</div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-green-600 font-medium">{workload.completedTasks}</div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${workload.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{workload.completionRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{workload.avgResolutionHours}h</div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(workload.performanceScore)}`}>
                        {workload.performanceScore.toFixed(0)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${workloadLevel.color}`}></div>
                        <span className="text-sm text-gray-900">{workloadLevel.label}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-standard">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Top Performers
          </h3>
          
          {workloadData
            .sort((a, b) => b.performanceScore - a.performanceScore)
            .slice(0, 3)
            .map((workload, index) => (
              <div key={workload.user.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{workload.user.fullName}</div>
                    <div className="text-sm text-gray-500">
                      {workload.completedTasks} hoàn thành, {workload.completionRate.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{workload.performanceScore.toFixed(0)}</div>
                  <div className="text-xs text-gray-500">điểm</div>
                </div>
              </div>
            ))
          }
        </div>

        <div className="card-standard">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Cần hỗ trợ
          </h3>
          
          {workloadData
            .filter(w => w.totalTasks >= 15 || w.completionRate < 50)
            .slice(0, 3)
            .map(workload => (
              <div key={workload.user.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div>
                  <div className="font-medium text-gray-900">{workload.user.fullName}</div>
                  <div className="text-sm text-red-600">
                    {workload.totalTasks >= 15 ? `Quá tải (${workload.totalTasks} CV)` : 
                     `Tỷ lệ thấp (${workload.completionRate.toFixed(1)}%)`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">{workload.inProgressTasks} đang làm</div>
                </div>
              </div>
            ))
          }
          
          {workloadData.filter(w => w.totalTasks >= 15 || w.completionRate < 50).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
              <p className="text-sm">Tất cả nhân viên đều làm việc hiệu quả</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkloadDashboard;