import { useState, useEffect } from 'react';
import { Activity, Search, Calendar, User, Clock, Filter, Eye, MapPin } from 'lucide-react';
import { trackingService } from '../../services/trackingService';
import { equipmentService } from '../../services/equipmentService';
import { userService } from '../../services/userService';
import { branchService } from '../../services/branchService';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import UsageDetailModal from './UsageDetailModal';

const UsageHistory = () => {
  const [usageHistory, setUsageHistory] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [branchList, setBranchList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsage, setSelectedUsage] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load equipment, users và branches song song
      const [equipment, users, branches] = await Promise.all([
        equipmentService.getAllEquipment(),
        userService.getAllUsers(),
        branchService.getAllBranches()
      ]);

      setEquipmentList(equipment);
      setUserList(users);
      setBranchList(branches);

      // Load usage history for all equipment
      const allUsagePromises = equipment.map(eq => 
        trackingService.getEquipmentUsageHistory(eq.id, 20)
      );
      
      const allUsageResults = await Promise.all(allUsagePromises);
      
      // Flatten and combine all usage records with equipment info
      const combinedUsage = [];
      equipment.forEach((eq, index) => {
        const equipmentUsage = allUsageResults[index] || [];
        equipmentUsage.forEach(usage => {
          combinedUsage.push({
            ...usage,
            equipmentName: eq.name,
            equipmentType: eq.type
          });
        });
      });

      // Sort by creation time (newest first)
      combinedUsage.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      setUsageHistory(combinedUsage);
    } catch (error) {
      console.error('Lỗi tải lịch sử sử dụng:', error);
      showError('Không thể tải lịch sử sử dụng');
    } finally {
      setLoading(false);
    }
  };

  const endUsage = async (usageId) => {
    try {
      await trackingService.endUsage(usageId, 'Kết thúc sử dụng');
      
      // Update local state
      setUsageHistory(prev => 
        prev.map(usage => 
          usage.id === usageId 
            ? { ...usage, status: 'completed', endTime: new Date() }
            : usage
        )
      );
      
      showSuccess('Kết thúc sử dụng thiết bị thành công');
    } catch (error) {
      console.error('Lỗi kết thúc sử dụng:', error);
      showError('Không thể kết thúc sử dụng');
    }
  };

  const handleViewDetail = (usage) => {
    setSelectedUsage(usage);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedUsage(null);
  };

  // Lấy tên người dùng từ userId
  const getUserName = (userId) => {
    if (!userId) return 'Không xác định';
    const user = userList.find(u => u.id === userId);
    if (user) {
      return user.fullName || user.name || user.email || userId;
    }
    return userId; // Fallback về ID nếu không tìm thấy
  };

  // Lấy tên chi nhánh từ branchId
  const getBranchName = (branchId) => {
    if (!branchId) return null;
    const branch = branchList.find(b => b.id === branchId);
    return branch ? branch.name : null;
  };

  // Lấy thông tin chi nhánh của thiết bị
  const getEquipmentBranch = (equipmentId) => {
    const equipment = equipmentList.find(eq => eq.id === equipmentId);
    if (equipment?.branchId) {
      return getBranchName(equipment.branchId);
    }
    return null;
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
    if (!startTime || !endTime) return null;
    
    const start = startTime.toDate ? startTime : new Date(startTime);
    const end = endTime.toDate ? endTime : new Date(endTime);
    
    const diff = end - start;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const filteredUsage = usageHistory.filter(usage => {
    const userName = getUserName(usage.userId);
    const matchesSearch = searchTerm === '' || (
      usage.equipmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usage.equipmentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesEquipment = selectedEquipment === 'all' || usage.equipmentId === selectedEquipment;
    const matchesStatus = statusFilter === 'all' || usage.status === statusFilter;
    
    return matchesSearch && matchesEquipment && matchesStatus;
  });

  const StatusBadge = ({ status }) => {
    const configs = {
      in_use: { label: 'Đang sử dụng', class: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Hoàn thành', class: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Đã hủy', class: 'bg-red-100 text-red-800' }
    };
    
    const config = configs[status] || configs.completed;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner className="py-8" size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary">
            Lịch sử sử dụng thiết bị
          </h2>
          <p className="text-sm text-secondary mt-1">
            Theo dõi việc sử dụng thiết bị của người dùng
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-standard">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Equipment Filter */}
          <select
            value={selectedEquipment}
            onChange={(e) => setSelectedEquipment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả thiết bị</option>
            {equipmentList.map(equipment => (
              <option key={equipment.id} value={equipment.id}>
                {equipment.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="in_use">Đang sử dụng</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>

          {/* Results count */}
          <div className="flex items-center px-3 py-2 bg-gray-50 rounded-md text-sm text-secondary">
            <span>Hiển thị: {filteredUsage.length}/{usageHistory.length}</span>
          </div>
        </div>
      </div>

      {/* Usage History List */}
      <div className="space-y-4">
        {filteredUsage.map((usage, index) => (
          <div key={usage.id || index} className="card-standard">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-primary text-lg">
                    {usage.equipmentName}
                  </h3>
                  <span className="text-sm text-secondary bg-gray-100 px-2 py-1 rounded">
                    {usage.equipmentType}
                  </span>
                  {getEquipmentBranch(usage.equipmentId) && (
                    <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {getEquipmentBranch(usage.equipmentId)}
                    </span>
                  )}
                </div>
                
                <div className="space-y-1 text-sm text-secondary">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>
                      Người dùng: {getUserName(usage.userId)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Bắt đầu: {formatDateTime(usage.startTime)}</span>
                  </div>
                  
                  {usage.endTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Kết thúc: {formatDateTime(usage.endTime)}</span>
                    </div>
                  )}
                  
                  {usage.startTime && usage.endTime && (
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      <span>Thời gian sử dụng: {calculateDuration(usage.startTime, usage.endTime)}</span>
                    </div>
                  )}
                </div>

                {usage.notes && (
                  <div className="mt-2 text-sm text-secondary">
                    <span className="font-medium">Ghi chú:</span> {usage.notes}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <StatusBadge status={usage.status} />
                <button
                  onClick={() => handleViewDetail(usage)}
                  className="btn-secondary text-sm py-1 px-3 flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  Chi tiết
                </button>
                {usage.status === 'in_use' && (
                  <button
                    onClick={() => endUsage(usage.id)}
                    className="btn-warning text-sm py-1 px-3"
                  >
                    Kết thúc
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredUsage.length === 0 && (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              Không có lịch sử sử dụng
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm || selectedEquipment !== 'all' || statusFilter !== 'all'
                ? 'Thử thay đổi bộ lọc tìm kiếm'
                : 'Chưa có dữ liệu sử dụng thiết bị nào'}
            </p>
          </div>
        )}
      </div>

      {/* Modal chi tiết usage */}
      {showDetailModal && selectedUsage && (
        <UsageDetailModal
          usage={selectedUsage}
          onClose={handleCloseDetailModal}
          onUpdate={loadData}
        />
      )}
    </div>
  );
};

export default UsageHistory;