import { useState, useEffect } from 'react';
import { Calendar, Clock, AlertTriangle, Plus, CheckCircle, XCircle, Eye, MapPin } from 'lucide-react';
import { trackingService } from '../../services/trackingService';
import { equipmentService } from '../../services/equipmentService';
import { branchService } from '../../services/branchService';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS, hasPermission } from '../../utils/permissions';
import LoadingSpinner from '../ui/LoadingSpinner';
import MaintenanceDetailModal from './MaintenanceDetailModal';

const MaintenanceSchedule = () => {
  const [maintenanceList, setMaintenanceList] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [branchList, setBranchList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { showError, showSuccess } = useNotification();
  const { userProfile } = useAuth();

  // Check permissions
  const canView = hasPermission(userProfile?.role, PERMISSIONS.TRACKING_VIEW);
  const canCreate = hasPermission(userProfile?.role, PERMISSIONS.MAINTENANCE_CREATE);
  const canUpdate = hasPermission(userProfile?.role, PERMISSIONS.MAINTENANCE_UPDATE);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [maintenance, equipment, branches] = await Promise.all([
        trackingService.getMaintenanceRecords(),
        equipmentService.getAllEquipment(),
        branchService.getAllBranches()
      ]);

      setMaintenanceList(maintenance);
      setEquipmentList(equipment);
      setBranchList(branches);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      showError('Không thể tải dữ liệu bảo trì');
    } finally {
      setLoading(false);
    }
  };

  const getEquipmentName = (equipmentId) => {
    const equipment = equipmentList.find(eq => eq.id === equipmentId);
    return equipment ? equipment.name : 'Thiết bị không xác định';
  };

  const getEquipmentDisplayName = (equipmentId) => {
    const name = getEquipmentName(equipmentId);
    return name.length > 42 ? `${name.slice(0, 39)}...` : name;
  };

  // Lấy tên chi nhánh của thiết bị
  const getEquipmentBranch = (equipmentId) => {
    const equipment = equipmentList.find(eq => eq.id === equipmentId);
    if (equipment?.branchId) {
      const branch = branchList.find(b => b.id === equipment.branchId);
      return branch ? branch.name : null;
    }
    return null;
  };

  const updateStatus = async (maintenanceId, newStatus, additionalData = {}) => {
    try {
      await trackingService.updateMaintenanceStatus(maintenanceId, newStatus, additionalData);
      
      // Cập nhật local state
      setMaintenanceList(prev => 
        prev.map(item => 
          item.id === maintenanceId 
            ? { ...item, status: newStatus, ...additionalData }
            : item
        )
      );
      
      showSuccess('Cập nhật trạng thái thành công');
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);
      showError('Không thể cập nhật trạng thái');
    }
  };

  const handleViewDetail = (maintenance) => {
    setSelectedMaintenance(maintenance);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedMaintenance(null);
  };

  const handleDeleteMaintenance = (maintenanceId) => {
    setMaintenanceList(prev => prev.filter(item => item.id !== maintenanceId));
    showSuccess('Xóa lịch bảo trì thành công');
  };


  const StatusBadge = ({ status, priority }) => {
    const configs = {
      scheduled: { label: 'Đã lên lịch', class: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'Đang thực hiện', class: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Hoàn thành', class: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Đã hủy', class: 'bg-red-100 text-red-800' }
    };

    const priorityIcons = {
      critical: <AlertTriangle className="w-3 h-3 text-red-500" />,
      high: <AlertTriangle className="w-3 h-3 text-yellow-500" />,
      medium: <Clock className="w-3 h-3 text-blue-500" />,
      low: <Clock className="w-3 h-3 text-gray-500" />
    };

    const config = configs[status] || configs.scheduled;
    
    return (
      <div className="flex items-center gap-2">
        {priorityIcons[priority]}
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
          {config.label}
        </span>
      </div>
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Không xác định';
    
    const date = timestamp.toDate ? timestamp : new Date(timestamp);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const MaintenanceForm = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
      equipmentId: '',
      type: 'preventive',
      description: '',
      scheduledDate: '',
      priority: 'medium'
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!formData.equipmentId || !formData.description || !formData.scheduledDate) {
        showError('Vui lòng nhập đầy đủ thông tin');
        return;
      }

      try {
        await trackingService.scheduleMaintenance(
          formData.equipmentId,
          formData.scheduledDate,
          formData.type,
          formData.description,
          formData.priority
        );
        
        showSuccess('Lên lịch bảo trì thành công');
        onSave();
        onClose();
      } catch (error) {
        console.error('Lỗi lên lịch bảo trì:', error);
        showError('Không thể lên lịch bảo trì');
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">
              Lên lịch bảo trì
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Thiết bị *
                </label>
                <select
                  value={formData.equipmentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, equipmentId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Chọn thiết bị</option>
                  {/* {equipmentList.map(equipment => {
                    const branchName = getEquipmentBranch(equipment.id);
                    return (
                      <option key={equipment.id} value={equipment.id}>
                        {getEquipmentDisplayName(equipment.id)}{branchName ? ` - ${branchName}` : ''}
                      </option>
                    );
                  })} */}
                  {equipmentList
    .filter(equipment => equipment.status === 'active') // chỉ lấy thiết bị đang hoạt động
    .map(equipment => {
      const branchName = getEquipmentBranch(equipment.id);
      return (
        <option key={equipment.id} value={equipment.id}>
          {getEquipmentDisplayName(equipment.id)}{branchName ? ` - ${branchName}` : ''}
        </option>
      );
    })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Loại bảo trì
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="preventive">Bảo trì định kỳ</option>
                  <option value="corrective">Bảo trì sửa chữa</option>
                  <option value="emergency">Bảo trì khẩn cấp</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Mô tả công việc *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Ngày thực hiện *
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Độ ưu tiên
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                  <option value="critical">Khẩn cấp</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  Lên lịch
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

  // Filter and sort maintenance records
  const filteredMaintenance = maintenanceList
    .filter(maintenance => {
      if (filterStatus === 'all') return true;
      return maintenance.status === filterStatus;
    })
    .sort((a, b) => {
      // Sort by scheduledDate - newest first
      const dateA = new Date(a.scheduledDate);
      const dateB = new Date(b.scheduledDate);
      return dateB - dateA;
    });

  if (loading) {
    return <LoadingSpinner className="py-8" size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-semibold text-primary">
          Lịch bảo trì thiết bị
        </h2>
        
        {canCreate && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Lên lịch bảo trì
          </button>
        )}
      </div>

      {/* Bộ lọc */}
      <div className="card-standard">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-primary">Lọc theo trạng thái:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả</option>
            <option value="scheduled">Đã lên lịch</option>
            <option value="in_progress">Đang thực hiện</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Danh sách bảo trì */}
      <div className="space-y-4">
        {filteredMaintenance.map((maintenance) => (
          <div key={maintenance.id} className="card-standard">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3
                    className="font-semibold text-primary text-lg line-clamp-1"
                    title={getEquipmentName(maintenance.equipmentId)}
                  >
                    {getEquipmentDisplayName(maintenance.equipmentId)}
                  </h3>
                  {getEquipmentBranch(maintenance.equipmentId) && (
                    <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {getEquipmentBranch(maintenance.equipmentId)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-secondary mb-2">
                  {maintenance.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-secondary">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Lên lịch: {formatDate(maintenance.scheduledDate)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="capitalize">Loại: {maintenance.type}</span>
                  </div>
                </div>
              </div>
              
              <StatusBadge status={maintenance.status} priority={maintenance.priority} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => handleViewDetail(maintenance)}
                className="btn-secondary text-sm py-1 px-3 flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                Chi tiết
              </button>
              
              {maintenance.status === 'scheduled' && canUpdate && (
                <>
                  <button
                    onClick={() => updateStatus(maintenance.id, 'in_progress')}
                    className="btn-warning text-sm py-1 px-3"
                  >
                    Bắt đầu
                  </button>
                  <button
                    onClick={() => updateStatus(maintenance.id, 'cancelled')}
                    className="btn-secondary text-sm py-1 px-3"
                  >
                    Hủy
                  </button>
                </>
              )}
              
              {maintenance.status === 'in_progress' && canUpdate && (
                <button
                  onClick={() => updateStatus(maintenance.id, 'completed', {
                    completedBy: userProfile?.id,
                    notes: 'Hoàn thành bảo trì'
                  })}
                  className="btn-success flex items-center gap-1 text-sm py-1 px-3"
                >
                  <CheckCircle className="w-4 h-4" />
                  Hoàn thành
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredMaintenance.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              Không có lịch bảo trì
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {filterStatus === 'all' 
                ? 'Chưa có lịch bảo trì nào trong hệ thống' 
                : `Không có lịch bảo trì ${filterStatus}`}
            </p>
          </div>
        )}
      </div>

      {/* Form thêm lịch bảo trì */}
      {showForm && (
        <MaintenanceForm
          onClose={() => setShowForm(false)}
          onSave={loadData}
        />
      )}

      {/* Modal chi tiết bảo trì */}
      {showDetailModal && selectedMaintenance && (
        <MaintenanceDetailModal
          maintenance={selectedMaintenance}
          onClose={handleCloseDetailModal}
          onUpdate={loadData}
          onDelete={handleDeleteMaintenance}
        />
      )}
    </div>
  );
};

export default MaintenanceSchedule;
