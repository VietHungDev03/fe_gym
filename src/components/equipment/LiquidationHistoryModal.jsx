import { useState, useEffect } from 'react';
import { X, History, Package, Calendar, FileText, ChevronLeft, ChevronRight, Filter, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { equipmentService } from '../../services/equipmentService';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../ui/LoadingSpinner';

const LiquidationHistoryModal = ({ isOpen, onClose, onUpdateStatus }) => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [includeAll, setIncludeAll] = useState(true); // Include all liquidation statuses
  const [filterStatus, setFilterStatus] = useState(''); // Filter by specific status
  const { showError } = useNotification();

  const itemsPerPage = 10;

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, currentPage, includeAll, filterStatus]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await equipmentService.getDisposedHistory({
        page: currentPage,
        limit: itemsPerPage,
        sortBy: 'disposalDate',
        sortOrder: 'DESC',
        includeAll,
      });

      let data = response.data || [];

      // Filter by specific status if selected
      if (filterStatus) {
        data = data.filter(eq => eq.status === filterStatus);
      }

      setEquipment(data);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.total || 0);
    } catch (error) {
      console.error('Lỗi tải lịch sử thanh lý:', error);
      showError('Không thể tải lịch sử thanh lý');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      preparing_liquidation: {
        label: 'Chuẩn bị thanh lý',
        class: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
      },
      pending_liquidation: {
        label: 'Chờ thanh lý',
        class: 'bg-orange-100 text-orange-800',
        icon: AlertCircle,
      },
      disposed: {
        label: 'Đã thanh lý',
        class: 'bg-gray-100 text-gray-800',
        icon: CheckCircle,
      },
    };
    return configs[status] || configs.disposed;
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
              <h3 className="text-lg font-semibold text-gray-900">Lịch sử thanh lý</h3>
              <p className="text-sm text-gray-600">
                {includeAll ? 'Tất cả thiết bị đang thanh lý và đã thanh lý' : 'Chỉ thiết bị đã thanh lý'}
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

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Lọc:</span>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeAll}
                onChange={(e) => {
                  setIncludeAll(e.target.checked);
                  setCurrentPage(1);
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Bao gồm chuẩn bị & chờ thanh lý</span>
            </label>

            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="preparing_liquidation">Chuẩn bị thanh lý</option>
              <option value="pending_liquidation">Chờ thanh lý</option>
              <option value="disposed">Đã thanh lý</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <LoadingSpinner className="py-8" size="lg" />
          ) : equipment.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không có lịch sử thanh lý</h3>
              <p className="text-sm text-gray-600">
                Chưa có thiết bị nào được thanh lý hoặc đang trong quá trình thanh lý
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {equipment.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-base font-semibold text-gray-900">{item.name}</h4>
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {item.type}
                        </span>
                        <span className="font-mono text-gray-700">{item.qrCode}</span>
                      </div>
                    </div>

                    {onUpdateStatus && item.status !== 'disposed' && (
                      <div className="flex flex-col gap-2">
                        {item.status === 'preparing_liquidation' && (
                          <button
                            onClick={() => onUpdateStatus(item.id, 'pending_liquidation')}
                            className="px-3 py-1.5 text-xs bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                          >
                            Chuyển sang chờ thanh lý
                          </button>
                        )}
                        {item.status === 'pending_liquidation' && (
                          <button
                            onClick={() => onUpdateStatus(item.id, 'disposed')}
                            className="px-3 py-1.5 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                          >
                            Hoàn tất thanh lý
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {item.disposalDate && (
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-600">Ngày thanh lý:</p>
                          <p className="font-medium text-gray-900">
                            {new Date(item.disposalDate).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    )}

                    {item.disposalReason && (
                      <div className="flex items-start gap-2 md:col-span-2">
                        <FileText className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-600">Lý do thanh lý:</p>
                          <p className="font-medium text-gray-900">{item.disposalReason}</p>
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
        {!loading && equipment.length > 0 && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị {equipment.length > 0 ? ((currentPage - 1) * itemsPerPage + 1) : 0} - {Math.min(currentPage * itemsPerPage, totalItems)} trong tổng số {totalItems} thiết bị
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
                            ? 'bg-gray-600 text-white border-gray-600'
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

export default LiquidationHistoryModal;
