import { useState, useEffect } from 'react';
import { 
  Users, UserCheck, Clock, CheckCircle, AlertTriangle, 
  Search, Filter, Plus, Calendar, Wrench, UserPlus, Edit3 
} from 'lucide-react';
import { trackingService } from '../../services/trackingService';
import { userService } from '../../services/userService';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS, hasPermission } from '../../utils/permissions';
import LoadingSpinner from '../ui/LoadingSpinner';

const AssignmentManagement = () => {
  const [assignments, setAssignments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTechnician, setSelectedTechnician] = useState('all');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const { showError, showSuccess } = useNotification();
  const { userProfile } = useAuth();

  const canAssignTasks = hasPermission(userProfile?.role, PERMISSIONS.MAINTENANCE_CREATE);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load technicians và managers
      const allUsers = await userService.getAllUsers();
      const techUsers = allUsers.filter(user => 
        ['technician', 'manager', 'admin'].includes(user.role)
      );
      setTechnicians(techUsers);

      // Load assignments (maintenance records và incidents có assignee)
      const maintenanceRecords = await trackingService.getMaintenanceRecords();
      const incidents = await trackingService.getIncidentReports();

      // Combine và format assignments
      const allAssignments = [
        ...maintenanceRecords.map(record => ({
          id: record.id,
          type: 'maintenance',
          title: `Bảo trì ${record.equipmentName || 'thiết bị'}`,
          description: record.description,
          assignedTo: record.assignedTo,
          assignedBy: record.assignedBy,
          status: record.status,
          priority: record.priority || 'medium',
          dueDate: record.scheduledDate,
          createdAt: record.createdAt,
          equipment: record.equipmentName
        })),
        ...incidents.map(incident => ({
          id: incident.id,
          type: 'incident',
          title: `Xử lý sự cố: ${incident.title}`,
          description: incident.description,
          assignedTo: incident.assignedTo || incident.investigator,
          assignedBy: incident.reportedBy,
          status: incident.status,
          priority: incident.severity,
          dueDate: incident.createdAt, // Incidents cần xử lý ngay
          createdAt: incident.createdAt,
          equipment: incident.equipmentName
        }))
      ];

      setAssignments(allAssignments);
    } catch (error) {
      console.error('Lỗi tải dữ liệu gán việc:', error);
      showError('Không thể tải dữ liệu gán việc');
    } finally {
      setLoading(false);
    }
  };


  const getStatusBadge = (status, type) => {
    const configs = {
      pending: { label: 'Chờ xử lý', class: 'bg-yellow-100 text-yellow-800' },
      'in-progress': { label: 'Đang thực hiện', class: 'bg-blue-100 text-blue-800' },
      investigating: { label: 'Đang điều tra', class: 'bg-orange-100 text-orange-800' },
      completed: { label: 'Hoàn thành', class: 'bg-green-100 text-green-800' },
      resolved: { label: 'Đã giải quyết', class: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Đã hủy', class: 'bg-gray-100 text-gray-800' }
    };
    
    const config = configs[status] || configs.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
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

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Không xác định';
    
    let date;
    if (timestamp?.toDate) {
      date = timestamp;
    } else if (timestamp?.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return 'Không xác định';
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const getUserName = (userId) => {
    const user = technicians.find(t => t.id === userId);
    return user?.fullName || 'Chưa gán';
  };

  const handleAssignTask = (assignment) => {
    setSelectedAssignment(assignment);
    setShowAssignmentModal(true);
  };

  const handleAssignmentSubmit = async (assignmentData) => {
    try {
      const { assignmentId, assignedTo, type, notes } = assignmentData;
      
      if (type === 'maintenance') {
        await trackingService.updateMaintenanceStatus(assignmentId, 'scheduled', {
          assignedTo: assignedTo,
          assignedBy: userProfile?.id,
          notes
        });
      } else if (type === 'incident') {
        // Update incident với assigned user
        await trackingService.assignIncident(assignmentId, assignedTo, notes);
      }

      await loadData(); // Reload data
      setShowAssignmentModal(false);
      setSelectedAssignment(null);
      showSuccess('Gán việc thành công');
    } catch (error) {
      console.error('Lỗi gán việc:', error);
      showError('Không thể gán việc');
    }
  };

  // Filter and sort assignments
  const filteredAssignments = assignments
    .filter(assignment => {
      const matchesSearch = !searchTerm || 
        assignment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getUserName(assignment.assignedTo).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
      const matchesTechnician = selectedTechnician === 'all' || assignment.assignedTo === selectedTechnician;
      
      return matchesSearch && matchesStatus && matchesTechnician;
    })
    .sort((a, b) => {
      // Sort by createdAt - newest first
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return dateB - dateA;
    });

  if (loading) {
    return <LoadingSpinner className="py-8" size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary">
            Quản lý phân công
          </h2>
          <p className="text-secondary mt-1">
            Theo dõi và phân công công việc cho nhân viên kỹ thuật
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng công việc</p>
              <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Chờ xử lý</p>
              <p className="text-2xl font-bold text-yellow-700">
                {assignments.filter(a => a.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Đang thực hiện</p>
              <p className="text-2xl font-bold text-blue-700">
                {assignments.filter(a => ['in-progress', 'investigating'].includes(a.status)).length}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Hoàn thành</p>
              <p className="text-2xl font-bold text-green-700">
                {assignments.filter(a => ['completed', 'resolved'].includes(a.status)).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-standard">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm công việc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="in-progress">Đang thực hiện</option>
            <option value="investigating">Đang điều tra</option>
            <option value="completed">Hoàn thành</option>
            <option value="resolved">Đã giải quyết</option>
          </select>

          {/* Technician filter */}
          <select
            value={selectedTechnician}
            onChange={(e) => setSelectedTechnician(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả nhân viên</option>
            {technicians.map(tech => (
              <option key={tech.id} value={tech.id}>
                {tech.fullName} ({tech.role})
              </option>
            ))}
          </select>

          <div className="flex items-center px-3 py-2 bg-gray-50 rounded-md text-sm text-secondary">
            <span>Hiển thị: {filteredAssignments.length}/{assignments.length}</span>
          </div>
        </div>
      </div>

      {/* Assignments list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAssignments.map((assignment) => (
          <div key={`${assignment.type}-${assignment.id}`} className="card-standard hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  assignment.type === 'maintenance' 
                    ? 'bg-blue-100' 
                    : 'bg-red-100'
                }`}>
                  {assignment.type === 'maintenance' ? (
                    <Wrench className={`w-5 h-5 ${assignment.type === 'maintenance' ? 'text-blue-600' : 'text-red-600'}`} />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-primary">{assignment.title}</h3>
                  <p className="text-sm text-secondary">{assignment.equipment}</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-1 items-end">
                {getStatusBadge(assignment.status, assignment.type)}
                {getPriorityBadge(assignment.priority)}
              </div>
            </div>

            {assignment.description && (
              <p className="text-sm text-secondary mb-4 line-clamp-2">
                {assignment.description}
              </p>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary">Được gán cho:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-primary">
                    {getUserName(assignment.assignedTo)}
                  </span>
                </div>
              </div>
              {assignment.assignedBy && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary">Được gán bởi:</span>
                  <span className="font-medium text-primary">
                    {getUserName(assignment.assignedBy)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary">
                  {assignment.type === 'maintenance' ? 'Ngày thực hiện:' : 'Báo cáo lúc:'}
                </span>
                <span className="font-medium text-primary flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(assignment.dueDate)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredAssignments.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Users className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              Không tìm thấy công việc nào
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm || statusFilter !== 'all' || selectedTechnician !== 'all'
                ? 'Thử thay đổi bộ lọc tìm kiếm' 
                : 'Chưa có công việc nào được phân công'}
            </p>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && selectedAssignment && (
        <AssignmentModal
          assignment={selectedAssignment}
          technicians={technicians}
          onClose={() => {
            setShowAssignmentModal(false);
            setSelectedAssignment(null);
          }}
          onSubmit={handleAssignmentSubmit}
        />
      )}
    </div>
  );
};

// Assignment Modal Component
const AssignmentModal = ({ assignment, technicians, onClose, onSubmit }) => {
  const [selectedTechnician, setSelectedTechnician] = useState(assignment.assignedTo || '');
  const [notes, setNotes] = useState('');
  const { showError } = useNotification();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedTechnician) {
      showError('Vui lòng chọn người được gán việc');
      return;
    }

    onSubmit({
      assignmentId: assignment.id,
      assignedTo: selectedTechnician,
      type: assignment.type,
      notes
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Gán việc
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-1">{assignment.title}</h4>
            <p className="text-sm text-gray-600">{assignment.equipment}</p>
            {assignment.description && (
              <p className="text-sm text-gray-500 mt-1">{assignment.description}</p>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Gán cho nhân viên *
              </label>
              <select
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Chọn nhân viên</option>
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>
                    {tech.fullName} ({tech.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Ghi chú về việc gán này..."
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button type="submit" className="btn-primary flex-1">
                Gán việc
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

export default AssignmentManagement;
