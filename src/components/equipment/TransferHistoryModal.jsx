import { useState, useEffect } from 'react';
import { X, History, MapPin, Calendar, FileText, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { equipmentTransferService } from '../../services/equipmentTransferService';
import { branchService } from '../../services/branchService';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS, hasPermission } from '../../utils/permissions';
import LoadingSpinner from '../ui/LoadingSpinner';

const TransferHistoryModal = ({ isOpen, onClose, equipmentId }) => {
  const [transfers, setTransfers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const { showError, showSuccess } = useNotification();
  const { userProfile } = useAuth();

  const canUpdate = hasPermission(userProfile?.role, PERMISSIONS.EQUIPMENT_UPDATE);
  const itemsPerPage = 10;

  useEffect(() => {
    if (isOpen) {
      loadBranches();
      loadTransfers();
    }
  }, [isOpen, currentPage, filterStatus, equipmentId]);

  const loadBranches = async () => {
    try {
      const data = await branchService.getAllBranches();
      setBranches(data);
    } catch (error) {
      console.error('Lỗi tải danh sách chi nhánh:', error);
    }
  };

  const loadTransfers = async () => {
    try {
      setLoading(true);
      const response = await equipmentTransferService.getTransfers({
        page: currentPage,
        limit: itemsPerPage,
        equipmentId,
        status: filterStatus || undefined,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });

      setTransfers(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.total || 0);
    } catch (error) {
      console.error('Lỗi tải lịch sử điều chuyển:', error);
      showError('Không thể tải lịch sử điều chuyển');
    } finally {
      setLoading(false);
    }
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : 'Chưa xác định';
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: 'Chờ phê duyệt',
        class: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
      },
      approved: {
        label: 'Đã phê duyệt',
        class: 'bg-blue-100 text-blue-800',
        icon: CheckCircle,
      },
      rejected: {
        label: 'Từ chối',
        class: 'bg-red-100 text-red-800',
        icon: XCircle,
      },
      completed: {
        label: 'Hoàn thành',
        class: 'bg-green-100 text-green-800',
        icon: CheckCircle,
      },
    };
    return configs[status] || configs.pending;
  };

  const StatusBadge = ({ status }) => {
    const config = getStatusConfig(status);
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const handleUpdateStatus = async (transferId, newStatus) => {
    if (!canUpdate) {
      showError('Bạn không có quyền cập nhật trạng thái điều chuyển');
      return;
    }

    const confirmMessages = {
      approved: 'Bạn có chắc chắn muốn phê duyệt yêu cầu điều chuyển này?',
      rejected: 'Bạn có chắc chắn muốn từ chối yêu cầu điều chuyển này?',
      completed: 'Bạn có chắc chắn muốn đánh dấu yêu cầu này là đã hoàn thành? Thiết bị sẽ được chuyển sang chi nhánh mới.',
    };

    if (!window.confirm(confirmMessages[newStatus])) {
      return;
    }

    try {
      await equipmentTransferService.updateTransferStatus(transferId, newStatus);
      showSuccess(`Cập nhật trạng thái thành công`);
      loadTransfers();
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);
      showError(error.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <History className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Lịch sử điều chuyển</h3>
              <p className="text-sm text-gray-600">
                {equipmentId ? 'Lịch sử điều chuyển của thiết bị' : 'Tất cả lịch sử điều chuyển'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Filter */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Lọc theo trạng thái:</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ phê duyệt</option>
              <option value="approved">Đã phê duyệt</option>
              <option value="rejected">Từ chối</option>
              <option value="completed">Hoàn thành</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <LoadingSpinner className="py-8" size="lg" />
          ) : transfers.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không có lịch sử điều chuyển</h3>
              <p className="text-sm text-gray-600">
                Chưa có yêu cầu điều chuyển nào cho thiết bị này
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusBadge status={transfer.status} />
                        <span className="text-xs text-gray-500">
                          {new Date(transfer.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    {canUpdate && transfer.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateStatus(transfer.id, 'approved')}
                          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Phê duyệt
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(transfer.id, 'rejected')}
                          className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}

                    {canUpdate && transfer.status === 'approved' && (
                      <button
                        onClick={() => handleUpdateStatus(transfer.id, 'completed')}
                        className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        Hoàn thành
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-600">Từ chi nhánh:</p>
                        <p className="font-medium text-gray-900">
                          {getBranchName(transfer.fromBranchId)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-600">Đến chi nhánh:</p>
                        <p className="font-medium text-gray-900">
                          {getBranchName(transfer.toBranchId)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-600">Ngày dự kiến:</p>
                        <p className="font-medium text-gray-900">
                          {new Date(transfer.transferDate).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>

                    {transfer.reason && (
                      <div className="flex items-start gap-2 md:col-span-2">
                        <FileText className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-600">Lý do:</p>
                          <p className="text-gray-900">{transfer.reason}</p>
                        </div>
                      </div>
                    )}

                    {transfer.notes && (
                      <div className="flex items-start gap-2 md:col-span-2">
                        <FileText className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-600">Ghi chú:</p>
                          <p className="text-gray-900">{transfer.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        {!loading && transfers.length > 0 && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị {transfers.length > 0 ? ((currentPage - 1) * itemsPerPage + 1) : 0} - {Math.min(currentPage * itemsPerPage, totalItems)} trong tổng số {totalItems} yêu cầu
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferHistoryModal;
