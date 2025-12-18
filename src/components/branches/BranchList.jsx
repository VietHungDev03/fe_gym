import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Building2, MapPin, Phone, Mail, Clock, User, CheckCircle, XCircle, Package } from 'lucide-react';
import { branchService } from '../../services/branchService';
import { userService } from '../../services/userService';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS, hasPermission } from '../../utils/permissions';

const BranchList = ({ onAdd, onEdit, onView }) => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [managers, setManagers] = useState({});

  const { showError, showSuccess } = useNotification();
  const { userProfile } = useAuth();

  // Kiểm tra quyền hạn
  const canCreateBranch = hasPermission(userProfile?.role, PERMISSIONS.BRANCH_CREATE);
  const canUpdateBranch = hasPermission(userProfile?.role, PERMISSIONS.BRANCH_UPDATE);
  const canDeleteBranch = hasPermission(userProfile?.role, PERMISSIONS.BRANCH_DELETE);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const data = await branchService.getAllBranches();
      setBranches(data);

      // Load thông tin managers
      const managerIds = [...new Set(data.map(b => b.managerId).filter(Boolean))];
      const managersData = {};
      await Promise.all(
        managerIds.map(async (id) => {
          const manager = await userService.getUserByIdSilent(id);
          if (manager) {
            managersData[id] = manager;
          }
        })
      );
      setManagers(managersData);
    } catch (error) {
      console.error('Lỗi tải danh sách chi nhánh:', error);
      showError('Không thể tải danh sách chi nhánh');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa chi nhánh này? Hành động này không thể hoàn tác.')) {
      try {
        await branchService.deleteBranch(id);
        setBranches(prev => prev.filter(branch => branch.id !== id));
        showSuccess('Xóa chi nhánh thành công');
      } catch (error) {
        console.error('Lỗi xóa chi nhánh:', error);
        showError('Không thể xóa chi nhánh. Chi nhánh có thể đang được sử dụng.');
      }
    }
  };

  const handleToggleStatus = async (branch) => {
    const newStatus = branch.status === 'active' ? 'inactive' : 'active';
    try {
      await branchService.updateBranch(branch.id, { status: newStatus });
      setBranches(prev =>
        prev.map(b =>
          b.id === branch.id
            ? { ...b, status: newStatus }
            : b
        )
      );
      showSuccess(`${newStatus === 'active' ? 'Kích hoạt' : 'Vô hiệu hóa'} chi nhánh thành công`);
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);
      showError('Không thể cập nhật trạng thái chi nhánh');
    }
  };

  const filteredBranches = branches.filter(branch => {
    const matchesSearch = searchTerm === '' || (
      branch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus = statusFilter === 'all' || branch.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const StatusBadge = ({ status }) => {
    const configs = {
      active: { label: 'Hoạt động', class: 'bg-green-100 text-green-800', icon: CheckCircle },
      inactive: { label: 'Ngừng hoạt động', class: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = configs[status] || configs.active;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
        <Icon className="w-3 h-3" />
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
        <h2 className="text-2xl font-semibold text-gray-900">
          Quản lý chi nhánh
        </h2>

        {canCreateBranch && (
          <button
            onClick={onAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm chi nhánh
          </button>
        )}
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Tổng chi nhánh</p>
              <p className="text-2xl font-bold text-blue-700">{branches.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Đang hoạt động</p>
              <p className="text-2xl font-bold text-green-700">
                {branches.filter(b => b.status === 'active').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Ngừng hoạt động</p>
              <p className="text-2xl font-bold text-red-700">
                {branches.filter(b => b.status === 'inactive').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tìm kiếm và bộ lọc */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Tìm kiếm */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, mã, địa chỉ, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Bộ lọc trạng thái */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Ngừng hoạt động</option>
          </select>

          {/* Hiển thị kết quả */}
          <div className="flex items-center px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-600">
            <span>Hiển thị: {filteredBranches.length}/{branches.length}</span>
          </div>
        </div>
      </div>

      {/* Danh sách chi nhánh */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBranches.map((branch) => (
          <div key={branch.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">
                    {branch.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Mã: {branch.code}
                  </p>
                </div>
              </div>
              <StatusBadge status={branch.status} />
            </div>

            {/* Thông tin chi tiết */}
            <div className="space-y-2 mb-4">
              {branch.address && (
                <div className="text-sm text-gray-600 flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{branch.address}</span>
                </div>
              )}

              {branch.phone && (
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {branch.phone}
                </div>
              )}

              {branch.email && (
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {branch.email}
                </div>
              )}

              {branch.managerId && managers[branch.managerId] && (
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  QL: {managers[branch.managerId].fullName}
                </div>
              )}

              {branch.openingHours && (
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {branch.openingHours}
                </div>
              )}
            </div>

            {/* Thống kê thiết bị */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Số lượng thiết bị</span>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {branch.equipmentCount || 0}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => onView(branch)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                <Eye className="w-4 h-4" />
                Xem
              </button>

              {canUpdateBranch && (
                <button
                  onClick={() => onEdit(branch)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Sửa
                </button>
              )}

              {canUpdateBranch && (
                <button
                  onClick={() => handleToggleStatus(branch)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                    branch.status === 'active'
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                >
                  {branch.status === 'active' ? (
                    <>
                      <XCircle className="w-4 h-4" />
                      Ngừng
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Kích hoạt
                    </>
                  )}
                </button>
              )}

              {canDeleteBranch && (
                <button
                  onClick={() => handleDelete(branch.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Trống */}
      {filteredBranches.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Building2 className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              Không tìm thấy chi nhánh
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm || statusFilter !== 'all'
                ? 'Thử thay đổi bộ lọc tìm kiếm'
                : 'Chưa có chi nhánh nào trong hệ thống'}
            </p>
          </div>

          {!searchTerm && statusFilter === 'all' && canCreateBranch && (
            <button onClick={onAdd} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Thêm chi nhánh đầu tiên
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BranchList;
