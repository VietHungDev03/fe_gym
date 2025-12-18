import { useState, useEffect } from 'react';
import { X, Save, RefreshCw } from 'lucide-react';
import { equipmentService } from '../../services/equipmentService';
import { branchService } from '../../services/branchService';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../ui/LoadingSpinner';

const EquipmentForm = ({ equipment, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    branchId: '', // Thay đổi từ location sang branchId
    location: '', // Vị trí cụ thể trong chi nhánh
    specifications: '',
    purchaseDate: '',
    warrantyExpiry: '',
    maintenanceInterval: 30, // Ngày
    qrCode: '',
    status: 'active'
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [branches, setBranches] = useState([]);

  const isEdit = !!equipment;
  const { showError, showSuccess } = useNotification();

  // Load danh sách chi nhánh
  useEffect(() => {
    loadBranches();
  }, []);

  // Load dữ liệu khi edit
  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name || '',
        type: equipment.type || '',
        description: equipment.description || '',
        branchId: equipment.branchId || '',
        location: equipment.location || '',
        specifications: equipment.specifications || '',
        purchaseDate: equipment.purchaseDate || '',
        warrantyExpiry: equipment.warrantyExpiry || '',
        maintenanceInterval: equipment.maintenanceInterval || 30,
        qrCode: equipment.qrCode || '',
        status: equipment.status || 'active'
      });
    }
  }, [equipment]);

  const loadBranches = async () => {
    try {
      const data = await branchService.getActiveBranches();
      setBranches(data);
    } catch (error) {
      console.error('Lỗi tải danh sách chi nhánh:', error);
      showError('Không thể tải danh sách chi nhánh');
    }
  };

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Xóa lỗi khi user bắt đầu nhập
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Tạo mã QR tự động
  const generateQRCode = () => {
    const code = equipmentService.generateQRCode(Date.now().toString());
    setFormData(prev => ({
      ...prev,
      qrCode: code
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên thiết bị là bắt buộc';
    }

    if (!formData.type.trim()) {
      newErrors.type = 'Loại thiết bị là bắt buộc';
    }

    if (!formData.branchId) {
      newErrors.branchId = 'Chi nhánh là bắt buộc';
    }

    if (!formData.qrCode.trim()) {
      newErrors.qrCode = 'Mã QR/RFID là bắt buộc';
    }

    if (formData.maintenanceInterval && formData.maintenanceInterval < 1) {
      newErrors.maintenanceInterval = 'Chu kỳ bảo trì phải lớn hơn 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Xử lý submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await equipmentService.updateEquipment(equipment.id, formData);
        showSuccess('Cập nhật thiết bị thành công');
      } else {
        await equipmentService.createEquipment(formData);
        showSuccess('Thêm thiết bị thành công');
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Lỗi lưu thiết bị:', error);
      showError(isEdit ? 'Không thể cập nhật thiết bị' : 'Không thể thêm thiết bị');
    } finally {
      setLoading(false);
    }
  };

  const equipmentTypes = [
    'Máy chạy bộ',
    'Máy tập tạ',
    'Xe đạp tập thể dục',
    'Máy chèo thuyền',
    'Máy tập bụng',
    'Máy tập vai',
    'Máy tập chân',
    'Dụng cụ cardio',
    'Tạ đơn',
    'Tạ kép',
    'Khác'
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-primary">
            {isEdit ? 'Chỉnh sửa thiết bị' : 'Thêm thiết bị mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tên thiết bị */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Tên thiết bị *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ví dụ: Máy chạy bộ Life Fitness T3"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Loại thiết bị */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Loại thiết bị *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.type ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Chọn loại thiết bị</option>
              {equipmentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
          </div>

          {/* Mã QR/RFID */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Mã QR/RFID *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="qrCode"
                value={formData.qrCode}
                onChange={handleChange}
                className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.qrCode ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Nhập mã hoặc tạo tự động"
              />
              <button
                type="button"
                onClick={generateQRCode}
                className="btn-secondary flex items-center gap-1 px-3"
              >
                <RefreshCw className="w-4 h-4" />
                Tạo mã
              </button>
            </div>
            {errors.qrCode && <p className="text-red-500 text-sm mt-1">{errors.qrCode}</p>}
          </div>

          {/* Chi nhánh */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Chi nhánh *
              </label>
              <select
                name="branchId"
                value={formData.branchId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.branchId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Chọn chi nhánh</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              {errors.branchId && <p className="text-red-500 text-sm mt-1">{errors.branchId}</p>}
            </div>

            {/* Vị trí cụ thể trong chi nhánh */}
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Vị trí cụ thể
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="VD: Khu vực Cardio - Tầng 1"
              />
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Mô tả
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mô tả chi tiết về thiết bị..."
            />
          </div>

          {/* Thông số kỹ thuật */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Thông số kỹ thuật
            </label>
            <textarea
              name="specifications"
              value={formData.specifications}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Công suất, kích thước, trọng lượng..."
            />
          </div>

          {/* Grid 2 cột */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ngày mua */}
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Ngày mua
              </label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Hết hạn bảo hành */}
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Hết hạn bảo hành
              </label>
              <input
                type="date"
                name="warrantyExpiry"
                value={formData.warrantyExpiry}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chu kỳ bảo trì */}
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Chu kỳ bảo trì (ngày)
              </label>
              <input
                type="number"
                name="maintenanceInterval"
                value={formData.maintenanceInterval}
                onChange={handleChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.maintenanceInterval ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="30"
              />
              {errors.maintenanceInterval && <p className="text-red-500 text-sm mt-1">{errors.maintenanceInterval}</p>}
            </div>

            {/* Trạng thái */}
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Trạng thái
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Hoạt động</option>
                <option value="maintenance">Bảo trì</option>
                <option value="inactive">Ngừng hoạt động</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEdit ? 'Cập nhật' : 'Thêm thiết bị'}
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EquipmentForm;