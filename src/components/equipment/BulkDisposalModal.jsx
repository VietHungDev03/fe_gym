import { useState } from 'react';
import { X, AlertTriangle, Trash, Calendar, FileText } from 'lucide-react';
import { equipmentService } from '../../services/equipmentService';
import { useNotification } from '../../contexts/NotificationContext';

const BulkDisposalModal = ({ isOpen, onClose, selectedEquipmentIds, equipmentList, onSuccess }) => {
  const [formData, setFormData] = useState({
    disposalReason: '',
    disposalDate: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  if (!isOpen) return null;

  // Get selected equipment details
  const selectedEquipment = equipmentList.filter(eq => selectedEquipmentIds.includes(eq.id));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.disposalReason.length < 10) {
      showError('Lý do thanh lý phải có ít nhất 10 ký tự');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn thanh lý ${selectedEquipmentIds.length} thiết bị? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      setLoading(true);
      await equipmentService.bulkDisposeEquipment({
        equipmentIds: selectedEquipmentIds,
        disposalReason: formData.disposalReason,
        disposalDate: formData.disposalDate,
      });

      showSuccess(`Đã thanh lý ${selectedEquipmentIds.length} thiết bị thành công`);
      setFormData({
        disposalReason: '',
        disposalDate: new Date().toISOString().split('T')[0],
      });
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error('Lỗi thanh lý thiết bị:', error);
      showError(error.response?.data?.message || 'Không thể thanh lý thiết bị');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-orange-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Trash className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Thanh lý nhiều thiết bị</h3>
              <p className="text-sm text-gray-600">Thanh lý {selectedEquipmentIds.length} thiết bị đã chọn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-orange-100 rounded transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900 mb-1">Cảnh báo quan trọng</p>
              <p className="text-sm text-red-700">
                Hành động này sẽ đánh dấu {selectedEquipmentIds.length} thiết bị là đã thanh lý và không thể hoàn tác.
                Các thiết bị đã thanh lý sẽ không thể chỉnh sửa hoặc sử dụng lại.
              </p>
            </div>
          </div>

          {/* Selected Equipment List */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Danh sách thiết bị sẽ thanh lý:</h4>
            <div className="bg-gray-50 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
              <ul className="divide-y divide-gray-200">
                {selectedEquipment.map((item) => (
                  <li key={item.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.type} • {item.qrCode}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.status === 'active' ? 'bg-green-100 text-green-800' :
                      item.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      item.status === 'inactive' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status === 'active' ? 'Hoạt động' :
                       item.status === 'maintenance' ? 'Bảo trì' :
                       item.status === 'inactive' ? 'Ngừng hoạt động' :
                       item.status === 'preparing_liquidation' ? 'Chuẩn bị thanh lý' :
                       item.status === 'pending_liquidation' ? 'Chờ thanh lý' :
                       'Đã thanh lý'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Disposal Date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                Ngày thanh lý
              </label>
              <input
                type="date"
                name="disposalDate"
                value={formData.disposalDate}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Không thể chọn ngày trong tương lai
              </p>
            </div>

            {/* Disposal Reason */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 text-gray-500" />
                Lý do thanh lý <span className="text-red-500">*</span>
              </label>
              <textarea
                name="disposalReason"
                value={formData.disposalReason}
                onChange={handleChange}
                required
                rows={4}
                minLength={10}
                placeholder="Nhập lý do thanh lý thiết bị (tối thiểu 10 ký tự)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.disposalReason.length}/10 ký tự tối thiểu
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || formData.disposalReason.length < 10}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang xử lý...
              </>
            ) : (
              <>
                <Trash className="w-4 h-4" />
                Xác nhận thanh lý
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkDisposalModal;
