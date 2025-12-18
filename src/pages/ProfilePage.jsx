import { useState, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Briefcase,
  Calendar, Edit3, Save, X, Eye, EyeOff,
  Shield, Clock, Trophy
} from 'lucide-react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const ProfilePage = () => {
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Profile form data
  const [profileData, setProfileData] = useState({
    displayName: '',
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
    emergencyContact: '',
    notes: ''
  });

  // Password form data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (userProfile) {
      console.log('UserProfile data:', userProfile); // Debug log
      setProfileData({
        displayName: userProfile.fullName || userProfile.displayName || '',
        phoneNumber: userProfile.phoneNumber || '',
        address: userProfile.address || '',
        dateOfBirth: userProfile.dateOfBirth || '',
        emergencyContact: userProfile.emergencyContact || '',
        notes: userProfile.notes || ''
      });
    } else {
      console.log('UserProfile is null/undefined'); // Debug log
    }
  }, [userProfile]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (!profileData.displayName.trim()) {
      showError('Vui lòng nhập tên hiển thị');
      return;
    }

    try {
      setLoading(true);

      // Update user profile through API
      await authService.updateProfile(userProfile.id, {
        fullName: profileData.displayName,
        phoneNumber: profileData.phoneNumber || undefined,
        address: profileData.address || undefined,
        dateOfBirth: profileData.dateOfBirth || undefined,
        emergencyContact: profileData.emergencyContact || undefined,
        notes: profileData.notes || undefined
      });

      // Refresh user profile data
      await refreshUserProfile();

      showSuccess('Cập nhật thông tin thành công!');
      setEditMode(false);
    } catch (error) {
      console.error('Lỗi cập nhật profile:', error);
      if (error.response?.status === 400) {
        showError(error.response?.data?.message || 'Dữ liệu không hợp lệ');
      } else {
        showError('Không thể cập nhật thông tin. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setLoading(true);

      // Change password through API
      await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      showSuccess('Đổi mật khẩu thành công!');
      setChangePasswordMode(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Lỗi đổi mật khẩu:', error);

      if (error.response?.status === 400) {
        const message = error.response?.data?.message;
        if (message?.includes('incorrect') || message?.includes('wrong')) {
          showError('Mật khẩu hiện tại không chính xác');
        } else {
          showError(message || 'Dữ liệu không hợp lệ');
        }
      } else if (error.response?.status === 429) {
        showError('Quá nhiều lần thử. Vui lòng thử lại sau');
      } else {
        showError('Không thể đổi mật khẩu. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      admin: 'Quản trị viên',
      manager: 'Quản lý',
      technician: 'Kỹ thuật viên',
      user: 'Người dùng'
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role) => {
    const roleColors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      technician: 'bg-green-100 text-green-800',
      user: 'bg-gray-100 text-gray-800'
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800';
  };

  if (!userProfile) {
    return <LoadingSpinner className="py-8" size="lg" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">
            Thông tin cá nhân
          </h1>
          <p className="text-secondary mt-1">
            Quản lý thông tin tài khoản và bảo mật
          </p>
        </div>
      </div>

      {/* Profile Information Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            Thông tin cá nhân
          </h2>
          {!editMode && (
            <button
              onClick={() => {
                // Load current data vào form khi bắt đầu edit
                setProfileData({
                  displayName: userProfile?.fullName || userProfile?.displayName || '',
                  phoneNumber: userProfile?.phoneNumber || '',
                  address: userProfile?.address || '',
                  dateOfBirth: userProfile?.dateOfBirth || '',
                  emergencyContact: userProfile?.emergencyContact || '',
                  notes: userProfile?.notes || ''
                });
                setEditMode(true);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Chỉnh sửa
            </button>
          )}
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên hiển thị
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={profileData.displayName}
                  onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập tên hiển thị"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    {userProfile?.fullName || userProfile?.displayName || 'Chưa cập nhật'}
                   
                  </span>
                </div>
              )}
            </div>

            {/* Email (readonly) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">{currentUser.email}</span>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại
              </label>
              {editMode ? (
                <input
                  type="tel"
                  value={profileData.phoneNumber}
                  onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập số điện thoại"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{userProfile.phoneNumber || 'Chưa cập nhật'}</span>
                </div>
              )}
            </div>

            {/* Role (readonly) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vai trò
              </label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(userProfile.role)}`}>
                  {getRoleDisplayName(userProfile.role)}
                </span>
              </div>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={profileData.address}
                  onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập địa chỉ"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{userProfile.address || 'Chưa cập nhật'}</span>
                </div>
              )}
            </div>

            {/* Department field removed - not supported in backend */}

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày sinh
              </label>
              {editMode ? (
                <input
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={(e) => setProfileData({...profileData, dateOfBirth: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    {userProfile.dateOfBirth 
                      ? new Date(userProfile.dateOfBirth).toLocaleDateString('vi-VN') 
                      : 'Chưa cập nhật'}
                  </span>
                </div>
              )}
            </div>

            {/* Emergency Contact */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Liên hệ khẩn cấp
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={profileData.emergencyContact}
                  onChange={(e) => setProfileData({...profileData, emergencyContact: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập thông tin liên hệ khẩn cấp"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{userProfile.emergencyContact || 'Chưa cập nhật'}</span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú
              </label>
              {editMode ? (
                <textarea
                  value={profileData.notes}
                  onChange={(e) => setProfileData({...profileData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ghi chú thêm về người dùng"
                />
              ) : (
                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-md min-h-[80px]">
                  <span className="text-gray-900">{userProfile.notes || 'Chưa có ghi chú'}</span>
                </div>
              )}
            </div>

            {/* Created At */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày tạo tài khoản
              </label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">
                  {userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {editMode && (
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading && <LoadingSpinner size="sm" />}
                <Save className="w-4 h-4" />
                Lưu thay đổi
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  setProfileData({
                    displayName: userProfile.fullName || userProfile.displayName || '',
                    phoneNumber: userProfile.phoneNumber || '',
                    address: userProfile.address || '',
                    dateOfBirth: userProfile.dateOfBirth || '',
                    emergencyContact: userProfile.emergencyContact || '',
                    notes: userProfile.notes || ''
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Hủy
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Change Password Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Đổi mật khẩu
          </h2>
          {!changePasswordMode && (
            <button
              onClick={() => setChangePasswordMode(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Đổi mật khẩu
            </button>
          )}
        </div>

        {changePasswordMode ? (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu hiện tại
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Nhập mật khẩu hiện tại"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Nhập lại mật khẩu mới"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading && <LoadingSpinner size="sm" />}
                <Save className="w-4 h-4" />
                Đổi mật khẩu
              </button>
              <button
                type="button"
                onClick={() => {
                  setChangePasswordMode(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Hủy
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Bảo mật tài khoản</h3>
            <p className="text-sm text-gray-500">
              Đổi mật khẩu thường xuyên để bảo vệ tài khoản của bạn
            </p>
          </div>
        )}
      </div>

      {/* Account Activity */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-500" />
          Hoạt động tài khoản
        </h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Lần đăng nhập cuối</span>
            <span className="text-sm font-medium text-gray-900">
              {userProfile?.lastLoginAt
                ? new Date(userProfile.lastLoginAt).toLocaleString('vi-VN')
                : 'Chưa có thông tin'
              }
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Ngày tạo tài khoản</span>
            <span className="text-sm font-medium text-gray-900">
              {userProfile?.createdAt
                ? new Date(userProfile.createdAt).toLocaleString('vi-VN')
                : 'Chưa có thông tin'
              }
            </span>
          </div>
          {/* Email verification không có trong backend NestJS */}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;