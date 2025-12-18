import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Eye, EyeOff, Building2 } from 'lucide-react';
import { userService } from '../../services/userService';
import { branchService } from '../../services/branchService';
import { useNotification } from '../../contexts/NotificationContext';

const UserForm = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'user',
    status: 'active',
    password: '',
    confirmPassword: '',
    address: '',
    dateOfBirth: '',
    emergencyContact: '',
    notes: '',
    assignedBranchId: ''
  });

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        role: user.role || 'user',
        status: user.status || 'active',
        password: '',
        confirmPassword: '',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth || '',
        emergencyContact: user.emergencyContact || '',
        notes: user.notes || '',
        assignedBranchId: user.assignedBranchId || ''
      });
    }
  }, [user]);

  const loadBranches = async () => {
    try {
      const activeBranches = await branchService.getActiveBranches();
      setBranches(activeBranches);
    } catch (error) {
      console.error('Lỗi tải danh sách chi nhánh:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ tên là bắt buộc';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!user) { // Chỉ validate password khi tạo mới
      if (!formData.password) {
        newErrors.password = 'Mật khẩu là bắt buộc';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      }
    }

    if (formData.phoneNumber && !/^\d{10,11}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ';
    }

    // Validate branch for technician and receptionist
    if ((formData.role === 'technician' || formData.role === 'receptionist') && !formData.assignedBranchId) {
      newErrors.assignedBranchId = 'Chi nhánh là bắt buộc cho vai trò này';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (user) {
        // Cập nhật người dùng - gửi tất cả fields
        const updateData = {
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber || undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
          address: formData.address || undefined,
          emergencyContact: formData.emergencyContact || undefined,
          notes: formData.notes || undefined,
          role: formData.role,
          status: formData.status,
          assignedBranchId: (formData.role === 'technician' || formData.role === 'receptionist') ? formData.assignedBranchId : null
        };

        await userService.updateUser(user.id, updateData);
        showSuccess('Cập nhật tài khoản thành công');
      } else {
        // Tạo tài khoản mới qua API backend - gửi tất cả fields
        const userData = {
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber || undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
          address: formData.address || undefined,
          emergencyContact: formData.emergencyContact || undefined,
          notes: formData.notes || undefined,
          role: formData.role,
          status: formData.status,
          assignedBranchId: (formData.role === 'technician' || formData.role === 'receptionist') ? formData.assignedBranchId : undefined
        };

        await userService.addUser(userData);
        showSuccess('Tạo tài khoản thành công');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Lỗi lưu tài khoản:', error);

      // Xử lý các lỗi cụ thể từ backend
      if (error.response?.status === 409) {
        showError('Email đã được sử dụng');
      } else if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else {
        showError(user ? 'Không thể cập nhật tài khoản' : 'Không thể tạo tài khoản');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error khi user nhập lại
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const roles = [
    { value: 'user', label: 'Người dùng', description: 'Sử dụng thiết bị cơ bản' },
    { value: 'receptionist', label: 'Lễ tân', description: 'Tiếp nhận và báo cáo sự cố' },
    { value: 'technician', label: 'Kỹ thuật viên', description: 'Bảo trì và sửa chữa thiết bị' },
    { value: 'manager', label: 'Quản lý', description: 'Quản lý hoạt động và báo cáo' },
    { value: 'admin', label: 'Quản trị viên', description: 'Toàn quyền hệ thống' }
  ];

  const showBranchSelection = formData.role === 'technician' || formData.role === 'receptionist';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
              </h2>
              <p className="text-sm text-gray-600">
                {user ? 'Cập nhật thông tin tài khoản' : 'Tạo tài khoản người dùng mới'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-6">
            {/* Thông tin cơ bản */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.fullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nhập họ và tên"
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!!user} // Không cho sửa email khi update
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      } ${user ? 'bg-gray-100' : ''}`}
                      placeholder="Nhập địa chỉ email"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Mật khẩu (chỉ hiện khi tạo mới) */}
            {!user && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Bảo mật</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Mật khẩu *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Nhập mật khẩu"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Xác nhận mật khẩu *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Nhập lại mật khẩu"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Phân quyền */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Phân quyền và trạng thái</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Vai trò
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    {roles.find(r => r.value === formData.role)?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Trạng thái
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Vô hiệu hóa</option>
                  </select>
                </div>

                {/* Branch Selection - Show for Technician and Receptionist */}
                {showBranchSelection && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Chi nhánh làm việc *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        name="assignedBranchId"
                        value={formData.assignedBranchId}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.assignedBranchId ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">-- Chọn chi nhánh --</option>
                        {branches.map(branch => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name} {branch.address ? `- ${branch.address}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.assignedBranchId && (
                      <p className="text-red-500 text-sm mt-1">{errors.assignedBranchId}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.role === 'technician'
                        ? 'Kỹ thuật viên chỉ xem và xử lý thiết bị thuộc chi nhánh được phân công'
                        : 'Lễ tân chỉ quản lý thiết bị và sự cố thuộc chi nhánh được phân công'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Thông tin bổ sung */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin bổ sung</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập địa chỉ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Liên hệ khẩn cấp
                  </label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tên và số điện thoại người liên hệ khẩn cấp"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Ghi chú
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ghi chú thêm về người dùng"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang lưu...' : (user ? 'Cập nhật' : 'Tạo tài khoản')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserForm;
