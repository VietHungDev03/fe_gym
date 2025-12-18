import { useState, useEffect } from 'react';
import { X, Building2, MapPin } from 'lucide-react';
import { branchService } from '../../services/branchService';
import { userService } from '../../services/userService';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../ui/LoadingSpinner';

const BranchAssignmentModal = ({ user, onClose, onSuccess }) => {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (user?.branchId) {
      setSelectedBranchId(user.branchId);
    }
  }, [user]);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const activeBranches = await branchService.getActiveBranches();
      setBranches(activeBranches);
    } catch (error) {
      console.error('Lỗi tải danh sách chi nhánh:', error);
      showError('Không thể tải danh sách chi nhánh');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedBranchId) {
      showError('Vui lòng chọn chi nhánh');
      return;
    }

    setSubmitting(true);

    try {
      await userService.assignBranch(user.id, selectedBranchId);
      showSuccess('Phân công chi nhánh thành công');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Lỗi phân công chi nhánh:', error);
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else {
        showError('Không thể phân công chi nhánh');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Phân công chi nhánh
              </h2>
              <p className="text-sm text-gray-600">
                {user?.fullName}
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
          {loading ? (
            <LoadingSpinner size="md" />
          ) : (
            <div className="space-y-4">
              {/* User Info */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                    <p className="text-xs text-gray-600">{user?.email}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {user?.role === 'technician' ? 'Kỹ thuật viên' :
                     user?.role === 'receptionist' ? 'Lễ tân' : user?.role}
                  </span>
                </div>
              </div>

              {/* Branch Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Chọn chi nhánh làm việc *
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">-- Chọn chi nhánh --</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} {branch.address ? `- ${branch.address}` : ''}
                    </option>
                  ))}
                </select>

                {branches.length === 0 && (
                  <p className="text-sm text-yellow-600 mt-2">
                    Chưa có chi nhánh nào. Vui lòng tạo chi nhánh trước.
                  </p>
                )}
              </div>

              {/* Selected Branch Info */}
              {selectedBranchId && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-600" />
                    Thông tin chi nhánh
                  </p>
                  {branches.find(b => b.id === selectedBranchId) && (
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">Tên:</span>{' '}
                        {branches.find(b => b.id === selectedBranchId).name}
                      </p>
                      {branches.find(b => b.id === selectedBranchId).address && (
                        <p className="flex items-start gap-1">
                          <MapPin className="w-3 h-3 mt-0.5" />
                          {branches.find(b => b.id === selectedBranchId).address}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Info Note */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>Lưu ý:</strong> Nhân viên chỉ có thể xem và quản lý thiết bị, sự cố
                  thuộc chi nhánh được phân công.
                </p>
              </div>
            </div>
          )}
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
            disabled={submitting || loading || !selectedBranchId}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Đang lưu...' : 'Phân công'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BranchAssignmentModal;
