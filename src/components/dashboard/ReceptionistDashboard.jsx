import { useState, useEffect } from 'react';
import {
  Package, AlertTriangle, MapPin, Plus,
  Eye, CheckCircle, Clock, Building2,
  Activity, TrendingUp
} from 'lucide-react';
import { equipmentService } from '../../services/equipmentService';
import { trackingService } from '../../services/trackingService';
import { branchService } from '../../services/branchService';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../ui/LoadingSpinner';
import AlertsWidget from './AlertsWidget';

const ReceptionistDashboard = () => {
  const [branchEquipment, setBranchEquipment] = useState([]);
  const [branchIncidents, setBranchIncidents] = useState([]);
  const [branchInfo, setBranchInfo] = useState(null);
  const [stats, setStats] = useState({
    totalEquipment: 0,
    activeEquipment: 0,
    maintenanceEquipment: 0,
    totalIncidents: 0,
    pendingIncidents: 0
  });
  const [loading, setLoading] = useState(true);

  const { showError } = useNotification();
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, [userProfile?.branchId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Check if user has assigned branch
      if (!userProfile?.branchId) {
        showError('Bạn chưa được phân công chi nhánh');
        setLoading(false);
        return;
      }

      // Load branch info
      const branch = await branchService.getBranchById(userProfile.branchId);
      setBranchInfo(branch);

      // Load branch equipment
      const equipment = await equipmentService.getMyBranchEquipment();
      setBranchEquipment(equipment.slice(0, 6)); // Show first 6 items

      // Load branch incidents
      const incidents = await trackingService.getMyBranchIncidents();
      setBranchIncidents(incidents.slice(0, 5)); // Show first 5 items

      // Calculate stats
      const activeEquipment = equipment.filter(eq => eq.status === 'active').length;
      const maintenanceEquipment = equipment.filter(eq => eq.status === 'maintenance').length;
      const pendingIncidents = incidents.filter(inc => inc.status === 'reported' || inc.status === 'pending').length;

      setStats({
        totalEquipment: equipment.length,
        activeEquipment,
        maintenanceEquipment,
        totalIncidents: incidents.length,
        pendingIncidents
      });

    } catch (error) {
      console.error('Lỗi tải dữ liệu dashboard:', error);
      showError('Không thể tải dữ liệu chi nhánh');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      active: { label: 'Hoạt động', class: 'bg-green-100 text-green-800' },
      maintenance: { label: 'Bảo trì', class: 'bg-yellow-100 text-yellow-800' },
      broken: { label: 'Hỏng', class: 'bg-red-100 text-red-800' },
      inactive: { label: 'Không hoạt động', class: 'bg-gray-100 text-gray-800' }
    };

    const config = configs[status] || configs.active;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const getIncidentStatusBadge = (status) => {
    const configs = {
      reported: { label: 'Đã báo cáo', class: 'bg-orange-100 text-orange-800' },
      pending: { label: 'Chờ xử lý', class: 'bg-yellow-100 text-yellow-800' },
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

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingSpinner className="py-8" size="lg" />;
  }

  if (!userProfile?.branchId) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Chưa được phân công chi nhánh
        </h3>
        <p className="text-sm text-gray-500">
          Vui lòng liên hệ quản trị viên để được phân công chi nhánh làm việc
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Lễ tân - {branchInfo?.name || 'Chi nhánh'}</h2>
            <p className="text-purple-100">
              Quản lý thiết bị và tiếp nhận sự cố tại chi nhánh
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng thiết bị</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEquipment}</p>
            </div>
            <Package className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Đang hoạt động</p>
              <p className="text-2xl font-bold text-green-700">{stats.activeEquipment}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Đang bảo trì</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.maintenanceEquipment}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Sự cố chờ xử lý</p>
              <p className="text-2xl font-bold text-red-700">{stats.pendingIncidents}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Alerts Widget */}
      <AlertsWidget maxAlerts={5} />

      {/* Quick Action */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Báo cáo sự cố nhanh</h3>
            <p className="text-sm text-gray-600">
              Phát hiện sự cố thiết bị? Báo cáo ngay để được xử lý kịp thời
            </p>
          </div>
          <button
            onClick={() => navigate('/receptionist-incidents')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Báo cáo sự cố
          </button>
        </div>
      </div>

      {/* Equipment and Incidents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Equipment */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" />
              Thiết bị chi nhánh
            </h3>
            <button
              onClick={() => navigate('/equipment')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Xem tất cả
            </button>
          </div>

          <div className="space-y-3">
            {branchEquipment.map(equipment => (
              <div key={equipment.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{equipment.name}</h4>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {equipment.location || 'Chưa có vị trí'}
                    </p>
                  </div>
                  {getStatusBadge(equipment.status)}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Mã: {equipment.qrCode || 'N/A'}</span>
                  <button
                    onClick={() => navigate(`/equipment/${equipment.id}`)}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Chi tiết
                  </button>
                </div>
              </div>
            ))}

            {branchEquipment.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Chưa có thiết bị nào</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Sự cố gần đây
            </h3>
            <button
              onClick={() => navigate('/receptionist-incidents')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Xem tất cả
            </button>
          </div>

          <div className="space-y-3">
            {branchIncidents.map(incident => (
              <div key={incident.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {incident.equipmentName || 'Thiết bị không xác định'}
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                      {incident.description}
                    </p>
                  </div>
                  {getIncidentStatusBadge(incident.status)}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatDateTime(incident.reportedAt)}</span>
                  <span className={`font-medium ${
                    incident.severity === 'critical' || incident.severity === 'high'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}>
                    {incident.severity === 'critical' ? 'Khẩn cấp' :
                     incident.severity === 'high' ? 'Cao' :
                     incident.severity === 'medium' ? 'Trung bình' : 'Thấp'}
                  </span>
                </div>
              </div>
            ))}

            {branchIncidents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Chưa có sự cố nào</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Branch Info */}
      {branchInfo && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-500" />
            Thông tin chi nhánh
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500">Tên chi nhánh:</span>
              <p className="font-medium text-gray-900">{branchInfo.name}</p>
            </div>

            {branchInfo.address && (
              <div>
                <span className="text-sm text-gray-500">Địa chỉ:</span>
                <p className="font-medium text-gray-900">{branchInfo.address}</p>
              </div>
            )}

            {branchInfo.phoneNumber && (
              <div>
                <span className="text-sm text-gray-500">Số điện thoại:</span>
                <p className="font-medium text-gray-900">{branchInfo.phoneNumber}</p>
              </div>
            )}

            <div>
              <span className="text-sm text-gray-500">Trạng thái:</span>
              <p className="font-medium text-gray-900">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  branchInfo.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {branchInfo.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistDashboard;
