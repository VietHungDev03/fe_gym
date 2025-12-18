import { useState, useEffect } from 'react';
import { 
  X, AlertTriangle, Calendar, User, Package, MessageSquare,
  CheckCircle, Clock, Edit, Trash2, FileText, Camera, MapPin, Tag
} from 'lucide-react';
import { trackingService } from '../../services/trackingService';
import { equipmentService } from '../../services/equipmentService';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../ui/LoadingSpinner';

const IncidentDetailModal = ({ incident, onClose, onUpdate, onDelete }) => {
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentIncident, setCurrentIncident] = useState(incident);
  const [editForm, setEditForm] = useState({
    description: '',
    severity: 'medium',
    resolution: ''
  });
  const [resolutionForm, setResolutionForm] = useState('');
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  
  const { showError, showSuccess, showWarning } = useNotification();

  useEffect(() => {
    if (incident) {
      setCurrentIncident(incident);
      loadIncidentInfo();
      initEditForm();
    }
  }, [incident]);

  const loadIncidentInfo = async () => {
    try {
      setLoading(true);
      const equipmentData = await equipmentService.getEquipmentById(incident.equipmentId);
      setEquipment(equipmentData);
    } catch (error) {
      console.error('Lỗi tải thông tin thiết bị:', error);
      showError('Không thể tải thông tin thiết bị');
    } finally {
      setLoading(false);
    }
  };

  const initEditForm = () => {
    if (currentIncident) {
      setEditForm({
        description: currentIncident.description || '',
        severity: currentIncident.severity || 'medium',
        resolution: currentIncident.resolution || ''
      });
    }
  };

  const handleSaveEdit = async () => {
    try {
      // Trong thực tế sẽ có API update incident
      // await incidentService.updateIncident(incident.id, editForm);
      
      showSuccess('Cập nhật thông tin sự cố thành công');
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error('Lỗi cập nhật:', error);
      showError('Không thể cập nhật thông tin sự cố');
    }
  };

  const handleStatusChange = async (newStatus, resolution = '') => {
    try {
      await trackingService.updateIncidentStatus(currentIncident.id, newStatus, resolution);

      // Cập nhật currentIncident với trạng thái mới
      setCurrentIncident(prev => ({
        ...prev,
        status: newStatus,
        resolution,
        resolvedAt: newStatus === 'resolved' || newStatus === 'closed' ? new Date() : prev.resolvedAt
      }));

      showSuccess('Cập nhật trạng thái sự cố thành công');
      setShowResolutionForm(false);
      setResolutionForm('');
      onUpdate?.();
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);
      showError('Không thể cập nhật trạng thái sự cố');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc muốn xóa báo cáo sự cố này?')) {
      try {
        // Trong thực tế sẽ có API delete incident
        onDelete?.(incident.id);
        showSuccess('Xóa báo cáo sự cố thành công');
        onClose();
      } catch (error) {
        console.error('Lỗi xóa:', error);
        showError('Không thể xóa báo cáo sự cố');
      }
    }
  };

  const handleCreateMaintenance = async () => {
    if (!equipment) return;

    try {
      await trackingService.scheduleMaintenance(
        equipment.id,
        new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        'corrective',
        `Sửa chữa sự cố: ${incident.description}`,
        incident.severity === 'critical' ? 'critical' : 'high'
      );
      
      showSuccess('Đã tạo lịch bảo trì để xử lý sự cố');
    } catch (error) {
      console.error('Lỗi tạo lịch bảo trì:', error);
      showError('Không thể tạo lịch bảo trì');
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

  const SeverityBadge = ({ severity }) => {
    const configs = {
      low: { label: 'Thấp', class: 'bg-gray-100 text-gray-800', color: 'gray' },
      medium: { label: 'Trung bình', class: 'bg-blue-100 text-blue-800', color: 'blue' },
      high: { label: 'Cao', class: 'bg-yellow-100 text-yellow-800', color: 'yellow' },
      critical: { label: 'Nghiêm trọng', class: 'bg-red-100 text-red-800', color: 'red' }
    };
    
    const config = configs[severity] || configs.medium;
    
    return (
      <div className="flex items-center gap-1">
        <AlertTriangle className={`w-3 h-3 text-${config.color}-500`} />
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
          {config.label}
        </span>
      </div>
    );
  };

  const StatusBadge = ({ status }) => {
    const configs = {
      reported: { label: 'Đã báo cáo', class: 'bg-blue-100 text-blue-800', icon: FileText },
      investigating: { label: 'Đang điều tra', class: 'bg-yellow-100 text-yellow-800', icon: Clock },
      resolved: { label: 'Đã giải quyết', class: 'bg-green-100 text-green-800', icon: CheckCircle },
      closed: { label: 'Đã đóng', class: 'bg-gray-100 text-gray-800', icon: X }
    };
    
    const config = configs[status] || configs.reported;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  if (!currentIncident) return null;

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
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary">
                Chi tiết báo cáo sự cố
              </h2>
              <p className="text-sm text-secondary">
                {equipment?.name || 'Đang tải...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <SeverityBadge severity={currentIncident.severity} />
            <StatusBadge status={currentIncident.status} />
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Thông tin chính */}
            <div className="lg:col-span-2 space-y-6">
              {isEditing ? (
                /* Edit Form */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Mô tả sự cố *
                    </label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Mức độ nghiêm trọng
                    </label>
                    <select
                      value={editForm.severity}
                      onChange={(e) => setEditForm(prev => ({ ...prev, severity: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Thấp</option>
                      <option value="medium">Trung bình</option>
                      <option value="high">Cao</option>
                      <option value="critical">Nghiêm trọng</option>
                    </select>
                  </div>

                  {incident.resolution && (
                    <div>
                      <label className="block text-sm font-medium text-primary mb-2">
                        Cách giải quyết
                      </label>
                      <textarea
                        value={editForm.resolution}
                        onChange={(e) => setEditForm(prev => ({ ...prev, resolution: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* View Mode */
                <div className="space-y-6">
                  {/* Thông tin sự cố */}
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-4">Thông tin sự cố</h3>
                    
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <div className="flex items-start gap-3 mb-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-red-800 mb-2">Mô tả sự cố</h4>
                          <p className="text-red-700">{currentIncident.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Thông tin thiết bị */}
                  {equipment && (
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-4">Thông tin thiết bị</h3>
                      
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3 mb-3">
                          <Package className="w-5 h-5 text-blue-500" />
                          <div>
                            <h4 className="font-medium text-blue-800">{equipment.name}</h4>
                            <p className="text-sm text-blue-600">{equipment.type}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm text-blue-700">
                          {equipment.location && (
                            <p className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              Vị trí: {equipment.location}
                            </p>
                          )}
                          {equipment.qrCode && (
                            <p className="flex items-center gap-1">
                              <Tag className="w-4 h-4" />
                              Mã: {equipment.qrCode}
                            </p>
                          )}
                          <p className="flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            Trạng thái hiện tại: <span className="capitalize">{equipment.status}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cách giải quyết */}
                  {currentIncident.resolution && (
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-4">Cách giải quyết</h3>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          <p className="text-green-700">{currentIncident.resolution}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form giải quyết */}
                  {showResolutionForm && (
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-4">Giải quyết sự cố</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <textarea
                          value={resolutionForm}
                          onChange={(e) => setResolutionForm(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                          rows={4}
                          placeholder="Nhập cách giải quyết sự cố..."
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStatusChange('resolved', resolutionForm)}
                            disabled={!resolutionForm.trim()}
                            className="btn-success text-sm"
                          >
                            Đánh dấu đã giải quyết
                          </button>
                          <button
                            onClick={() => {
                              setShowResolutionForm(false);
                              setResolutionForm('');
                            }}
                            className="btn-secondary text-sm"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar - Thông tin chi tiết */}
            <div className="space-y-6">
              {/* Thông tin báo cáo */}
              <div>
                <h3 className="text-lg font-semibold text-primary mb-4">Thông tin báo cáo</h3>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-secondary">Người báo cáo</span>
                    </div>
                    <p className="text-primary">{currentIncident.reportedBy || 'Không xác định'}</p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-secondary">Thời gian báo cáo</span>
                    </div>
                    <p className="text-primary">{formatDateTime(currentIncident.reportedAt)}</p>
                  </div>

                  {currentIncident.resolvedAt && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-secondary">Thời gian giải quyết</span>
                      </div>
                      <p className="text-primary">{formatDateTime(currentIncident.resolvedAt)}</p>
                    </div>
                  )}

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-secondary">Ưu tiên xử lý</span>
                    </div>
                    <p className="text-primary capitalize">
                      {currentIncident.priority === 'critical' ? 'Khẩn cấp' :
                       currentIncident.priority === 'high' ? 'Cao' :
                       currentIncident.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-lg font-semibold text-primary mb-4">Thao tác</h3>
                
                <div className="space-y-2">
                  {currentIncident.status === 'reported' && (
                    <button
                      onClick={() => handleStatusChange('investigating')}
                      className="btn-warning w-full text-sm"
                    >
                      Bắt đầu điều tra
                    </button>
                  )}
                  
                  {currentIncident.status === 'investigating' && !showResolutionForm && (
                    <button
                      onClick={() => setShowResolutionForm(true)}
                      className="btn-success w-full text-sm"
                    >
                      Giải quyết sự cố
                    </button>
                  )}
                  
                  {currentIncident.status === 'resolved' && (
                    <button
                      onClick={() => handleStatusChange('closed')}
                      className="btn-secondary w-full text-sm"
                    >
                      Đóng sự cố
                    </button>
                  )}

                  {(currentIncident.status === 'reported' || currentIncident.status === 'investigating') && (
                    <button
                      onClick={handleCreateMaintenance}
                      className="btn-primary w-full text-sm"
                    >
                      Tạo lịch bảo trì
                    </button>
                  )}

                  {!isEditing && currentIncident.status !== 'closed' && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn-secondary w-full text-sm flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Chỉnh sửa
                    </button>
                  )}

                  {currentIncident.status === 'reported' && (
                    <button
                      onClick={handleDelete}
                      className="btn-danger w-full text-sm flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Xóa báo cáo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-secondary">
            Cập nhật lần cuối: {formatDateTime(currentIncident.updatedAt || currentIncident.reportedAt)}
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
              <button
                onClick={onClose}
                className="btn-secondary text-sm"
              >
                Đóng
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetailModal;