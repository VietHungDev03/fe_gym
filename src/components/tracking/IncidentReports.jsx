import { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Search, Calendar, User, MessageSquare, CheckCircle2, Clock, Eye } from 'lucide-react';
import { trackingService } from '../../services/trackingService';
import { equipmentService } from '../../services/equipmentService';
import { userService } from '../../services/userService';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import IncidentDetailModal from './IncidentDetailModal';

const IncidentReports = () => {
  const [incidents, setIncidents] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { showError, showSuccess } = useNotification();
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const equipment = await equipmentService.getAllEquipment();
      setEquipmentList(equipment);

      const users = await userService.getAllUsers();
      setUsersList(users);

      // Load incidents using trackingService
      const incidentsData = await trackingService.getIncidentReports();
      setIncidents(incidentsData);
    } catch (error) {
      console.error('Lỗi tải báo cáo sự cố:', error);
      showError('Không thể tải báo cáo sự cố');
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (userId) => {
    const user = usersList.find(u => u.id === userId);
    return user?.fullName || 'Không xác định';
  };

  const getEquipmentName = (equipmentId) => {
    const equipment = equipmentList.find(eq => eq.id === equipmentId);
    return equipment ? equipment.name : 'Thiết bị không xác định';
  };

  const updateIncidentStatus = async (incidentId, newStatus, resolution = '') => {
    try {
      await trackingService.updateIncidentStatus(incidentId, newStatus, resolution);

      // Update local state
      setIncidents(prev => 
        prev.map(incident => 
          incident.id === incidentId 
            ? { ...incident, status: newStatus, resolution, resolvedAt: newStatus === 'resolved' || newStatus === 'closed' ? new Date() : incident.resolvedAt }
            : incident
        )
      );

      showSuccess('Cập nhật trạng thái sự cố thành công');
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái sự cố:', error);
      showError('Không thể cập nhật trạng thái sự cố');
    }
  };

  const handleViewDetail = (incident) => {
    setSelectedIncident(incident);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedIncident(null);
  };

  const handleDeleteIncident = (incidentId) => {
    setIncidents(prev => prev.filter(item => item.id !== incidentId));
    showSuccess('Xóa báo cáo sự cố thành công');
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
      investigating: { label: 'Đang điều tra', class: 'bg-yellow-100 text-yellow-800' },
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

  const IncidentForm = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
      equipmentId: '',
      description: '',
      severity: 'medium',
      reportedBy: isAdmin ? '' : userProfile?.id || ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();

      if (!formData.equipmentId || !formData.description) {
        showError('Vui lòng nhập đầy đủ thông tin');
        return;
      }

      try {
        // Non-admin: luôn dùng tài khoản đang đăng nhập
        const reporterId = isAdmin ? formData.reportedBy : userProfile?.id;

        await trackingService.reportIncident(
          formData.equipmentId,
          formData.description,
          formData.severity,
          reporterId
        );

        showSuccess('Báo cáo sự cố thành công');
        onSave();
        onClose();
      } catch (error) {
        console.error('Lỗi báo cáo sự cố:', error);
        showError('Không thể báo cáo sự cố');
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">
              Báo cáo sự cố
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
                  {equipmentList.map(equipment => (
                    <option key={equipment.id} value={equipment.id}>
                      {equipment.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Mô tả sự cố *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Mô tả chi tiết sự cố xảy ra..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Mức độ nghiêm trọng
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                  <option value="critical">Nghiêm trọng</option>
                </select>
              </div>

              {/* Người báo cáo: Admin được chọn, non-admin tự động dùng tài khoản đang đăng nhập */}
              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Người báo cáo
                </label>
                {isAdmin ? (
                  <select
                    value={formData.reportedBy}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportedBy: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Chọn người báo cáo</option>
                    {usersList.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} ({user.role})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                    {userProfile?.fullName || userProfile?.email} (Bạn)
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  Báo cáo
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

  // Filter and sort incidents
  const filteredIncidents = incidents
    .filter(incident => {
      const matchesSearch = !searchTerm || 
        incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getEquipmentName(incident.equipmentId).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;
      const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
      
      return matchesSearch && matchesSeverity && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by reportedAt - newest first
      const dateA = a.reportedAt?.toDate?.() || new Date(a.reportedAt || 0);
      const dateB = b.reportedAt?.toDate?.() || new Date(b.reportedAt || 0);
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
            Báo cáo sự cố
          </h2>
          <p className="text-sm text-secondary mt-1">
            Quản lý các sự cố và vấn đề xảy ra với thiết bị
          </p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Báo cáo sự cố
        </button>
      </div>

      {/* Filters */}
      <div className="card-standard">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm sự cố..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả mức độ</option>
            <option value="low">Thấp</option>
            <option value="medium">Trung bình</option>
            <option value="high">Cao</option>
            <option value="critical">Nghiêm trọng</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="reported">Đã báo cáo</option>
            <option value="investigating">Đang điều tra</option>
            <option value="resolved">Đã giải quyết</option>
            <option value="closed">Đã đóng</option>
          </select>

          {/* Results count */}
          <div className="flex items-center px-3 py-2 bg-gray-50 rounded-md text-sm text-secondary">
            <span>Hiển thị: {filteredIncidents.length}/{incidents.length}</span>
          </div>
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {filteredIncidents.map((incident) => (
          <div key={incident.id} className="card-standard">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-primary text-lg">
                    {getEquipmentName(incident.equipmentId)}
                  </h3>
                  <SeverityBadge severity={incident.severity} />
                  <StatusBadge status={incident.status} />
                </div>
                
                <p className="text-sm text-secondary mb-3 leading-relaxed">
                  {incident.description}
                </p>
                
                <div className="space-y-1 text-sm text-secondary">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Báo cáo bởi: {getUserName(incident.reportedBy)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Thời gian: {formatDateTime(incident.reportedAt)}</span>
                  </div>
                  
                  {incident.resolvedAt && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Giải quyết: {formatDateTime(incident.resolvedAt)}</span>
                    </div>
                  )}
                  
                  {incident.resolution && (
                    <div className="flex items-start gap-2 mt-2">
                      <MessageSquare className="w-4 h-4 mt-0.5" />
                      <div>
                        <span className="font-medium">Cách giải quyết:</span>
                        <p className="mt-1">{incident.resolution}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => handleViewDetail(incident)}
                className="btn-secondary text-sm py-1 px-3 flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                Chi tiết
              </button>
              
              {incident.status === 'reported' && (
                <button
                  onClick={() => updateIncidentStatus(incident.id, 'investigating')}
                  className="btn-warning text-sm py-1 px-3"
                >
                  Bắt đầu điều tra
                </button>
              )}
              
              {incident.status === 'investigating' && (
                <button
                  onClick={() => {
                    const resolution = prompt('Nhập cách giải quyết:');
                    if (resolution) {
                      updateIncidentStatus(incident.id, 'resolved', resolution);
                    }
                  }}
                  className="btn-success text-sm py-1 px-3"
                >
                  Đánh dấu đã giải quyết
                </button>
              )}
              
              {incident.status === 'resolved' && (
                <button
                  onClick={() => updateIncidentStatus(incident.id, 'closed')}
                  className="btn-secondary text-sm py-1 px-3"
                >
                  Đóng sự cố
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredIncidents.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              Không có báo cáo sự cố
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm || severityFilter !== 'all' || statusFilter !== 'all'
                ? 'Thử thay đổi bộ lọc tìm kiếm'
                : 'Chưa có báo cáo sự cố nào trong hệ thống'}
            </p>
          </div>
        )}
      </div>

      {/* Form báo cáo sự cố */}
      {showForm && (
        <IncidentForm
          onClose={() => setShowForm(false)}
          onSave={loadData}
        />
      )}

      {/* Modal chi tiết incident */}
      {showDetailModal && selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={handleCloseDetailModal}
          onUpdate={loadData}
          onDelete={handleDeleteIncident}
        />
      )}
    </div>
  );
};

export default IncidentReports;