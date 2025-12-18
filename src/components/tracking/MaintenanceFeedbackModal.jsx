import { useState } from 'react';
import { X, CheckCircle, AlertTriangle, Plus, Trash2, MessageSquare } from 'lucide-react';
import { trackingService } from '../../services/trackingService';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../ui/LoadingSpinner';

const MaintenanceFeedbackModal = ({ maintenance, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    workPerformed: '',
    issuesFound: '',
    hasRemainingIssues: false,
    technicianNotes: '',
    partsReplaced: []
  });

  const { showError, showSuccess } = useNotification();

  // Thêm linh kiện mới
  const addPart = () => {
    setFeedbackForm(prev => ({
      ...prev,
      partsReplaced: [
        ...prev.partsReplaced,
        { name: '', quantity: 1, cost: 0 }
      ]
    }));
  };

  // Xóa linh kiện
  const removePart = (index) => {
    setFeedbackForm(prev => ({
      ...prev,
      partsReplaced: prev.partsReplaced.filter((_, i) => i !== index)
    }));
  };

  // Cập nhật thông tin linh kiện
  const updatePart = (index, field, value) => {
    setFeedbackForm(prev => ({
      ...prev,
      partsReplaced: prev.partsReplaced.map((part, i) =>
        i === index ? { ...part, [field]: value } : part
      )
    }));
  };

  // Submit feedback
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!feedbackForm.workPerformed.trim()) {
      showError('Vui lòng mô tả công việc đã thực hiện');
      return;
    }

    try {
      setLoading(true);

      // Chuẩn bị data
      const submitData = {
        workPerformed: feedbackForm.workPerformed,
        issuesFound: feedbackForm.issuesFound || null,
        hasRemainingIssues: feedbackForm.hasRemainingIssues,
        technicianNotes: feedbackForm.technicianNotes || null,
        partsReplaced: feedbackForm.partsReplaced.length > 0 ? feedbackForm.partsReplaced : null
      };

      await trackingService.submitMaintenanceFeedback(maintenance.id, submitData);

      showSuccess('Đã gửi phản hồi bảo trì thành công');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Lỗi submit feedback:', error);
      showError(error.response?.data?.message || 'Không thể gửi phản hồi bảo trì');
    } finally {
      setLoading(false);
    }
  };

  // Tính tổng chi phí linh kiện
  const totalPartsCost = feedbackForm.partsReplaced.reduce(
    (sum, part) => sum + (part.quantity * part.cost),
    0
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Phản hồi bảo trì
              </h2>
              <p className="text-sm text-gray-600">
                Cập nhật kết quả bảo trì thiết bị
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[65vh]">
          <div className="space-y-6">
            {/* Công việc đã thực hiện */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Công việc đã thực hiện <span className="text-red-500">*</span>
              </label>
              <textarea
                value={feedbackForm.workPerformed}
                onChange={(e) => setFeedbackForm(prev => ({ ...prev, workPerformed: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Mô tả chi tiết công việc đã thực hiện..."
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Ví dụ: Bôi trơn băng tải, kiểm tra động cơ, vệ sinh bộ phận điều khiển
              </p>
            </div>

            {/* Vấn đề phát hiện */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Các vấn đề/lỗi phát hiện
              </label>
              <textarea
                value={feedbackForm.issuesFound}
                onChange={(e) => setFeedbackForm(prev => ({ ...prev, issuesFound: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Mô tả các vấn đề phát hiện trong quá trình bảo trì..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Ví dụ: Phát hiện vết nứt nhỏ trên băng tải, cần thay thế trong 2 tuần
              </p>
            </div>

            {/* Còn lỗi chưa khắc phục */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="hasRemainingIssues"
                checked={feedbackForm.hasRemainingIssues}
                onChange={(e) => setFeedbackForm(prev => ({ ...prev, hasRemainingIssues: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="hasRemainingIssues" className="text-sm font-medium text-gray-900 cursor-pointer">
                {feedbackForm.hasRemainingIssues ? (
                  <span className="flex items-center gap-2 text-yellow-600">
                    <AlertTriangle className="w-4 h-4" />
                    Còn lỗi chưa khắc phục hoàn toàn
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Đã khắc phục hoàn toàn các lỗi
                  </span>
                )}
              </label>
            </div>

            {/* Linh kiện đã thay thế */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-900">
                  Linh kiện đã thay thế
                </label>
                <button
                  type="button"
                  onClick={addPart}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Thêm linh kiện
                </button>
              </div>

              {feedbackForm.partsReplaced.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Chưa có linh kiện được thay thế</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbackForm.partsReplaced.map((part, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={part.name}
                          onChange={(e) => updatePart(index, 'name', e.target.value)}
                          placeholder="Tên linh kiện"
                          className="col-span-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <input
                          type="number"
                          value={part.quantity}
                          onChange={(e) => updatePart(index, 'quantity', parseInt(e.target.value) || 0)}
                          placeholder="Số lượng"
                          min="1"
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <input
                          type="number"
                          value={part.cost}
                          onChange={(e) => updatePart(index, 'cost', parseFloat(e.target.value) || 0)}
                          placeholder="Đơn giá (VNĐ)"
                          min="0"
                          step="1000"
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removePart(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Tổng chi phí */}
                  {totalPartsCost > 0 && (
                    <div className="flex justify-end pt-2 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        Tổng chi phí linh kiện: {totalPartsCost.toLocaleString('vi-VN')} VNĐ
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Ghi chú kỹ thuật viên */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Ghi chú của kỹ thuật viên
              </label>
              <textarea
                value={feedbackForm.technicianNotes}
                onChange={(e) => setFeedbackForm(prev => ({ ...prev, technicianNotes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Ghi chú thêm về quá trình bảo trì..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Ví dụ: Thiết bị hoạt động tốt, cần kiểm tra lại sau 1 tháng
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Đang gửi...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Gửi phản hồi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceFeedbackModal;
