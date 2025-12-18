import { useState } from 'react';
import { X, AlertTriangle, ArrowUp } from 'lucide-react';
import { trackingService } from '../../services/trackingService';
import { useNotification } from '../../contexts/NotificationContext';

const EscalateIncidentModal = ({ incident, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const { showError, showSuccess } = useNotification();

  const validateForm = () => {
    const newErrors = {};

    if (!reason.trim()) {
      newErrors.reason = 'Lý do chuyển tiếp là bắt buộc';
    } else if (reason.trim().length < 10) {
      newErrors.reason = 'Lý do phải có ít nhất 10 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      await trackingService.escalateIncident(incident.id, reason.trim());
      showSuccess('Đã chuyển tiếp sự cố lên quản trị viên');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Lỗi chuyển tiếp sự cố:', error);
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else {
        showError('Không thể chuyển tiếp sự cố');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReasonChange = (e) => {
    setReason(e.target.value);
    if (errors.reason) {
      setErrors({ ...errors, reason: '' });
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <ArrowUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Chuyển tiếp sự cố lên quản trị viên
              </h2>
              <p className="text-sm text-gray-600">
                Sự cố cần hỗ trợ từ cấp cao hơn
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Incident Info */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {incident?.equipmentName || 'Thiết bị không xác định'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {incident?.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-1 rounded-full font-medium ${
                      incident?.severity === 'critical' ? 'bg-red-200 text-red-900' :
                      incident?.severity === 'high' ? 'bg-red-100 text-red-800' :
                      incident?.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {incident?.severity === 'critical' ? 'Khẩn cấp' :
                       incident?.severity === 'high' ? 'Cao' :
                       incident?.severity === 'medium' ? 'Trung bình' : 'Thấp'}
                    </span>
                    <span className={`px-2 py-1 rounded-full font-medium ${
                      incident?.status === 'investigating' ? 'bg-blue-100 text-blue-800' :
                      incident?.status === 'reported' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {incident?.status === 'investigating' ? 'Đang điều tra' :
                       incident?.status === 'reported' ? 'Đã báo cáo' : 'Chờ xử lý'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Notice */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Lưu ý:</strong> Chuyển tiếp sự cố lên quản trị viên khi bạn không thể
                giải quyết hoặc cần sự hỗ trợ từ cấp cao hơn. Vui lòng mô tả rõ lý do.
              </p>
            </div>

            {/* Reason Input */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Lý do chuyển tiếp *
                <span className="text-xs text-gray-500 font-normal ml-1">
                  (Tối thiểu 10 ký tự)
                </span>
              </label>
              <textarea
                value={reason}
                onChange={handleReasonChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.reason ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={4}
                placeholder="Vui lòng mô tả lý do chuyển tiếp sự cố này lên quản trị viên. Ví dụ: Cần thay thế linh kiện chuyên dụng, vượt quá phạm vi xử lý của kỹ thuật viên..."
              />
              {errors.reason && (
                <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
              )}
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500">
                  Mô tả chi tiết sẽ giúp quản trị viên xử lý nhanh hơn
                </p>
                <p className={`text-xs ${
                  reason.length < 10 ? 'text-red-500' : 'text-green-600'
                }`}>
                  {reason.length}/10
                </p>
              </div>
            </div>

            {/* Escalation Process */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Quy trình chuyển tiếp:
              </h4>
              <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                <li>Sự cố sẽ được đánh dấu là "Đã chuyển tiếp"</li>
                <li>Quản trị viên sẽ nhận được thông báo ngay lập tức</li>
                <li>Quản trị viên sẽ xem xét và giao cho kỹ thuật viên phù hợp</li>
                <li>Bạn sẽ được thông báo về tiến độ xử lý</li>
              </ol>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            disabled={submitting}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || reason.trim().length < 10}
            className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <ArrowUp className="w-4 h-4" />
            {submitting ? 'Đang chuyển tiếp...' : 'Chuyển tiếp'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EscalateIncidentModal;
