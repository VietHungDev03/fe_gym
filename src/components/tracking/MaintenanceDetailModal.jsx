import { useState, useEffect } from 'react';
import {
  X, Calendar, Clock, User, Package, AlertTriangle,
  CheckCircle, XCircle, Edit, Trash2, MessageSquare, Wrench, FileText
} from 'lucide-react';
import { trackingService } from '../../services/trackingService';
import { equipmentService } from '../../services/equipmentService';
import { userService } from '../../services/userService';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import MaintenanceFeedbackModal from './MaintenanceFeedbackModal';

const MaintenanceDetailModal = ({ maintenance, onClose, onUpdate, onDelete }) => {
  const [equipment, setEquipment] = useState(null);
  const [assignedUser, setAssignedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [editForm, setEditForm] = useState({
    description: '',
    scheduledDate: '',
    priority: 'medium',
    notes: '',
    assignedTo: ''
  });

  const { showError, showSuccess, showWarning } = useNotification();
  const { userProfile } = useAuth();

  useEffect(() => {
    if (maintenance) {
      loadEquipmentInfo();
      loadAssignedUser();
      initEditForm();
    }
  }, [maintenance]);

  const loadEquipmentInfo = async () => {
    try {
      setLoading(true);
      const equipmentData = await equipmentService.getEquipmentById(maintenance.equipmentId);
      setEquipment(equipmentData);
    } catch (error) {
      console.error('Lỗi tải thông tin thiết bị:', error);
      showError('Không thể tải thông tin thiết bị');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignedUser = async () => {
    if (!maintenance.assignedTo) return;

    try {
      const user = await userService.getUserById(maintenance.assignedTo);
      setAssignedUser(user);
    } catch (error) {
      console.error('Lỗi tải thông tin người thực hiện:', error);
      // Không hiển thị lỗi cho user, chỉ log
    }
  };

  const initEditForm = () => {
    if (maintenance) {
      const scheduledDate = maintenance.scheduledDate?.toDate ? 
        maintenance.scheduledDate : 
        new Date(maintenance.scheduledDate);
      
      setEditForm({
        description: maintenance.description || '',
        scheduledDate: scheduledDate.toISOString().slice(0, 16),
        priority: maintenance.priority || 'medium',
        notes: maintenance.notes || '',
        assignedTo: maintenance.assignedTo || ''
      });
    }
  };

  const handleSaveEdit = async () => {
    try {
      const updates = {
        description: editForm.description,
        scheduledDate: new Date(editForm.scheduledDate).toISOString(),
        priority: editForm.priority,
        notes: editForm.notes,
        assignedTo: editForm.assignedTo
      };

      await trackingService.updateMaintenanceStatus(maintenance.id, maintenance.status, updates);
      
      showSuccess('Cập nhật thông tin bảo trì thành công');
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error('Lỗi cập nhật:', error);
      showError('Không thể cập nhật thông tin bảo trì');
    }
  };

  const handleStatusChange = async (newStatus, additionalData = {}) => {
    try {
      await trackingService.updateMaintenanceStatus(maintenance.id, newStatus, additionalData);
      showSuccess('Cập nhật trạng thái thành công');
      onUpdate?.();
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);
      showError('Không thể cập nhật trạng thái');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc muốn xóa lịch bảo trì này?')) {
      try {
        // Trong thực tế sẽ có API delete maintenance
        onDelete?.(maintenance.id);
        showSuccess('Xóa lịch bảo trì thành công');
        onClose();
      } catch (error) {
        console.error('Lỗi xóa:', error);
        showError('Không thể xóa lịch bảo trì');
      }
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'Không xác định';
    
    const date = timestamp.toDate ? timestamp : new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (!maintenance) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8">
          <LoadingSpinner size="lg" />
          <p className="text-center mt-4 text-primary">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary">
                Chi tiết bảo trì
              </h2>
              <p className="text-sm text-secondary">
                {equipment?.name || 'Đang tải...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <StatusBadge status={maintenance.status} priority={maintenance.priority} />
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isEditing ? (
            /* Edit Form */
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Mô tả công việc *
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Ngày thực hiện *
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.scheduledDate}
                    onChange={(e) => setEditForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Độ ưu tiên
                  </label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                    <option value="critical">Khẩn cấp</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Người thực hiện
                </label>
                <input
                  type="text"
                  value={editForm.assignedTo}
                  onChange={(e) => setEditForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tên người thực hiện"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Ghi chú thêm..."
                />
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-6">
              {/* Thông tin chính */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">Thông tin bảo trì</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-secondary">Loại bảo trì:</span>
                      <p className="text-primary capitalize mt-1">
                        {maintenance.type === 'preventive' ? 'Bảo trì định kỳ' :
                         maintenance.type === 'corrective' ? 'Bảo trì sửa chữa' :
                         maintenance.type === 'emergency' ? 'Bảo trì khẩn cấp' : 
                         maintenance.type}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-secondary">Mô tả:</span>
                      <p className="text-primary mt-1">{maintenance.description}</p>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-secondary">Ngày lên lịch:</span>
                      <p className="text-primary mt-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDateTime(maintenance.scheduledDate)}
                      </p>
                    </div>

                    {maintenance.actualDate && (
                      <div>
                        <span className="text-sm font-medium text-secondary">Ngày hoàn thành:</span>
                        <p className="text-primary mt-1 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {formatDateTime(maintenance.actualDate)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">Thông tin thiết bị</h3>
                  
                  {equipment && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <Package className="w-5 h-5 text-blue-500" />
                        <div>
                          <h4 className="font-medium text-primary">{equipment.name}</h4>
                          <p className="text-sm text-secondary">{equipment.type}</p>
                        </div>
                      </div>
                      
                      {equipment.location && (
                        <p className="text-sm text-secondary">
                          📍 {equipment.location}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-3">
                    {maintenance.assignedTo && (
                      <div>
                        <span className="text-sm font-medium text-secondary">Người thực hiện:</span>
                        <p className="text-primary mt-1 flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {assignedUser ? assignedUser.fullName || assignedUser.email : maintenance.assignedTo}
                        </p>
                      </div>
                    )}

                    {maintenance.cost > 0 && (
                      <div>
                        <span className="text-sm font-medium text-secondary">Chi phí:</span>
                        <p className="text-primary mt-1">
                          {maintenance.cost.toLocaleString('vi-VN')} VNĐ
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Ghi chú */}
              {maintenance.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-3">Ghi chú</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                      <p className="text-secondary">{maintenance.notes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Phản hồi bảo trì */}
              {maintenance.feedbackSubmittedAt && (
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Phản hồi bảo trì
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                    {/* Công việc đã thực hiện */}
                    {maintenance.workPerformed && (
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">Công việc đã thực hiện:</p>
                        <p className="text-sm text-blue-800">{maintenance.workPerformed}</p>
                      </div>
                    )}

                    {/* Vấn đề phát hiện */}
                    {maintenance.issuesFound && (
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">Vấn đề phát hiện:</p>
                        <p className="text-sm text-blue-800">{maintenance.issuesFound}</p>
                      </div>
                    )}

                    {/* Trạng thái lỗi */}
                    <div className="flex items-center gap-2">
                      {maintenance.hasRemainingIssues ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-700">Còn lỗi chưa khắc phục</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Đã khắc phục hoàn toàn</span>
                        </>
                      )}
                    </div>

                    {/* Linh kiện đã thay thế */}
                    {maintenance.partsReplaced && maintenance.partsReplaced.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-2">Linh kiện đã thay thế:</p>
                        <div className="space-y-2">
                          {maintenance.partsReplaced.map((part, index) => (
                            <div key={index} className="flex items-center justify-between bg-white p-2 rounded">
                              <div className="flex items-center gap-2">
                                <Wrench className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-900">{part.name}</span>
                                <span className="text-xs text-gray-500">x{part.quantity}</span>
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {(part.quantity * part.cost).toLocaleString('vi-VN')} VNĐ
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-end pt-2 border-t border-blue-200">
                            <span className="text-sm font-semibold text-blue-900">
                              Tổng: {maintenance.partsReplaced.reduce((sum, p) => sum + (p.quantity * p.cost), 0).toLocaleString('vi-VN')} VNĐ
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ghi chú kỹ thuật viên */}
                    {maintenance.technicianNotes && (
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">Ghi chú kỹ thuật viên:</p>
                        <p className="text-sm text-blue-800">{maintenance.technicianNotes}</p>
                      </div>
                    )}

                    {/* Thời gian submit */}
                    <div className="flex items-center gap-2 text-xs text-blue-700 pt-2 border-t border-blue-200">
                      <Clock className="w-3 h-3" />
                      <span>Phản hồi lúc: {formatDateTime(maintenance.feedbackSubmittedAt)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h3 className="text-lg font-semibold text-primary mb-3">Lịch sử thay đổi</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-primary">Tạo lịch bảo trì</p>
                      <p className="text-xs text-secondary">
                        {formatDateTime(maintenance.createdAt)}
                      </p>
                    </div>
                  </div>

                  {maintenance.actualDate && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-primary">Hoàn thành bảo trì</p>
                        <p className="text-xs text-secondary">
                          {formatDateTime(maintenance.actualDate)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            {!isEditing && maintenance.status !== 'completed' && maintenance.status !== 'cancelled' && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Chỉnh sửa
              </button>
            )}

            {!isEditing && maintenance.status === 'scheduled' && (
              <button
                onClick={handleDelete}
                className="btn-danger text-sm flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Xóa
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="btn-primary text-sm"
                >
                  Lưu thay đổi
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    initEditForm();
                  }}
                  className="btn-secondary text-sm"
                >
                  Hủy
                </button>
              </>
            ) : (
              <>
                {maintenance.status === 'scheduled' && (
                  <button
                    onClick={() => handleStatusChange('in_progress')}
                    className="btn-warning text-sm"
                  >
                    Bắt đầu
                  </button>
                )}

                {maintenance.status === 'in_progress' && !maintenance.feedbackSubmittedAt && (
                  <button
                    onClick={() => setShowFeedbackModal(true)}
                    className="btn-primary text-sm flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Phản hồi bảo trì
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="btn-secondary text-sm"
                >
                  Đóng
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <MaintenanceFeedbackModal
          maintenance={maintenance}
          onClose={() => setShowFeedbackModal(false)}
          onSuccess={() => {
            setShowFeedbackModal(false);
            onUpdate?.();
          }}
        />
      )}
    </div>
  );
};

export default MaintenanceDetailModal;