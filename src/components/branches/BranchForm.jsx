import { useState, useEffect } from 'react';
import { X, Building2, Mail, Phone, MapPin, Clock, User } from 'lucide-react';
import { branchService } from '../../services/branchService';
import { userService } from '../../services/userService';
import { useNotification } from '../../contexts/NotificationContext';

const BranchForm = ({ branch, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    managerId: '',
    openingHours: '',
    status: 'active',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [managers, setManagers] = useState([]);
  const [errors, setErrors] = useState({});

  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    loadManagers();

    if (branch) {
      setFormData({
        name: branch.name || '',
        code: branch.code || '',
        address: branch.address || '',
        phone: branch.phone || '',
        email: branch.email || '',
        managerId: branch.managerId || '',
        openingHours: branch.openingHours || '',
        status: branch.status || 'active',
        description: branch.description || ''
      });
    }
  }, [branch]);

  const loadManagers = async () => {
    try {
      // Load danh sách manager và admin
      const [admins, managerUsers] = await Promise.all([
        userService.getUsersByRole('admin'),
        userService.getUsersByRole('manager')
      ]);
      setManagers([...admins, ...managerUsers].filter(u => u.status === 'active'));
    } catch (error) {
      console.error('Lỗi tải danh sách quản lý:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên chi nhánh là bắt buộc';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Mã chi nhánh là bắt buộc';
    } else if (!/^[A-Z0-9_-]+$/.test(formData.code)) {
      newErrors.code = 'Mã chi nhánh chỉ được chứa chữ IN HOA, số, dấu gạch ngang và gạch dưới';
    }

    if (formData.phone && !/^\d{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
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
      const submitData = {
        name: formData.name,
        code: formData.code,
        address: formData.address || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        managerId: formData.managerId || undefined,
        openingHours: formData.openingHours || undefined,
        status: formData.status,
        description: formData.description || undefined
      };

      if (branch) {
        await branchService.updateBranch(branch.id, submitData);
        showSuccess('Cập nhật chi nhánh thành công');
      } else {
        await branchService.addBranch(submitData);
        showSuccess('Thêm chi nhánh thành công');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Lỗi lưu chi nhánh:', error);

      if (error.response?.status === 409) {
        showError('Mã chi nhánh đã được sử dụng');
      } else if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else {
        showError(branch ? 'Không thể cập nhật chi nhánh' : 'Không thể tạo chi nhánh');
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

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {branch ? 'Chỉnh sửa chi nhánh' : 'Thêm chi nhánh mới'}
              </h2>
              <p className="text-sm text-gray-600">
                {branch ? 'Cập nhật thông tin chi nhánh' : 'Tạo chi nhánh mới'}
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
                    Tên chi nhánh *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="VD: Chi nhánh Quận 1"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Mã chi nhánh *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    disabled={!!branch} // Không cho sửa mã khi update
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.code ? 'border-red-500' : 'border-gray-300'
                    } ${branch ? 'bg-gray-100' : ''}`}
                    placeholder="VD: Q1, HN-CENTER"
                  />
                  {errors.code && (
                    <p className="text-red-500 text-sm mt-1">{errors.code}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Chỉ sử dụng chữ IN HOA, số, dấu gạch ngang và gạch dưới
                  </p>
                </div>
              </div>
            </div>

            {/* Thông tin liên hệ */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin liên hệ</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Địa chỉ
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập địa chỉ chi tiết"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Nhập số điện thoại"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Nhập địa chỉ email"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quản lý và vận hành */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quản lý và vận hành</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Người quản lý
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      name="managerId"
                      value={formData.managerId}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                      <option value="">Chưa chỉ định</option>
                      {managers.map(manager => (
                        <option key={manager.id} value={manager.id}>
                          {manager.fullName} ({manager.role === 'admin' ? 'Admin' : 'Manager'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Giờ mở cửa
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="openingHours"
                      value={formData.openingHours}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="VD: 06:00 - 22:00"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
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
                    <option value="inactive">Ngừng hoạt động</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mô tả */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Mô tả</h3>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Mô tả chi nhánh
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập mô tả về chi nhánh (tiện nghi, đặc điểm, v.v.)"
                />
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
            {loading ? 'Đang lưu...' : (branch ? 'Cập nhật' : 'Tạo chi nhánh')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BranchForm;
