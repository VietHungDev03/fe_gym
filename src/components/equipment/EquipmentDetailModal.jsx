import { useState, useEffect } from 'react';
import {
  X, Package, Calendar, MapPin, Settings, AlertTriangle,
  Clock, User, History, Wrench, QrCode as QrCodeIcon,
  Activity, TrendingUp, CheckCircle, Archive, FileText
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { trackingService } from '../../services/trackingService';
import { userService } from '../../services/userService';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import MaintenanceDetailModal from '../tracking/MaintenanceDetailModal';

const EquipmentDetailModal = ({ equipment, onClose, onEdit }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [usageHistory, setUsageHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [showMaintenanceDetail, setShowMaintenanceDetail] = useState(false);
  const [usersMap, setUsersMap] = useState({});

  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    if (equipment) {
      loadEquipmentData();
    }
  }, [equipment]);

  const loadEquipmentData = async () => {
    try {
      setLoading(true);
      console.log('🔍 [EquipmentDetail] Loading for equipmentId:', equipment.id);

      // Load TẤT CẢ maintenance records của thiết bị này (không filter status)
      const [maintenance, usage] = await Promise.all([
        trackingService.getMaintenanceRecords(null, equipment.id),
        trackingService.getEquipmentUsageHistory(equipment.id, 50)
      ]);

      console.log('📊 [EquipmentDetail] Maintenance:', maintenance?.length || 0, 'records');
      console.log('📊 [EquipmentDetail] Usage:', usage?.length || 0, 'records');

      setMaintenanceHistory(Array.isArray(maintenance) ? maintenance : []);
      setUsageHistory(Array.isArray(usage) ? usage : []);

      // Load user info cho usage history
      if (Array.isArray(usage) && usage.length > 0) {
        const userIds = [...new Set(usage.map(u => u.userId).filter(Boolean))];
        if (userIds.length > 0) {
          await loadUsers(userIds);
        }
      }
    } catch (error) {
      console.error('❌ [EquipmentDetail] Error:', error);
      showError('Không thể tải dữ liệu chi tiết thiết bị');
      setMaintenanceHistory([]);
      setUsageHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (userIds) => {
    try {
      const usersData = {};
      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const user = await userService.getUserById(userId);
            usersData[userId] = user;
          } catch (error) {
            console.error('Lỗi load user:', userId, error);
          }
        })
      );
      setUsersMap(usersData);
    } catch (error) {
      console.error('Lỗi load users:', error);
    }
  };

  const handleViewMaintenanceDetail = (maintenance) => {
    setSelectedMaintenance(maintenance);
    setShowMaintenanceDetail(true);
  };

  const handleReportIssue = async () => {
    const description = prompt('Mô tả sự cố:');
    if (!description) return;

    try {
      await trackingService.reportIncident(equipment.id, description, 'medium');
      showSuccess('Báo cáo sự cố thành công!');
      loadEquipmentData(); // Reload data
    } catch (error) {
      showError('Không thể báo cáo sự cố');
    }
  };

  const handleScheduleMaintenance = async () => {
    const description = prompt('Mô tả công việc bảo trì:');
    if (!description) return;

    const scheduledDate = prompt('Ngày thực hiện (YYYY-MM-DD):');
    if (!scheduledDate) return;

    try {
      await trackingService.scheduleMaintenance(
        equipment.id,
        new Date(scheduledDate),
        'preventive',
        description,
        'medium'
      );
      showSuccess('Lên lịch bảo trì thành công!');
      loadEquipmentData(); // Reload data
    } catch (error) {
      showError('Không thể lên lịch bảo trì');
    }
  };

  const StatusBadge = ({ status }) => {
    const configs = {
      // Equipment status
      active: { label: 'Hoạt động', class: 'bg-green-100 text-green-800' },
      maintenance: { label: 'Bảo trì', class: 'bg-yellow-100 text-yellow-800' },
      inactive: { label: 'Ngừng hoạt động', class: 'bg-red-100 text-red-800' },
      disposed: { label: 'Đã thanh lý', class: 'bg-gray-100 text-gray-800' },
      // Maintenance status
      scheduled: { label: 'Đã lên lịch', class: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'Đang thực hiện', class: 'bg-purple-100 text-purple-800' },
      completed: { label: 'Hoàn thành', class: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Đã hủy', class: 'bg-red-100 text-red-800' }
    };

    const config = configs[status] || { label: status, class: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Không xác định';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: Package },
    { id: 'maintenance', label: 'Bảo trì', icon: Wrench },
    { id: 'usage', label: 'Sử dụng', icon: Activity }
  ];

  if (!equipment) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-primary">
                {equipment.name}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-secondary">{equipment.type}</span>
                <StatusBadge status={equipment.status} />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {equipment.status !== 'disposed' && (
              <button
                onClick={() => onEdit(equipment)}
                className="btn-secondary text-sm py-2 px-3"
              >
                <Settings className="w-4 h-4 mr-1" />
                Chỉnh sửa
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {/* Tổng quan */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Thông báo đã thanh lý */}
                  {equipment.status === 'disposed' && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                      <div className="flex items-start gap-3">
                        <Archive className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-red-900 mb-2">
                            Thiết bị đã được thanh lý
                          </h3>
                          <div className="space-y-2 text-sm text-red-800">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>
                                <strong>Ngày thanh lý:</strong>{' '}
                                {equipment.disposalDate ? formatDate(equipment.disposalDate) : 'Không xác định'}
                              </span>
                            </div>
                            {equipment.disposalReason && (
                              <div className="flex items-start gap-2">
                                <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>
                                  <strong>Lý do:</strong> {equipment.disposalReason}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-red-700 mt-3 italic">
                            Thiết bị này không còn hoạt động. Lịch sử hoạt động và bảo trì vẫn được lưu trữ dưới đây.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mã QR Code - Full width */}
                  {equipment.qrCode && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                          <QRCode
                            value={equipment.qrCode}
                            size={200}
                            level="H"
                            className="w-full h-auto"
                          />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <div className="flex items-center gap-2 justify-center md:justify-start mb-3">
                            <QrCodeIcon className="w-6 h-6 text-blue-600" />
                            <h3 className="text-xl font-semibold text-blue-900">Mã QR/RFID</h3>
                          </div>
                          <code className="bg-white px-4 py-2 rounded-md text-lg font-mono text-blue-700 border border-blue-200 inline-block mb-3">
                            {equipment.qrCode}
                          </code>
                          <p className="text-sm text-blue-700 mb-2">
                            Quét mã QR này để truy cập nhanh thông tin thiết bị
                          </p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(equipment.qrCode);
                              showSuccess('Đã sao chép mã QR');
                            }}
                            className="btn-secondary text-sm mt-2"
                          >
                            Sao chép mã
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Thông tin cơ bản */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-primary">Thông tin cơ bản</h3>

                      <div className="space-y-3">
                        {!equipment.qrCode && (
                          <div className="flex items-center gap-2">
                            <QrCodeIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-secondary">Mã QR/RFID:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                              Chưa có
                            </code>
                          </div>
                        )}

                        {equipment.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-secondary">Vị trí:</span>
                            <span className="text-sm text-primary">{equipment.location}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-secondary">Ngày mua:</span>
                          <span className="text-sm text-primary">
                            {formatDate(equipment.purchaseDate)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-secondary">Hết hạn bảo hành:</span>
                          <span className="text-sm text-primary">
                            {formatDate(equipment.warrantyExpiry)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-secondary">Chu kỳ bảo trì:</span>
                          <span className="text-sm text-primary">
                            {equipment.maintenanceInterval || 30} ngày
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-primary">Mô tả</h3>
                      <p className="text-sm text-secondary">
                        {equipment.description || 'Không có mô tả'}
                      </p>
                      
                      {equipment.specifications && (
                        <>
                          <h3 className="text-lg font-semibold text-primary">Thông số kỹ thuật</h3>
                          <pre className="text-sm text-secondary whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                            {equipment.specifications}
                          </pre>
                        </>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* Bảo trì */}
              {activeTab === 'maintenance' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-primary">Lịch trình bảo trì</h3>
                    <span className="text-sm text-secondary">
                      {maintenanceHistory.length} lần bảo trì
                    </span>
                  </div>

                  {maintenanceHistory.length > 0 ? (
                    <div className="space-y-3">
                      {maintenanceHistory.map((maintenance) => (
                        <div
                          key={maintenance.id}
                          onClick={() => handleViewMaintenanceDetail(maintenance)}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-blue-300 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-primary">{maintenance.description}</h4>
                              <div className="flex items-center gap-4 mt-1 text-sm text-secondary">
                                <span>Loại: {
                                  maintenance.type === 'preventive' ? 'Bảo trì định kỳ' :
                                  maintenance.type === 'corrective' ? 'Bảo trì sửa chữa' :
                                  maintenance.type === 'emergency' ? 'Bảo trì khẩn cấp' :
                                  maintenance.type
                                }</span>
                                <span>Ưu tiên: {
                                  maintenance.priority === 'critical' ? 'Khẩn cấp' :
                                  maintenance.priority === 'high' ? 'Cao' :
                                  maintenance.priority === 'medium' ? 'Trung bình' :
                                  maintenance.priority === 'low' ? 'Thấp' :
                                  maintenance.priority
                                }</span>
                              </div>
                            </div>
                            <StatusBadge status={maintenance.status} />
                          </div>

                          <div className="text-sm text-secondary">
                            <p>Lên lịch: {formatDateTime(maintenance.scheduledDate)}</p>
                            {maintenance.actualDate && (
                              <p>Hoàn thành: {formatDateTime(maintenance.actualDate)}</p>
                            )}
                            {maintenance.feedbackSubmittedAt && (
                              <div className="flex items-center gap-2 mt-2 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span className="font-medium">Đã có phản hồi bảo trì</span>
                              </div>
                            )}
                          </div>

                          <p className="text-xs text-blue-600 mt-2">Click để xem chi tiết</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Wrench className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">Chưa có lịch sử bảo trì</p>
                    </div>
                  )}
                </div>
              )}

              {/* Sử dụng */}
              {activeTab === 'usage' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-primary">Lịch sử sử dụng</h3>
                    <span className="text-sm text-secondary">
                      {usageHistory.length} lần sử dụng
                    </span>
                  </div>

                  {usageHistory.length > 0 ? (
                    <div className="space-y-3">
                      {usageHistory.map((usage, index) => {
                        const user = usage.userId ? usersMap[usage.userId] : null;
                        const userName = user ? (user.fullName || user.email) : (usage.userId ? 'Đang tải...' : 'Người dùng không xác định');

                        return (
                          <div key={usage.id || index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-secondary">
                                  {userName}
                                </span>
                              </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              usage.status === 'completed' ? 'bg-green-100 text-green-800' :
                              usage.status === 'in_use' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {usage.status === 'completed' ? 'Hoàn thành' :
                               usage.status === 'in_use' ? 'Đang sử dụng' : 'Không xác định'}
                            </span>
                          </div>
                          
                          <div className="text-sm text-secondary">
                            <p>Bắt đầu: {formatDateTime(usage.startTime)}</p>
                            {usage.endTime && (
                              <p>Kết thúc: {formatDateTime(usage.endTime)}</p>
                            )}
                            {usage.notes && (
                              <p className="mt-1">Ghi chú: {usage.notes}</p>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">Chưa có lịch sử sử dụng</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-secondary">
            Cập nhật lần cuối: {formatDateTime(equipment.updatedAt || equipment.createdAt)}
          </div>
          
          <div className="flex items-center gap-2">
            {equipment.status !== 'disposed' && (
              <button
                onClick={() => onEdit(equipment)}
                className="btn-primary text-sm"
              >
                Chỉnh sửa thiết bị
              </button>
            )}
            <button
              onClick={onClose}
              className="btn-secondary text-sm"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Maintenance Detail Modal */}
      {showMaintenanceDetail && selectedMaintenance && (
        <MaintenanceDetailModal
          maintenance={selectedMaintenance}
          onClose={() => {
            setShowMaintenanceDetail(false);
            setSelectedMaintenance(null);
          }}
          onUpdate={() => {
            loadEquipmentData();
          }}
        />
      )}
    </div>
  );
};

export default EquipmentDetailModal;