import { useState, useEffect } from 'react';
import {
  CheckCircle, Clock, AlertTriangle, Wrench,
  Calendar, User, MessageSquare, FileText,
  Play, Pause, CheckCircle2, X, Eye,
  MapPin, Camera, Settings, ArrowUpCircle
} from 'lucide-react';
import { trackingService } from '../../services/trackingService';
import { equipmentService } from '../../services/equipmentService';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import MaintenanceFeedbackModal from '../tracking/MaintenanceFeedbackModal';
import AlertsWidget from './AlertsWidget';

const TechnicianTaskDashboard = () => {
  const [myTasks, setMyTasks] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assigned'); // assigned, in-progress, completed
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);

  const { showError, showSuccess } = useNotification();
  const { userProfile } = useAuth();

  useEffect(() => {
    loadMyTasks();
  }, [userProfile?.id]);

  const loadMyTasks = async () => {
    try {
      setLoading(true);

      // Load equipment FIRST
      const equipment = await equipmentService.getAllEquipment();
      setEquipmentList(equipment);

      // Helper function to get equipment name from the loaded list
      const getEqName = (equipmentId) => {
        const eq = equipment.find(e => e.id === equipmentId);
        return eq?.name || 'Thiết bị không xác định';
      };

      // Load maintenance tasks assigned to me
      const maintenanceRecords = await trackingService.getMaintenanceRecords();
      const myMaintenance = maintenanceRecords.filter(record =>
        record.assignedTo === userProfile?.id
      );

      // Load incident reports assigned to me
      const incidents = await trackingService.getIncidentReports();
      const myIncidents = incidents.filter(incident =>
        incident.assignedTo === userProfile?.id ||
        incident.investigator === userProfile?.id
      );

      // Combine and format tasks
      const allTasks = [
        ...myMaintenance.map(record => ({
          id: record.id,
          type: 'maintenance',
          title: `Bảo trì: ${getEqName(record.equipmentId)}`,
          description: record.description,
          status: record.status,
          priority: record.priority || 'medium',
          scheduledDate: record.scheduledDate,
          equipmentId: record.equipmentId,
          equipmentName: getEqName(record.equipmentId),
          assignedBy: record.assignedBy,
          createdAt: record.createdAt,
          notes: record.notes || '',
          workLog: record.workLog || []
        })),
        ...myIncidents.map(incident => ({
          id: incident.id,
          type: 'incident',
          title: `Sự cố: ${getEqName(incident.equipmentId)}`,
          description: incident.description,
          status: incident.status,
          priority: incident.severity,
          scheduledDate: incident.reportedAt,
          equipmentId: incident.equipmentId,
          equipmentName: getEqName(incident.equipmentId),
          assignedBy: incident.reportedBy,
          createdAt: incident.reportedAt,
          notes: incident.resolution || '',
          workLog: []
        }))
      ];

      // Sort by priority and date
      allTasks.sort((a, b) => {
        // Priority order: critical > high > medium > low
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority] || 2;
        const bPriority = priorityOrder[b.priority] || 2;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        // Then by date
        const aDate = a.scheduledDate?.toDate?.() || new Date(a.scheduledDate || 0);
        const bDate = b.scheduledDate?.toDate?.() || new Date(b.scheduledDate || 0);
        return aDate - bDate;
      });

      setMyTasks(allTasks);
    } catch (error) {
      console.error('Lỗi tải công việc:', error);
      showError('Không thể tải danh sách công việc');
    } finally {
      setLoading(false);
    }
  };

  const getEquipmentName = (equipmentId) => {
    const equipment = equipmentList.find(eq => eq.id === equipmentId);
    return equipment?.name || 'Thiết bị không xác định';
  };

  const updateTaskStatus = async (taskId, newStatus, type, notes = '') => {
    try {
      if (type === 'maintenance') {
        const updateData = { notes };
        if (newStatus === 'completed') {
          updateData.completedBy = userProfile?.id;
          updateData.actualDate = new Date();
        }
        
        await trackingService.updateMaintenanceStatus(taskId, newStatus, updateData);
      } else if (type === 'incident') {
        await trackingService.updateIncidentStatus(taskId, newStatus, notes);
      }

      await loadMyTasks(); // Reload tasks
      showSuccess('Cập nhật trạng thái thành công');
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);
      showError('Không thể cập nhật trạng thái');
    }
  };

  const getFilteredTasks = () => {
    return myTasks.filter(task => {
      switch (activeTab) {
        case 'assigned':
          return ['scheduled', 'pending', 'reported'].includes(task.status);
        case 'in-progress':
          return ['in_progress', 'investigating'].includes(task.status);
        case 'completed':
          return ['completed', 'resolved', 'closed'].includes(task.status);
        default:
          return true;
      }
    });
  };

  const getPriorityBadge = (priority) => {
    const configs = {
      low: { label: 'Thấp', class: 'bg-green-100 text-green-800' },
      medium: { label: 'Trung bình', class: 'bg-yellow-100 text-yellow-800' },
      high: { label: 'Cao', class: 'bg-red-100 text-red-800' },
      critical: { label: 'Khẩn cấp', class: 'bg-red-200 text-red-900' }
    };
    
    const config = configs[priority] || configs.medium;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (status, type) => {
    const configs = {
      // Maintenance statuses
      scheduled: { label: 'Đã lên lịch', class: 'bg-blue-100 text-blue-800' },
      pending: { label: 'Chờ xử lý', class: 'bg-yellow-100 text-yellow-800' },
      in_progress: { label: 'Đang thực hiện', class: 'bg-purple-100 text-purple-800' },
      completed: { label: 'Hoàn thành', class: 'bg-green-100 text-green-800' },

      // Incident statuses
      reported: { label: 'Đã báo cáo', class: 'bg-orange-100 text-orange-800' },
      investigating: { label: 'Đang điều tra', class: 'bg-blue-100 text-blue-800' },
      resolved: { label: 'Đã giải quyết', class: 'bg-green-100 text-green-800' },
      closed: { label: 'Đã đóng', class: 'bg-gray-100 text-gray-800' }
    };

    const config = configs[status] || configs.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'Không xác định';
    
    const date = timestamp.toDate ? timestamp : new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStartTask = (task) => {
    const newStatus = task.type === 'maintenance' ? 'in_progress' : 'investigating';
    updateTaskStatus(task.id, newStatus, task.type);
  };

  const handleCompleteTask = (task) => {
    setSelectedTask(task);
    if (task.type === 'maintenance') {
      setShowFeedbackModal(true);
    } else {
      setShowStatusUpdateModal(true);
    }
  };

  const handleStatusUpdate = (notes) => {
    if (selectedTask) {
      const newStatus = selectedTask.type === 'maintenance' ? 'completed' : 'resolved';
      updateTaskStatus(selectedTask.id, newStatus, selectedTask.type, notes);
      setShowStatusUpdateModal(false);
      setSelectedTask(null);
    }
  };

  const handleFeedbackSuccess = () => {
    setShowFeedbackModal(false);
    setSelectedTask(null);
    loadMyTasks(); // Reload tasks
  };

  // Escalate incident to admin
  const handleEscalate = (task) => {
    setSelectedTask(task);
    setShowEscalateModal(true);
  };

  const submitEscalate = async (reason) => {
    if (!selectedTask || selectedTask.type !== 'incident') return;

    try {
      await trackingService.escalateIncident(selectedTask.id, reason);
      showSuccess('Đã chuyển sự cố lên Admin thành công');
      setShowEscalateModal(false);
      setSelectedTask(null);
      loadMyTasks();
    } catch (error) {
      console.error('Lỗi escalate:', error);
      showError(error.response?.data?.message || 'Không thể chuyển sự cố lên Admin');
    }
  };

  const filteredTasks = getFilteredTasks();
  const assignedCount = myTasks.filter(t => ['scheduled', 'pending', 'reported'].includes(t.status)).length;
  const inProgressCount = myTasks.filter(t => ['in_progress', 'investigating'].includes(t.status)).length;
  const completedCount = myTasks.filter(t => ['completed', 'resolved', 'closed'].includes(t.status)).length;

  if (loading) {
    return <LoadingSpinner className="py-8" size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-primary">
          Công việc của tôi
        </h2>
        <p className="text-secondary mt-1">
          Quản lý các nhiệm vụ bảo trì và xử lý sự cố được gán cho bạn
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Được gán</p>
              <p className="text-2xl font-bold text-yellow-700">{assignedCount}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Đang thực hiện</p>
              <p className="text-2xl font-bold text-blue-700">{inProgressCount}</p>
            </div>
            <Settings className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Hoàn thành</p>
              <p className="text-2xl font-bold text-green-700">{completedCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Alerts Widget */}
      <AlertsWidget maxAlerts={5} />

      {/* Tabs */}
      <div className="card-standard">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'assigned', label: 'Được gán', count: assignedCount },
            { id: 'in-progress', label: 'Đang làm', count: inProgressCount },
            { id: 'completed', label: 'Hoàn thành', count: completedCount }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div key={`${task.type}-${task.id}`} className="card-standard hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  task.type === 'maintenance' ? 'bg-blue-100' : 'bg-red-100'
                }`}>
                  {task.type === 'maintenance' ? (
                    <Wrench className="w-5 h-5 text-blue-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-primary">{task.title}</h3>
                  <p className="text-sm text-secondary flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {task.equipmentName}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-1 items-end">
                {getStatusBadge(task.status, task.type)}
                {getPriorityBadge(task.priority)}
              </div>
            </div>

            {task.description && (
              <p className="text-sm text-secondary mb-4 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center justify-between text-sm text-secondary mb-4">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDateTime(task.scheduledDate)}
                </span>
              </div>
            </div>

            {/* Task Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedTask(task);
                    setShowDetailModal(true);
                  }}
                  className="btn-secondary text-sm py-1 px-3 flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  Chi tiết
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Start Task Button */}
                {['scheduled', 'pending', 'reported'].includes(task.status) && (
                  <button
                    onClick={() => handleStartTask(task)}
                    className="btn-primary text-sm py-1 px-3 flex items-center gap-1"
                  >
                    <Play className="w-4 h-4" />
                    Bắt đầu
                  </button>
                )}

                {/* Escalate Button - chỉ cho incident đang investigating */}
                {task.type === 'incident' && task.status === 'investigating' && (
                  <button
                    onClick={() => handleEscalate(task)}
                    className="btn-warning text-sm py-1 px-3 flex items-center gap-1"
                    title="Chuyển sự cố lên Admin nếu không xử lý được"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    Chuyển Admin
                  </button>
                )}

                {/* Complete Task Button */}
                {['in_progress', 'investigating'].includes(task.status) && (
                  <button
                    onClick={() => handleCompleteTask(task)}
                    className="btn-success text-sm py-1 px-3 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Hoàn thành
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Settings className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                {activeTab === 'assigned' && 'Không có công việc mới'}
                {activeTab === 'in-progress' && 'Không có công việc đang thực hiện'}
                {activeTab === 'completed' && 'Chưa hoàn thành công việc nào'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {activeTab === 'assigned' && 'Công việc mới sẽ xuất hiện khi được gán cho bạn'}
                {activeTab === 'in-progress' && 'Bắt đầu các công việc đã được gán'}
                {activeTab === 'completed' && 'Hoàn thành các công việc để xem lịch sử'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Maintenance Feedback Modal */}
      {showFeedbackModal && selectedTask && selectedTask.type === 'maintenance' && (
        <MaintenanceFeedbackModal
          maintenance={{
            id: selectedTask.id,
            equipmentId: selectedTask.equipmentId,
            description: selectedTask.description
          }}
          onClose={() => {
            setShowFeedbackModal(false);
            setSelectedTask(null);
          }}
          onSuccess={handleFeedbackSuccess}
        />
      )}

      {/* Status Update Modal (for Incidents) */}
      {showStatusUpdateModal && selectedTask && (
        <StatusUpdateModal
          task={selectedTask}
          onClose={() => {
            setShowStatusUpdateModal(false);
            setSelectedTask(null);
          }}
          onSubmit={handleStatusUpdate}
        />
      )}

      {/* Task Detail Modal */}
      {showDetailModal && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTask(null);
          }}
        />
      )}

      {/* Escalate Modal */}
      {showEscalateModal && selectedTask && (
        <EscalateModal
          task={selectedTask}
          onClose={() => {
            setShowEscalateModal(false);
            setSelectedTask(null);
          }}
          onSubmit={submitEscalate}
        />
      )}
    </div>
  );
};

// Escalate Modal Component
const EscalateModal = ({ task, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setSubmitting(true);
    await onSubmit(reason);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <ArrowUpCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Chuyển lên Admin</h3>
              <p className="text-sm text-gray-500">Sự cố sẽ được chuyển cho quản trị viên xử lý</p>
            </div>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900">{task.title}</h4>
            <p className="text-sm text-gray-600">{task.equipmentName}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Lý do chuyển lên Admin *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                rows={4}
                placeholder="Giải thích tại sao bạn không thể xử lý sự cố này (vd: cần thiết bị đặc biệt, cần phê duyệt chi phí cao, vượt quá khả năng kỹ thuật...)"
                required
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting || !reason.trim()}
                className="btn-warning flex-1 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <ArrowUpCircle className="w-4 h-4" />
                    Chuyển lên Admin
                  </>
                )}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Status Update Modal Component
const StatusUpdateModal = ({ task, onClose, onSubmit }) => {
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(notes);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-primary mb-4">
            Hoàn thành công việc
          </h3>
          
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900">{task.title}</h4>
            <p className="text-sm text-gray-600">{task.equipmentName}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                {task.type === 'maintenance' ? 'Báo cáo kết quả bảo trì:' : 'Mô tả cách giải quyết:'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder={task.type === 'maintenance' ? 
                  'Mô tả những gì đã được thực hiện, phụ tụng thay thế, tình trạng thiết bị...' :
                  'Mô tả nguyên nhân sự cố và cách khắc phục...'
                }
                required
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button type="submit" className="btn-success flex-1">
                Hoàn thành
              </button>
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Task Detail Modal Component with Feedback Display
const TaskDetailModal = ({ task, onClose }) => {
  const [maintenanceDetail, setMaintenanceDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load full maintenance detail if completed
    if (task.type === 'maintenance' && task.status === 'completed') {
      loadMaintenanceDetail();
    }
  }, [task.id]);

  const loadMaintenanceDetail = async () => {
    try {
      setLoading(true);
      const detail = await trackingService.getMaintenanceRecords();
      const record = detail.find(m => m.id === task.id);
      setMaintenanceDetail(record);
    } catch (error) {
      console.error('Lỗi load maintenance detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const feedback = maintenanceDetail?.feedback || {};
  const hasFeedback = task.status === 'completed' && (feedback.workPerformed || feedback.issuesFound || feedback.partsReplaced);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary">
              Chi tiết công việc
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {loading ? (
            <LoadingSpinner size="md" />
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
                <div className="flex items-center gap-2 mb-2">
                  {task.type === 'maintenance' ? (
                    <Wrench className="w-4 h-4 text-blue-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm text-gray-600 capitalize">
                    {task.type === 'maintenance' ? 'Bảo trì' : 'Sự cố'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Thiết bị:</span>
                  <p className="font-medium">{task.equipmentName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Ưu tiên:</span>
                  <div className="mt-1">
                    {task.priority && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.priority === 'critical' ? 'bg-red-200 text-red-900' :
                        task.priority === 'high' ? 'bg-red-100 text-red-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority === 'critical' ? 'Khẩn cấp' :
                         task.priority === 'high' ? 'Cao' :
                         task.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Trạng thái:</span>
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      ['completed', 'resolved', 'closed'].includes(task.status) ? 'bg-green-100 text-green-800' :
                      ['in_progress', 'investigating'].includes(task.status) ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.status === 'scheduled' ? 'Đã lên lịch' :
                       task.status === 'pending' ? 'Chờ xử lý' :
                       task.status === 'in_progress' ? 'Đang thực hiện' :
                       task.status === 'completed' ? 'Hoàn thành' :
                       task.status === 'reported' ? 'Đã báo cáo' :
                       task.status === 'investigating' ? 'Đang điều tra' :
                       task.status === 'resolved' ? 'Đã giải quyết' :
                       task.status === 'closed' ? 'Đã đóng' : task.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">
                    {task.type === 'maintenance' ? 'Ngày thực hiện:' : 'Thời gian báo cáo:'}
                  </span>
                  <p className="font-medium">
                    {task.scheduledDate ?
                      (task.scheduledDate.toDate ?
                        task.scheduledDate.toLocaleDateString('vi-VN') :
                        new Date(task.scheduledDate).toLocaleDateString('vi-VN')
                      ) : 'Không xác định'
                    }
                  </p>
                </div>
              </div>

              {task.description && (
                <div>
                  <span className="text-gray-500 text-sm">Mô tả:</span>
                  <p className="mt-1 text-gray-900">{task.description}</p>
                </div>
              )}

              {/* Hiển thị feedback chi tiết nếu đã hoàn thành */}
              {hasFeedback && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Phản hồi bảo trì
                  </h4>

                  {feedback.workPerformed && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Công việc đã thực hiện:</span>
                      <p className="text-sm text-gray-900 mt-1">{feedback.workPerformed}</p>
                    </div>
                  )}

                  {feedback.issuesFound && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Vấn đề phát hiện:</span>
                      <p className="text-sm text-gray-900 mt-1">{feedback.issuesFound}</p>
                    </div>
                  )}

                  {feedback.hasRemainingIssues !== undefined && (
                    <div className="mb-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        feedback.hasRemainingIssues
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {feedback.hasRemainingIssues ? '⚠️ Còn lỗi chưa khắc phục' : '✅ Đã khắc phục hoàn toàn'}
                      </span>
                    </div>
                  )}

                  {feedback.partsReplaced && feedback.partsReplaced.length > 0 && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700 block mb-2">Linh kiện đã thay thế:</span>
                      <div className="space-y-2">
                        {feedback.partsReplaced.map((part, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm bg-white p-2 rounded border border-green-200">
                            <span className="text-gray-900">{part.name}</span>
                            <div className="text-gray-600">
                              x{part.quantity} - {(part.cost * part.quantity).toLocaleString('vi-VN')} VNĐ
                            </div>
                          </div>
                        ))}
                        <div className="text-right font-medium text-gray-900 text-sm pt-2 border-t border-green-200">
                          Tổng: {feedback.partsReplaced.reduce((sum, p) => sum + (p.cost * p.quantity), 0).toLocaleString('vi-VN')} VNĐ
                        </div>
                      </div>
                    </div>
                  )}

                  {feedback.technicianNotes && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Ghi chú kỹ thuật viên:</span>
                      <p className="text-sm text-gray-900 mt-1">{feedback.technicianNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Notes cũ (dành cho incident hoặc chưa có feedback) */}
              {task.notes && !hasFeedback && (
                <div>
                  <span className="text-gray-500 text-sm">
                    {task.type === 'maintenance' ? 'Ghi chú bảo trì:' : 'Cách giải quyết:'}
                  </span>
                  <p className="mt-1 text-gray-900">{task.notes}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-200 mt-6">
            <button onClick={onClose} className="btn-secondary">
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicianTaskDashboard;