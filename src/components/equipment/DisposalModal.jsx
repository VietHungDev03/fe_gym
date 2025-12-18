import { useState } from 'react';
import { X, AlertTriangle, Calendar, FileText, Trash2, Clock, Archive } from 'lucide-react';
import { equipmentService } from '../../services/equipmentService';
import { useNotification } from '../../contexts/NotificationContext';

// Các trạng thái thanh lý
const liquidationStatuses = [
  {
    value: 'preparing_liquidation',
    label: 'Chuẩn bị thanh lý',
    description: 'Thiết bị được đánh dấu để chuẩn bị thanh lý, vẫn có thể quay lại trạng thái hoạt động',
    icon: Clock,
    color: 'yellow',
  },
  {
    value: 'pending_liquidation',
    label: 'Chờ thanh lý',
    description: 'Thiết bị đang chờ được phê duyệt thanh lý chính thức',
    icon: Archive,
    color: 'orange',
  },
  {
    value: 'disposed',
    label: 'Đã thanh lý',
    description: 'Thanh lý ngay - Hành động này KHÔNG THỂ HOÀN TÁC!',
    icon: Trash2,
    color: 'red',
  },
];

const DisposalModal = ({ equipment, onClose, onDisposed }) => {
  const [formData, setFormData] = useState({
    disposalReason: '',
    disposalDate: new Date().toISOString().split('T')[0], // Ngày hôm nay
    liquidationStatus: 'preparing_liquidation', // Mặc định là chuẩn bị thanh lý
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { showError, showSuccess } = useNotification();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error khi user nhập
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // Lý do thanh lý luôn bắt buộc
    if (!formData.disposalReason.trim()) {
      newErrors.disposalReason = 'Lý do thanh lý là bắt buộc';
    } else if (formData.disposalReason.trim().length < 10) {
      newErrors.disposalReason = 'Lý do thanh lý phải có ít nhất 10 ký tự';
    }

    // Ngày thanh lý chỉ bắt buộc khi trạng thái là "disposed"
    if (formData.liquidationStatus === 'disposed' && !formData.disposalDate) {
      newErrors.disposalDate = 'Ngày thanh lý là bắt buộc khi chọn "Đã thanh lý"';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const selectedStatus = liquidationStatuses.find(s => s.value === formData.liquidationStatus);
  const isDisposedStatus = formData.liquidationStatus === 'disposed';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    // Tạo message xác nhận dựa vào trạng thái
    let confirmMessage = `Bạn có chắc chắn muốn chuyển thiết bị "${equipment.name}" sang trạng thái "${selectedStatus.label}"?\n\n`;
    confirmMessage += `Lý do: ${formData.disposalReason}\n`;

    if (isDisposedStatus) {
      confirmMessage += `Ngày thanh lý: ${new Date(formData.disposalDate).toLocaleDateString('vi-VN')}\n\n`;
      confirmMessage += `⚠️ CẢNH BÁO: Hành động này KHÔNG THỂ HOÀN TÁC!`;
    } else {
      confirmMessage += `\nBạn có thể thay đổi trạng thái này sau trong phần "Lịch sử thanh lý".`;
    }

    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    try {
      setLoading(true);

      if (isDisposedStatus) {
        // Thanh lý trực tiếp
        await equipmentService.disposeEquipment(equipment.id, {
          disposalReason: formData.disposalReason,
          disposalDate: formData.disposalDate,
        });
        showSuccess('Thanh lý thiết bị thành công!');
      } else {
        // Cập nhật trạng thái thanh lý (preparing hoặc pending)
        await equipmentService.updateLiquidationStatus(equipment.id, {
          status: formData.liquidationStatus,
          disposalReason: formData.disposalReason,
        });
        showSuccess(`Đã chuyển thiết bị sang trạng thái "${selectedStatus.label}"`);
      }

      onDisposed();
      onClose();
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái thanh lý:', error);
      const message = error.response?.data?.message || 'Không thể cập nhật trạng thái thiết bị';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!equipment) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header - màu động theo trạng thái */}
        <div className={`flex items-center justify-between p-6 border-b border-gray-200 ${
          isDisposedStatus ? 'bg-red-50' : selectedStatus?.color === 'orange' ? 'bg-orange-50' : 'bg-yellow-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isDisposedStatus ? 'bg-red-100' : selectedStatus?.color === 'orange' ? 'bg-orange-100' : 'bg-yellow-100'
            }`}>
              {selectedStatus && <selectedStatus.icon className={`w-6 h-6 ${
                isDisposedStatus ? 'text-red-600' : selectedStatus?.color === 'orange' ? 'text-orange-600' : 'text-yellow-600'
              }`} />}
            </div>
            <div>
              <h2 className={`text-2xl font-semibold ${
                isDisposedStatus ? 'text-red-900' : selectedStatus?.color === 'orange' ? 'text-orange-900' : 'text-yellow-900'
              }`}>
                Thanh lý thiết bị
              </h2>
              <p className={`text-sm mt-1 ${
                isDisposedStatus ? 'text-red-700' : selectedStatus?.color === 'orange' ? 'text-orange-700' : 'text-yellow-700'
              }`}>
                {isDisposedStatus ? 'Hành động này không thể hoàn tác!' : 'Chọn trạng thái thanh lý phù hợp'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-md transition-colors ${
              isDisposedStatus ? 'hover:bg-red-100' : selectedStatus?.color === 'orange' ? 'hover:bg-orange-100' : 'hover:bg-yellow-100'
            }`}
          >
            <X className={`w-5 h-5 ${
              isDisposedStatus ? 'text-red-900' : selectedStatus?.color === 'orange' ? 'text-orange-900' : 'text-yellow-900'
            }`} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Thông tin thiết bị */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Thiết bị sẽ được cập nhật:</h3>
                <div className="space-y-1 text-sm text-gray-700">
                  <p><strong>Tên:</strong> {equipment.name}</p>
                  <p><strong>Loại:</strong> {equipment.type}</p>
                  <p><strong>Mã RFID:</strong> {equipment.qrCode || 'Chưa có'}</p>
                  <p><strong>Trạng thái hiện tại:</strong> {
                    equipment.status === 'active' ? 'Hoạt động' :
                    equipment.status === 'maintenance' ? 'Bảo trì' :
                    equipment.status === 'inactive' ? 'Ngừng hoạt động' :
                    equipment.status === 'preparing_liquidation' ? 'Chuẩn bị thanh lý' :
                    equipment.status === 'pending_liquidation' ? 'Chờ thanh lý' :
                    equipment.status === 'disposed' ? 'Đã thanh lý' : 'Không xác định'
                  }</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chọn trạng thái thanh lý */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Chọn trạng thái thanh lý <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {liquidationStatuses.map((status) => {
                const StatusIcon = status.icon;
                const isSelected = formData.liquidationStatus === status.value;
                const colorClasses = {
                  yellow: {
                    border: isSelected ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:border-yellow-300',
                    icon: 'text-yellow-600',
                    badge: 'bg-yellow-100 text-yellow-800',
                  },
                  orange: {
                    border: isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300',
                    icon: 'text-orange-600',
                    badge: 'bg-orange-100 text-orange-800',
                  },
                  red: {
                    border: isSelected ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300',
                    icon: 'text-red-600',
                    badge: 'bg-red-100 text-red-800',
                  },
                };
                const colors = colorClasses[status.color];

                return (
                  <label
                    key={status.value}
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${colors.border}`}
                  >
                    <input
                      type="radio"
                      name="liquidationStatus"
                      value={status.value}
                      checked={isSelected}
                      onChange={handleChange}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`w-5 h-5 ${colors.icon}`} />
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{status.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            {/* Ngày thanh lý - chỉ hiển thị khi chọn "Đã thanh lý" */}
            {isDisposedStatus && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4" />
                  Ngày thanh lý <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="disposalDate"
                  value={formData.disposalDate}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]} // Không cho chọn ngày tương lai
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.disposalDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.disposalDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.disposalDate}</p>
                )}
              </div>
            )}

            {/* Lý do thanh lý */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <FileText className="w-4 h-4" />
                Lý do thanh lý <span className="text-red-500">*</span>
              </label>
              <textarea
                name="disposalReason"
                value={formData.disposalReason}
                onChange={handleChange}
                rows={5}
                placeholder="Nhập lý do thanh lý (ví dụ: hỏng không thể sửa chữa, hết hạn sử dụng, không còn phù hợp, v.v.)"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  errors.disposalReason ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex items-center justify-between mt-1">
                <div>
                  {errors.disposalReason && (
                    <p className="text-red-500 text-sm">{errors.disposalReason}</p>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {formData.disposalReason.length} ký tự (tối thiểu 10)
                </p>
              </div>
            </div>
          </div>

          {/* Warning - nội dung thay đổi theo trạng thái */}
          <div className={`rounded-lg p-4 mt-6 ${
            isDisposedStatus
              ? 'bg-red-50 border border-red-200'
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                isDisposedStatus ? 'text-red-600' : 'text-blue-600'
              }`} />
              <div className={`text-sm ${isDisposedStatus ? 'text-red-800' : 'text-blue-800'}`}>
                <p className="font-semibold mb-1">Lưu ý quan trọng:</p>
                {isDisposedStatus ? (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Thiết bị sẽ chuyển sang trạng thái "Đã thanh lý"</li>
                    <li>Lịch sử hoạt động và bảo trì sẽ được lưu giữ</li>
                    <li className="font-semibold">Hành động này KHÔNG THỂ HOÀN TÁC</li>
                    <li>Bạn vẫn có thể xem thông tin thiết bị đã thanh lý trong lịch sử</li>
                  </ul>
                ) : (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Thiết bị sẽ chuyển sang trạng thái "{selectedStatus?.label}"</li>
                    <li>Bạn có thể thay đổi trạng thái này sau trong "Lịch sử thanh lý"</li>
                    <li>Thiết bị vẫn có thể khôi phục về trạng thái hoạt động</li>
                    <li>Lịch sử hoạt động và bảo trì sẽ được lưu giữ</li>
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                isDisposedStatus
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : selectedStatus?.color === 'orange'
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
              }`}
            >
              {selectedStatus && <selectedStatus.icon className="w-4 h-4" />}
              {loading ? 'Đang xử lý...' : `Xác nhận: ${selectedStatus?.label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisposalModal;
