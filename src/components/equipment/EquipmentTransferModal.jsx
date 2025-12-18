import { useState, useEffect } from 'react';
import { X, Truck, Calendar, FileText, MapPin, AlertTriangle } from 'lucide-react';
import { equipmentTransferService } from '../../services/equipmentTransferService';
import { branchService } from '../../services/branchService';
import { useNotification } from '../../contexts/NotificationContext';

const EquipmentTransferModal = ({ isOpen, onClose, equipment, onSuccess }) => {
  const [formData, setFormData] = useState({
    toBranchId: '',
    transferDate: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
  });
  const [allBranches, setAllBranches] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (isOpen) {
      loadBranches();
    }
  }, [isOpen, equipment?.branchId]);

  const loadBranches = async () => {
    try {
      setLoadingBranches(true);
      const data = await branchService.getAllBranches();
      console.log('Loaded branches:', data);
      console.log('Current equipment branchId:', equipment?.branchId);

      // Lưu tất cả branches
      setAllBranches(data);

      // Lọc bỏ chi nhánh hiện tại cho dropdown
      const filteredBranches = equipment?.branchId
        ? data.filter(b => b.id !== equipment.branchId)
        : data;

      console.log('Available branches:', filteredBranches);
      setAvailableBranches(filteredBranches);
    } catch (error) {
      console.error('Lỗi tải danh sách chi nhánh:', error);
      showError('Không thể tải danh sách chi nhánh');
    } finally {
      setLoadingBranches(false);
    }
  };

  if (!isOpen || !equipment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.toBranchId) {
      showError('Vui lòng chọn chi nhánh đích');
      return;
    }

    if (formData.reason && formData.reason.length < 10) {
      showError('Lý do điều chuyển phải có ít nhất 10 ký tự');
      return;
    }

    try {
      setLoading(true);
      await equipmentTransferService.createTransfer({
        equipmentId: equipment.id,
        toBranchId: formData.toBranchId,
        transferDate: formData.transferDate,
        reason: formData.reason || undefined,
        notes: formData.notes || undefined,
      });

      showSuccess('Tạo yêu cầu điều chuyển thành công');
      setFormData({
        toBranchId: '',
        transferDate: new Date().toISOString().split('T')[0],
        reason: '',
        notes: '',
      });
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error('Lỗi tạo yêu cầu điều chuyển:', error);
      showError(error.response?.data?.message || 'Không thể tạo yêu cầu điều chuyển');
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

  const getCurrentBranchName = () => {
    if (!equipment?.branchId) return 'Chưa phân bổ chi nhánh';
    if (loadingBranches) return 'Đang tải...';

    // Tìm trong danh sách tất cả branches
    const currentBranch = allBranches.find(b => b.id === equipment.branchId);

    return currentBranch ? currentBranch.name : equipment.branchId;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Điều chuyển thiết bị</h3>
              <p className="text-sm text-gray-600">{equipment.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-100 rounded transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Equipment Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Thông tin thiết bị</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Tên thiết bị:</p>
                <p className="font-medium text-gray-900">{equipment.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Loại:</p>
                <p className="font-medium text-gray-900">{equipment.type}</p>
              </div>
              <div>
                <p className="text-gray-600">Mã RFID:</p>
                <p className="font-mono text-gray-900">{equipment.qrCode}</p>
              </div>
              <div>
                <p className="text-gray-600">Chi nhánh hiện tại:</p>
                <p className="font-medium text-gray-900">
                  {getCurrentBranchName()}
                </p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900 mb-1">Lưu ý quan trọng</p>
              <p className="text-sm text-yellow-700">
                Yêu cầu điều chuyển cần được phê duyệt trước khi thực hiện.
                Thiết bị sẽ được chuyển sang chi nhánh mới sau khi hoàn tất điều chuyển.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Target Branch */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                Chi nhánh đích <span className="text-red-500">*</span>
              </label>
              <select
                name="toBranchId"
                value={formData.toBranchId}
                onChange={handleChange}
                required
                disabled={loadingBranches}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {loadingBranches ? (
                  <option value="">Đang tải chi nhánh...</option>
                ) : availableBranches.length === 0 ? (
                  <option value="">Không có chi nhánh khác để điều chuyển</option>
                ) : (
                  <>
                    <option value="">Chọn chi nhánh đích</option>
                    {availableBranches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {!loadingBranches && availableBranches.length === 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Không có chi nhánh nào để điều chuyển. Vui lòng tạo chi nhánh mới trước.
                </p>
              )}
              {!loadingBranches && availableBranches.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {availableBranches.length} chi nhánh khả dụng
                </p>
              )}
            </div>

            {/* Transfer Date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                Ngày dự kiến điều chuyển <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="transferDate"
                value={formData.transferDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 text-gray-500" />
                Lý do điều chuyển
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows={3}
                minLength={10}
                placeholder="Nhập lý do điều chuyển (tùy chọn, tối thiểu 10 ký tự nếu có)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              {formData.reason && (
                <p className="text-xs text-gray-500 mt-1">
                  {formData.reason.length}/10 ký tự tối thiểu
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 text-gray-500" />
                Ghi chú thêm
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                placeholder="Ghi chú thêm về việc điều chuyển (tùy chọn)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
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
            disabled={loading || loadingBranches || availableBranches.length === 0 || !formData.toBranchId || (formData.reason && formData.reason.length < 10)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang xử lý...
              </>
            ) : loadingBranches ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang tải...
              </>
            ) : availableBranches.length === 0 ? (
              <>
                <Truck className="w-4 h-4" />
                Không có chi nhánh
              </>
            ) : (
              <>
                <Truck className="w-4 h-4" />
                Tạo yêu cầu điều chuyển
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentTransferModal;
