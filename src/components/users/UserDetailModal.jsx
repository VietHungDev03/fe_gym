import { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Shield,
  UserCheck,
  UserX,
  AlertCircle,
  Edit,
  Clock,
  FileText,
  Building2,
  KeyRound
} from 'lucide-react';
import { userService } from '../../services/userService';
import { branchService } from '../../services/branchService';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

const UserDetailModal = ({ user, onClose, onEdit }) => {
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [branchInfo, setBranchInfo] = useState(null);
  const [resetting, setResetting] = useState(false);

  const { showError, showSuccess } = useNotification();
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';

  // Load thông tin chi nhánh nếu user có assignedBranchId
  useEffect(() => {
    const loadBranchInfo = async () => {
      if (currentUser.assignedBranchId) {
        const branch = await branchService.getBranchByIdSilent(currentUser.assignedBranchId);
        setBranchInfo(branch);
      }
    };
    loadBranchInfo();
  }, [currentUser.assignedBranchId]);

  const handleToggleStatus = async () => {
    const newStatus = currentUser.status === 'active' ? 'inactive' : 'active';
    
    try {
      setLoading(true);
      await userService.updateUser(currentUser.id, { status: newStatus });
      
      setCurrentUser(prev => ({ ...prev, status: newStatus }));
      showSuccess(`${newStatus === 'active' ? 'Kích hoạt' : 'Vô hiệu hóa'} tài khoản thành công`);
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);
      showError('Không thể cập nhật trạng thái tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const confirmReset = window.confirm(
      `Bạn có chắc muốn đặt lại mật khẩu của ${currentUser.email} về mặc định "123456"?`
    );
    if (!confirmReset) return;

    try {
      setResetting(true);
      await userService.resetPassword(currentUser.id);
      showSuccess('Đã đặt lại mật khẩu về 123456');
    } catch (error) {
      console.error('Lỗi đặt lại mật khẩu:', error);
      showError('Không thể đặt lại mật khẩu');
    } finally {
      setResetting(false);
    }
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSimpleDate = (timestamp) => {
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

    return date.toLocaleDateString('vi-VN');
  };

  const getRoleInfo = (role) => {
    const configs = {
      admin: { label: 'Quản trị viên', class: 'bg-red-100 text-red-800', icon: Shield, description: 'Toàn quyền hệ thống' },
      manager: { label: 'Quản lý', class: 'bg-purple-100 text-purple-800', icon: Shield, description: 'Quản lý hoạt động và báo cáo' },
      technician: { label: 'Kỹ thuật viên', class: 'bg-blue-100 text-blue-800', icon: User, description: 'Bảo trì và sửa chữa thiết bị' },
      receptionist: { label: 'Lễ tân', class: 'bg-teal-100 text-teal-800', icon: User, description: 'Tiếp nhận và báo cáo sự cố' },
      user: { label: 'Người dùng', class: 'bg-gray-100 text-gray-800', icon: User, description: 'Sử dụng thiết bị cơ bản' }
    };
    return configs[role] || configs.user;
  };

  const getStatusInfo = (status) => {
    const configs = {
      active: { label: 'Hoạt động', class: 'bg-green-100 text-green-800', icon: UserCheck },
      inactive: { label: 'Vô hiệu hóa', class: 'bg-red-100 text-red-800', icon: UserX }
    };
    return configs[status] || configs.active;
  };

  const roleInfo = getRoleInfo(currentUser.role);
  const statusInfo = getStatusInfo(currentUser.status);
  const RoleIcon = roleInfo.icon;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary">
                {currentUser.fullName || 'Chưa có tên'}
              </h2>
              <p className="text-secondary flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" />
                {currentUser.email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => onEdit(currentUser)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Chỉnh sửa
            </button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cột trái - Thông tin cơ bản */}
            <div className="lg:col-span-2 space-y-6">
              {/* Thông tin cá nhân */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Thông tin cá nhân
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-secondary">Họ và tên</p>
                      <p className="font-medium text-primary">
                        {currentUser.fullName || 'Chưa cập nhật'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-secondary">Email</p>
                      <p className="font-medium text-primary">{currentUser.email}</p>
                    </div>
                  </div>

                  {currentUser.phoneNumber && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-secondary">Số điện thoại</p>
                        <p className="font-medium text-primary">{currentUser.phoneNumber}</p>
                      </div>
                    </div>
                  )}

                  {currentUser.dateOfBirth && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-secondary">Ngày sinh</p>
                        <p className="font-medium text-primary">{formatSimpleDate(currentUser.dateOfBirth)}</p>
                      </div>
                    </div>
                  )}

                  {currentUser.address && (
                    <div className="flex items-start gap-3 md:col-span-2">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-secondary">Địa chỉ</p>
                        <p className="font-medium text-primary">{currentUser.address}</p>
                      </div>
                    </div>
                  )}

                  {currentUser.emergencyContact && (
                    <div className="flex items-start gap-3 md:col-span-2">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-secondary">Liên hệ khẩn cấp</p>
                        <p className="font-medium text-primary">{currentUser.emergencyContact}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ghi chú */}
              {currentUser.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Ghi chú
                  </h3>
                  <p className="text-secondary whitespace-pre-wrap">{currentUser.notes}</p>
                </div>
              )}
            </div>

            {/* Cột phải - Trạng thái và thông tin hệ thống */}
            <div className="space-y-6">
              {/* Vai trò và trạng thái */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-primary mb-4">Phân quyền</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-secondary mb-2">Vai trò</p>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${roleInfo.class}`}>
                        <RoleIcon className="w-4 h-4" />
                        {roleInfo.label}
                      </span>
                    </div>
                    <p className="text-xs text-secondary mt-1">{roleInfo.description}</p>
                  </div>

                  <div>
                    <p className="text-sm text-secondary mb-2">Trạng thái</p>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${statusInfo.class}`}>
                        <StatusIcon className="w-4 h-4" />
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Chi nhánh được phân công */}
                  {(currentUser.role === 'technician' || currentUser.role === 'receptionist') && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-secondary mb-2">Chi nhánh làm việc</p>
                      {branchInfo ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-blue-800">{branchInfo.name}</span>
                          </div>
                          {branchInfo.address && (
                            <p className="text-xs text-blue-600 ml-6">{branchInfo.address}</p>
                          )}
                          {branchInfo.phone && (
                            <p className="text-xs text-blue-600 ml-6 mt-1">
                              <Phone className="w-3 h-3 inline mr-1" />
                              {branchInfo.phone}
                            </p>
                          )}
                        </div>
                      ) : currentUser.assignedBranchId ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <p className="text-sm text-gray-500">Đang tải thông tin chi nhánh...</p>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm text-yellow-700">Chưa được phân công chi nhánh</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Nút thay đổi trạng thái */}
                {currentUser.role !== 'admin' && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleToggleStatus}
                      disabled={loading}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentUser.status === 'active'
                          ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                          : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                      }`}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                          Đang cập nhật...
                        </>
                      ) : currentUser.status === 'active' ? (
                        <>
                          <UserX className="w-4 h-4" />
                          Vô hiệu hóa tài khoản
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4" />
                          Kích hoạt tài khoản
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Reset mật khẩu */}
                {isAdmin && (
                  <div className="mt-4">
                    <button
                      onClick={handleResetPassword}
                      disabled={resetting}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 disabled:opacity-60"
                    >
                      <KeyRound className="w-4 h-4" />
                      {resetting ? 'Đang đặt lại...' : 'Đặt lại mật khẩu (123456)'}
                    </button>
                  </div>
                )}
              </div>

              {/* Thông tin hệ thống */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Thông tin hệ thống
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-secondary">Tạo lúc</p>
                    <p className="text-sm font-medium text-primary">
                      {formatDate(currentUser.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-secondary">Cập nhật lúc</p>
                    <p className="text-sm font-medium text-primary">
                      {formatDate(currentUser.updatedAt)}
                    </p>
                  </div>

                  {currentUser.lastLoginAt && (
                    <div>
                      <p className="text-sm text-secondary">Đăng nhập cuối</p>
                      <p className="text-sm font-medium text-primary">
                        {formatDate(currentUser.lastLoginAt)}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-secondary">ID tài khoản</p>
                    <p className="text-xs font-mono bg-gray-200 px-2 py-1 rounded mt-1 break-all">
                      {currentUser.id}
                    </p>
                  </div>

                  {currentUser.uid && (
                    <div>
                      <p className="text-sm text-secondary">Firebase UID</p>
                      <p className="text-xs font-mono bg-gray-200 px-2 py-1 rounded mt-1 break-all">
                        {currentUser.uid}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Đóng
          </button>
          <button
            onClick={() => onEdit(currentUser)}
            className="btn-primary"
          >
            Chỉnh sửa thông tin
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
