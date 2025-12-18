import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Eye,
  Package,
  Building2,
  MessageSquare,
  Send
} from 'lucide-react';
import { trackingService } from '../services/trackingService';
import { equipmentService } from '../services/equipmentService';
import { branchService } from '../services/branchService';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const ReceptionistIncidentsPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [branchInfo, setBranchInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('incidents');

  const { showError, showSuccess } = useNotification();
  const { userProfile } = useAuth();

  useEffect(() => {
    loadData();
  }, [userProfile]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load thông tin chi nhánh của user
      if (userProfile?.assignedBranchId) {
        const branch = await branchService.getBranchByIdSilent(userProfile.assignedBranchId);
        setBranchInfo(branch);

        // Load thiết bị của chi nhánh
        const allEquipment = await equipmentService.getAllEquipment();
        const branchEquipment = allEquipment.filter(eq => eq.branchId === userProfile.assignedBranchId);
        setEquipmentList(branchEquipment);

        // Load sự cố của chi nhánh
        const branchIncidents = await trackingService.getMyBranchIncidents();
        setIncidents(branchIncidents);
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      showError('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const getEquipmentName = (equipmentId) => {
    const equipment = equipmentList.find(eq => eq.id === equipmentId);
    return equipment ? equipment.name : 'Thiết bị không xác định';
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'Không xác định';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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
      low: { label: 'Thấp', class: 'bg-gray-100 text-gray-800' },
      medium: { label: 'Trung bình', class: 'bg-blue-100 text-blue-800' },
      high: { label: 'Cao', class: 'bg-yellow-100 text-yellow-800' },
      critical: { label: 'Nghiêm trọng', class: 'bg-red-100 text-red-800' }
    };
    const config = configs[severity] || configs.medium;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
        <AlertTriangle className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const StatusBadge = ({ status }) => {
    const configs = {
      reported: { label: 'Đã báo cáo', class: 'bg-blue-100 text-blue-800' },
      investigating: { label: 'Đang xử lý', class: 'bg-yellow-100 text-yellow-800' },
      resolved: { label: 'Đã giải quyết', class: 'bg-green-100 text-green-800' },
      closed: { label: 'Đã đóng', class: 'bg-gray-100 text-gray-800' }
    };
    const config = configs[status] || configs.reported;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const EquipmentStatusBadge = ({ status }) => {
    const configs = {
      active: { label: 'Hoạt động', class: 'bg-green-100 text-green-800' },
      maintenance: { label: 'Đang bảo trì', class: 'bg-yellow-100 text-yellow-800' },
      broken: { label: 'Hỏng', class: 'bg-red-100 text-red-800' },
      inactive: { label: 'Ngưng sử dụng', class: 'bg-gray-100 text-gray-800' }
    };
    const config = configs[status] || configs.active;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  // Form báo cáo sự cố
  const IncidentForm = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
      equipmentId: '',
      description: '',
      severity: 'medium'
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();

      if (!formData.equipmentId || !formData.description) {
        showError('Vui lòng nhập đầy đủ thông tin');
        return;
      }

      try {
        setSubmitting(true);
        await trackingService.reportIncident(
          formData.equipmentId,
          formData.description,
          formData.severity,
          userProfile?.id
        );

        showSuccess('Báo cáo sự cố thành công! NVKT sẽ xử lý sớm nhất.');
        onSave();
        onClose();
      } catch (error) {
        console.error('Lỗi báo cáo sự cố:', error);
        showError('Không thể báo cáo sự cố');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Báo cáo sự cố</h3>
                <p className="text-sm text-gray-500">Chi nhánh: {branchInfo?.name}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Thiết bị gặp sự cố *
                </label>
                <select
                  value={formData.equipmentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, equipmentId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Chọn thiết bị --</option>
                  {equipmentList.map(equipment => (
                    <option key={equipment.id} value={equipment.id}>
                      {equipment.name} ({equipment.type || 'Chưa phân loại'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Mô tả sự cố *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Mô tả chi tiết sự cố xảy ra (vd: máy phát tiếng kêu lạ, không hoạt động...)"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Mức độ nghiêm trọng
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Thấp - Vẫn sử dụng được</option>
                  <option value="medium">Trung bình - Cần xử lý sớm</option>
                  <option value="high">Cao - Ảnh hưởng hoạt động</option>
                  <option value="critical">Nghiêm trọng - Cần xử lý ngay</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Gửi báo cáo
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

  // Filter incidents
  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = !searchTerm ||
      incident.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getEquipmentName(incident.equipmentId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter equipment
  const filteredEquipment = equipmentList.filter(eq => {
    return !searchTerm ||
      eq.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.location?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return <LoadingSpinner className="py-8" size="lg" />;
  }

  // Kiểm tra user có được phân chi nhánh chưa
  if (!userProfile?.assignedBranchId) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Chưa được phân công chi nhánh</h2>
        <p className="text-gray-600">
          Vui lòng liên hệ quản trị viên để được phân công vào chi nhánh làm việc.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Quản lý sự cố chi nhánh
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-blue-600 font-medium">{branchInfo?.name}</span>
            {branchInfo?.address && (
              <span className="text-gray-500 text-sm">- {branchInfo.address}</span>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Báo cáo sự cố
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Thiết bị chi nhánh</p>
              <p className="text-2xl font-bold text-blue-700">{equipmentList.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Sự cố chờ xử lý</p>
              <p className="text-2xl font-bold text-yellow-700">
                {incidents.filter(i => i.status === 'reported').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600">Đang xử lý</p>
              <p className="text-2xl font-bold text-orange-700">
                {incidents.filter(i => i.status === 'investigating').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-400" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Đã giải quyết</p>
              <p className="text-2xl font-bold text-green-700">
                {incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length}
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card-standard">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'incidents'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Báo cáo sự cố ({incidents.length})
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'equipment'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Package className="w-4 h-4" />
            Thiết bị chi nhánh ({equipmentList.length})
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="card-standard">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === 'incidents' ? 'Tìm kiếm sự cố...' : 'Tìm kiếm thiết bị...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {activeTab === 'incidents' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="reported">Đã báo cáo</option>
              <option value="investigating">Đang xử lý</option>
              <option value="resolved">Đã giải quyết</option>
              <option value="closed">Đã đóng</option>
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'incidents' ? (
        <div className="space-y-4">
          {filteredIncidents.length > 0 ? (
            filteredIncidents.map((incident) => (
              <div key={incident.id} className="card-standard">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {getEquipmentName(incident.equipmentId)}
                      </h3>
                      <SeverityBadge severity={incident.severity} />
                      <StatusBadge status={incident.status} />
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{incident.description}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDateTime(incident.reportedAt)}
                      </div>
                      {incident.resolution && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {incident.resolution}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Chưa có báo cáo sự cố</h3>
              <p className="text-sm text-gray-500 mt-1">
                Nhấn "Báo cáo sự cố" để tạo báo cáo mới khi phát hiện vấn đề với thiết bị.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipment.length > 0 ? (
            filteredEquipment.map((equipment) => (
              <div key={equipment.id} className="card-standard">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{equipment.name}</h3>
                    <p className="text-sm text-gray-500">{equipment.type || 'Chưa phân loại'}</p>
                    {equipment.location && (
                      <p className="text-xs text-gray-400 mt-1">Vị trí: {equipment.location}</p>
                    )}
                    <div className="mt-2">
                      <EquipmentStatusBadge status={equipment.status} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setShowForm(true);
                    }}
                    className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Báo cáo sự cố
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Không có thiết bị</h3>
              <p className="text-sm text-gray-500 mt-1">Chi nhánh chưa có thiết bị nào.</p>
            </div>
          )}
        </div>
      )}

      {/* Form báo cáo sự cố */}
      {showForm && (
        <IncidentForm
          onClose={() => setShowForm(false)}
          onSave={loadData}
        />
      )}
    </div>
  );
};

export default ReceptionistIncidentsPage;
