import { useState, useEffect } from 'react';
import {
  X, Activity, Calendar, User, Package, Clock,
  Play, Square, Edit, MessageSquare, BarChart3, Tag, MapPin
} from 'lucide-react';
import { trackingService } from '../../services/trackingService';
import { equipmentService } from '../../services/equipmentService';
import { userService } from '../../services/userService';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../ui/LoadingSpinner';

const UsageDetailModal = ({ usage, onClose, onUpdate }) => {
  const [equipment, setEquipment] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    notes: '',
    userId: ''
  });
  const [usageStats, setUsageStats] = useState(null);
  
  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    if (usage) {
      loadUsageInfo();
      initEditForm();
    }
  }, [usage]);

  const loadUsageInfo = async () => {
    try {
      setLoading(true);

      // Load equipment info
      const equipmentData = await equipmentService.getEquipmentById(usage.equipmentId);
      setEquipment(equipmentData);

      // Load user info
      if (usage.userId) {
        try {
          const users = await userService.getAllUsers();
          const user = users.find(u => u.id === usage.userId);
          if (user) {
            setUserName(user.fullName || user.name || user.email || usage.userId);
          } else {
            setUserName(usage.userId);
          }
        } catch {
          setUserName(usage.userId);
        }
      }

      // Load usage stats for this equipment
      const stats = await trackingService.getUsageStats(
        usage.equipmentId,
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        new Date()
      );
      setUsageStats(stats);

    } catch (error) {
      console.error('Lỗi tải thông tin sử dụng:', error);
      showError('Không thể tải thông tin sử dụng');
    } finally {
      setLoading(false);
    }
  };

  const initEditForm = () => {
    if (usage) {
      setEditForm({
        notes: usage.notes || '',
        userId: usage.userId || ''
      });
    }
  };

  const handleSaveEdit = async () => {
    try {
      // Trong thực tế sẽ có API update usage
      // await trackingService.updateUsage(usage.id, editForm);
      
      showSuccess('Cập nhật thông tin sử dụng thành công');
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error('Lỗi cập nhật:', error);
      showError('Không thể cập nhật thông tin sử dụng');
    }
  };

  const handleEndUsage = async () => {
    if (usage.status !== 'in_use') return;

    try {
      await trackingService.endUsage(usage.id, 'Kết thúc từ modal chi tiết');
      showSuccess('Kết thúc sử dụng thiết bị thành công');
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error('Lỗi kết thúc sử dụng:', error);
      showError('Không thể kết thúc sử dụng');
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

  const calculateDuration = (startTime, endTime) => {
    if (!startTime) return 'N/A';
    
    const start = startTime.toDate ? startTime : new Date(startTime);
    const end = endTime ? (endTime.toDate ? endTime : new Date(endTime)) : new Date();
    
    const diff = end - start;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const StatusBadge = ({ status }) => {
    const configs = {
      in_use: { label: 'Đang sử dụng', class: 'bg-yellow-100 text-yellow-800', icon: Play },
      completed: { label: 'Hoàn thành', class: 'bg-green-100 text-green-800', icon: Square },
      cancelled: { label: 'Đã hủy', class: 'bg-red-100 text-red-800', icon: X }
    };
    
    const config = configs[status] || configs.completed;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  if (!usage) return null;

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
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary">
                Chi tiết sử dụng thiết bị
              </h2>
              <p className="text-sm text-secondary">
                {equipment?.name || 'Đang tải...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <StatusBadge status={usage.status} />
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
                      Người sử dụng
                    </label>
                    <input
                      type="text"
                      value={editForm.userId}
                      onChange={(e) => setEditForm(prev => ({ ...prev, userId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ID hoặc tên người dùng"
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
                      rows={4}
                      placeholder="Ghi chú về việc sử dụng..."
                    />
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="space-y-6">
                  {/* Thông tin phiên sử dụng */}
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-4">Thông tin phiên sử dụng</h3>
                    
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-secondary">Người sử dụng:</span>
                        </div>
                        <span className="text-primary">
                          {userName || 'Không xác định'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-secondary">Bắt đầu:</span>
                        </div>
                        <span className="text-primary">
                          {formatDateTime(usage.startTime)}
                        </span>
                      </div>

                      {usage.endTime && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Square className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-secondary">Kết thúc:</span>
                          </div>
                          <span className="text-primary">
                            {formatDateTime(usage.endTime)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-secondary">Thời gian sử dụng:</span>
                        </div>
                        <span className="text-primary font-medium">
                          {calculateDuration(usage.startTime, usage.endTime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Thông tin thiết bị */}
                  {equipment && (
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-4">Thông tin thiết bị</h3>
                      
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <Package className="w-5 h-5 text-blue-500" />
                          <div>
                            <h4 className="font-medium text-primary">{equipment.name}</h4>
                            <p className="text-sm text-secondary">{equipment.type}</p>
                          </div>
                        </div>
                        
                        {equipment.location && (
                          <p className="text-sm text-secondary flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {equipment.location}
                          </p>
                        )}

                        {equipment.qrCode && (
                          <p className="text-sm text-secondary mt-2 flex items-center gap-1">
                            <Tag className="w-4 h-4" />
                            Mã: {equipment.qrCode}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ghi chú */}
                  {usage.notes && (
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-4">Ghi chú</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                          <p className="text-secondary">{usage.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar - Thống kê */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-4">Thống kê thiết bị</h3>
                
                {usageStats ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-secondary">Tổng lần sử dụng</span>
                        <span className="text-lg font-semibold text-primary">
                          {usageStats.totalUsage}
                        </span>
                      </div>
                      <div className="text-xs text-secondary">30 ngày qua</div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-secondary">Hoàn thành</span>
                        <span className="text-lg font-semibold text-green-600">
                          {usageStats.completedUsage}
                        </span>
                      </div>
                      <div className="text-xs text-secondary">
                        {usageStats.totalUsage > 0 
                          ? `${Math.round((usageStats.completedUsage / usageStats.totalUsage) * 100)}% tỷ lệ hoàn thành`
                          : 'Chưa có dữ liệu'
                        }
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-secondary">Thời gian trung bình</span>
                        <span className="text-lg font-semibold text-blue-600">
                          {Math.round(usageStats.averageDuration)} phút
                        </span>
                      </div>
                      <div className="text-xs text-secondary">Mỗi lần sử dụng</div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-secondary">Không có dữ liệu thống kê</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 bg-gray-50 gap-2">
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
  );
};

export default UsageDetailModal;