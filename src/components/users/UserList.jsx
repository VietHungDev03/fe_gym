import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, User, Shield, ShieldCheck, UserCheck, UserX, Users, Calendar, Clock, Phone, Building2, KeyRound } from 'lucide-react';
import { userService } from '../../services/userService';
import { branchService } from '../../services/branchService';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS, hasPermission } from '../../utils/permissions';

const UserList = ({ onAdd, onEdit, onView }) => {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [resettingId, setResettingId] = useState(null);

  const { showError, showSuccess } = useNotification();
  const { userProfile } = useAuth();

  // Kiểm tra quyền hạn
  const canCreateUser = hasPermission(userProfile?.role, PERMISSIONS.USER_CREATE);
  const canUpdateUser = hasPermission(userProfile?.role, PERMISSIONS.USER_UPDATE);
  const canDeleteUser = hasPermission(userProfile?.role, PERMISSIONS.USER_DELETE);
  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, branchesData] = await Promise.all([
        userService.getAllUsers(),
        branchService.getAllBranches()
      ]);
      setUsers(usersData);
      setBranches(branchesData);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      showError('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Helper để lấy tên chi nhánh từ ID
  const getBranchName = (branchId) => {
    if (!branchId) return null;
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : null;
  };

  const loadUsers = async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Lỗi tải danh sách người dùng:', error);
      showError('Không thể tải danh sách người dùng');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa tài khoản này?')) {
      try {
        await userService.deleteUser(id);
        setUsers(prev => prev.filter(user => user.id !== id));
        showSuccess('Xóa tài khoản thành công');
      } catch (error) {
        console.error('Lỗi xóa tài khoản:', error);
        showError('Không thể xóa tài khoản');
      }
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await userService.updateUser(user.id, { status: newStatus });
      setUsers(prev => 
        prev.map(u => 
          u.id === user.id 
            ? { ...u, status: newStatus }
            : u
        )
      );
      showSuccess(`${newStatus === 'active' ? 'Kích hoạt' : 'Vô hiệu hóa'} tài khoản thành công`);
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);
      showError('Không thể cập nhật trạng thái tài khoản');
    }
  };

  const handleResetPassword = async (user) => {
    const confirmReset = window.confirm(
      `Đặt lại mật khẩu cho ${user.email} về mặc định "123456"?`
    );

    if (!confirmReset) return;

    try {
      setResettingId(user.id);
      await userService.resetPassword(user.id);
      showSuccess('Đã đặt lại mật khẩu về 123456');
    } catch (error) {
      console.error('Lỗi đặt lại mật khẩu:', error);
      showError('Không thể đặt lại mật khẩu');
    } finally {
      setResettingId(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || (
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const RoleBadge = ({ role }) => {
    const configs = {
      admin: { label: 'Quản trị viên', class: 'bg-red-100 text-red-800', icon: ShieldCheck },
      manager: { label: 'Quản lý', class: 'bg-purple-100 text-purple-800', icon: Shield },
      technician: { label: 'Kỹ thuật viên', class: 'bg-blue-100 text-blue-800', icon: User },
      receptionist: { label: 'Lễ tân', class: 'bg-teal-100 text-teal-800', icon: User },
      user: { label: 'Người dùng', class: 'bg-gray-100 text-gray-800', icon: User }
    };
    
    const config = configs[role] || configs.user;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const StatusBadge = ({ status }) => {
    const configs = {
      active: { label: 'Hoạt động', class: 'bg-green-100 text-green-800', icon: UserCheck },
      inactive: { label: 'Vô hiệu hóa', class: 'bg-red-100 text-red-800', icon: UserX }
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

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Không xác định';
    
    let date;
    if (timestamp?.toDate) {
      // Firebase Timestamp
      date = timestamp;
    } else if (timestamp?.seconds) {
      // Firebase Timestamp object
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string') {
      // ISO string
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      // Already a Date object
      date = timestamp;
    } else {
      return 'Không xác định';
    }

    if (isNaN(date.getTime())) return 'Không xác định';

    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (loading) {
    return <LoadingSpinner className="py-8" size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-semibold text-primary">
          Quản lý tài khoản
        </h2>
        
        <div className="flex items-center gap-3">
          {canCreateUser && (
            <button
              onClick={onAdd}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Thêm tài khoản
            </button>
          )}
        </div>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Tổng tài khoản</p>
              <p className="text-2xl font-bold text-blue-700">{users.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Đang hoạt động</p>
              <p className="text-2xl font-bold text-green-700">
                {users.filter(user => user.status === 'active').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Quản trị viên</p>
              <p className="text-2xl font-bold text-red-700">
                {users.filter(user => user.role === 'admin').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">Kỹ thuật viên</p>
              <p className="text-2xl font-bold text-purple-700">
                {users.filter(user => user.role === 'technician').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tìm kiếm và bộ lọc */}
      <div className="card-standard">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Tìm kiếm */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Bộ lọc vai trò */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Quản trị viên</option>
            <option value="manager">Quản lý</option>
            <option value="technician">Kỹ thuật viên</option>
            <option value="receptionist">Lễ tân</option>
            <option value="user">Người dùng</option>
          </select>

          {/* Bộ lọc trạng thái */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Vô hiệu hóa</option>
          </select>

          {/* Hiển thị kết quả */}
          <div className="flex items-center px-3 py-2 bg-gray-50 rounded-md text-sm text-secondary">
            <span>Hiển thị: {filteredUsers.length}/{users.length}</span>
          </div>
        </div>
      </div>

      {/* Danh sách người dùng */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div key={user.id} className="card-standard hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-primary text-lg mb-1">
                    {user.fullName || 'Chưa có tên'}
                  </h3>
                  <p className="text-sm text-secondary">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <RoleBadge role={user.role} />
                <StatusBadge status={user.status} />
              </div>
            </div>

            {/* Thông tin chi tiết */}
            <div className="space-y-2 mb-4">
              {user.phoneNumber && (
                <div className="text-sm text-secondary flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {user.phoneNumber}
                </div>
              )}

              {/* Hiển thị chi nhánh cho technician và receptionist */}
              {(user.role === 'technician' || user.role === 'receptionist') && (
                <div className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  {getBranchName(user.assignedBranchId) ? (
                    <span className="text-blue-600 font-medium">{getBranchName(user.assignedBranchId)}</span>
                  ) : (
                    <span className="text-yellow-600">Chưa phân chi nhánh</span>
                  )}
                </div>
              )}

              <div className="text-sm text-secondary flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Tham gia: {formatDate(user.createdAt)}
              </div>

              {user.lastLoginAt && (
                <div className="text-sm text-secondary flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Đăng nhập cuối: {formatDate(user.lastLoginAt)}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => onView(user)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                <Eye className="w-4 h-4" />
                Xem
              </button>
              
              {canUpdateUser && (
                <button
                  onClick={() => onEdit(user)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Sửa
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => handleResetPassword(user)}
                  disabled={resettingId === user.id}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-md transition-colors disabled:opacity-60"
                >
                  <KeyRound className="w-4 h-4" />
                  {resettingId === user.id ? 'Đang đặt lại...' : 'Reset mật khẩu'}
                </button>
              )}

              {canUpdateUser && (
                <button
                  onClick={() => handleToggleStatus(user)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                    user.status === 'active' 
                      ? 'text-red-600 hover:bg-red-50' 
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                >
                  {user.status === 'active' ? (
                    <>
                      <UserX className="w-4 h-4" />
                      Vô hiệu hóa
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Kích hoạt
                    </>
                  )}
                </button>
              )}
              
              {canDeleteUser && user.role !== 'admin' && (
                <button
                  onClick={() => handleDelete(user.id)}
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
      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <User className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              Không tìm thấy tài khoản
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Thử thay đổi bộ lọc tìm kiếm' 
                : 'Chưa có tài khoản nào trong hệ thống'}
            </p>
          </div>
          
          {!searchTerm && roleFilter === 'all' && statusFilter === 'all' && (
            <button onClick={onAdd} className="btn-primary">
              Thêm tài khoản đầu tiên
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default UserList;
