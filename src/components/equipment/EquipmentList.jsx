import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Package, CheckCircle, Clock, XCircle, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Archive, History, Trash, Truck, Wrench, PauseCircle } from 'lucide-react';
import { equipmentService } from '../../services/equipmentService';
import { branchService } from '../../services/branchService';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS, hasPermission } from '../../utils/permissions';
import LoadingSpinner from '../ui/LoadingSpinner';

const EquipmentList = ({ onAdd, onEdit, onView, onDispose, onBulkDispose, onViewHistory, onTransfer, onViewTransferHistory }) => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({ branches: [], types: [], statuses: [] });
  const [branches, setBranches] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filters
  const [filters, setFilters] = useState({
    branchId: '',
    type: '',
    status: '',
  });

  // Sorting
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');

  const { showError, showSuccess } = useNotification();
  const { userProfile } = useAuth();

  // Check permissions
  const canView = hasPermission(userProfile?.role, PERMISSIONS.EQUIPMENT_VIEW);
  const canCreate = hasPermission(userProfile?.role, PERMISSIONS.EQUIPMENT_CREATE);
  const canUpdate = hasPermission(userProfile?.role, PERMISSIONS.EQUIPMENT_UPDATE);
  const canDelete = hasPermission(userProfile?.role, PERMISSIONS.EQUIPMENT_DELETE);

  // Load filter options và branches
  useEffect(() => {
    loadFilterOptions();
    loadBranches();
  }, []);

  // Load equipment when filters, sorting, or pagination change
  useEffect(() => {
    loadEquipment();
  }, [currentPage, itemsPerPage, filters, sortBy, sortOrder]);

  const loadFilterOptions = async () => {
    try {
      const options = await equipmentService.getFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      console.error('Lỗi tải filter options:', error);
    }
  };

  const loadBranches = async () => {
    try {
      const data = await branchService.getAllBranches();
      setBranches(data);
    } catch (error) {
      console.error('Lỗi tải danh sách chi nhánh:', error);
    }
  };

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const response = await equipmentService.getEquipmentWithFilter({
        page: currentPage,
        limit: itemsPerPage,
        branchId: filters.branchId || undefined,
        type: filters.type || undefined,
        status: filters.status || undefined,
        sortBy,
        sortOrder,
      });

      setEquipment(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.total || 0);
    } catch (error) {
      console.error('Lỗi tải danh sách thiết bị:', error);
      showError('Không thể tải danh sách thiết bị');
    } finally {
      setLoading(false);
    }
  };

  // Xóa thiết bị
  const handleDelete = async (id) => {
    if (!canDelete) {
      showError('Bạn không có quyền xóa thiết bị');
      return;
    }

    if (window.confirm('Bạn có chắc muốn xóa thiết bị này?')) {
      try {
        await equipmentService.deleteEquipment(id);
        loadEquipment();
        showSuccess('Xóa thiết bị thành công');
      } catch (error) {
        console.error('Lỗi xóa thiết bị:', error);
        showError('Không thể xóa thiết bị');
      }
    }
  };

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset về trang 1 khi filter
  };

  const handleStatusChange = async (item, newStatus) => {
    try {
      setLoading(true);
      await equipmentService.updateEquipment(item.id, { status: newStatus });
      setEquipment(prev =>
        prev.map(eq => (eq.id === item.id ? { ...eq, status: newStatus } : eq))
      );
      showSuccess(`Đã cập nhật trạng thái "${item.name}" thành ${newStatus === 'maintenance' ? 'Bảo trì' : 'Ngừng hoạt động'}`);
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái thiết bị:', error);
      showError('Không thể cập nhật trạng thái thiết bị');
    } finally {
      setLoading(false);
    }
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
    setCurrentPage(1);
  };

  // Get branch name from branchId
  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : 'Chưa xác định';
  };

  // Calculate next maintenance date helpers
  const parseDate = (value) => {
    if (!value) return null;
    if (value.toDate && typeof value.toDate === 'function') return value.toDate();
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const getNextMaintenanceDate = (equipment) => {
    const direct = parseDate(
      equipment.nextMaintenanceDate ||
      equipment.nextMaintenance ||
      equipment.scheduledMaintenanceDate
    );
    if (direct) return direct;

    const baseDate = parseDate(equipment.warrantyExpiry)

    if (!baseDate) return null;

    const interval = equipment.maintenanceInterval || 30;
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + interval);
    return nextDate;
  };

  const calculateNextMaintenanceDate = (equipment) => {
    const nextDate = getNextMaintenanceDate(equipment);
    return nextDate ? nextDate.toLocaleDateString('vi-VN') : 'Chưa xác định';
  };

  const isMaintenanceOverdue = (equipment) => {
    const nextDate = getNextMaintenanceDate(equipment);
    if (!nextDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(nextDate);
    compareDate.setHours(0, 0, 0, 0);
    return equipment.status === 'active' && compareDate < today;
  };

  // Handle checkbox selection
  const handleSelectEquipment = (equipmentId) => {
    setSelectedEquipment(prev => {
      if (prev.includes(equipmentId)) {
        return prev.filter(id => id !== equipmentId);
      } else {
        return [...prev, equipmentId];
      }
    });
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectedEquipment.length === equipment.filter(eq => eq.status !== 'disposed').length) {
      setSelectedEquipment([]);
    } else {
      const selectableIds = equipment
        .filter(eq => eq.status !== 'disposed')
        .map(eq => eq.id);
      setSelectedEquipment(selectableIds);
    }
  };

  // Handle bulk disposal
  const handleBulkDispose = () => {
    if (selectedEquipment.length === 0) {
      showError('Vui lòng chọn ít nhất một thiết bị để thanh lý');
      return;
    }
    onBulkDispose && onBulkDispose(selectedEquipment, equipment);
  };

  // Reset selection when page or filters change
  useEffect(() => {
    setSelectedEquipment([]);
  }, [currentPage, filters, sortBy, sortOrder]);

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      active: { label: 'Hoạt động', class: 'bg-green-100 text-green-800', icon: CheckCircle },
      maintenance: { label: 'Bảo trì', class: 'bg-yellow-100 text-yellow-800', icon: Clock },
      inactive: { label: 'Ngừng hoạt động', class: 'bg-red-100 text-red-800', icon: XCircle },
      preparing_liquidation: { label: 'Chuẩn bị thanh lý', class: 'bg-yellow-100 text-yellow-800', icon: Clock },
      pending_liquidation: { label: 'Chờ thanh lý', class: 'bg-orange-100 text-orange-800', icon: Archive },
      disposed: { label: 'Đã thanh lý', class: 'bg-gray-100 text-gray-800', icon: Archive }
    };

    const config = statusConfig[status] || statusConfig.active;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // Sort icon component
  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <ChevronUp className="w-4 h-4 text-gray-300" />;
    return sortOrder === 'ASC' ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  if (loading) {
    return <LoadingSpinner className="py-8" size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">
          Quản lý thiết bị
        </h2>

        <div className="flex items-center gap-3 flex-wrap">
          {selectedEquipment.length > 0 && canDelete && (
            <button
              onClick={handleBulkDispose}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors flex items-center gap-2"
            >
              <Trash className="w-4 h-4" />
              Thanh lý {selectedEquipment.length} thiết bị
            </button>
          )}
          {canView && onViewTransferHistory && (
            <button
              onClick={onViewTransferHistory}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Truck className="w-4 h-4" />
              Lịch sử điều chuyển
            </button>
          )}
          {canView && onViewHistory && (
            <button
              onClick={onViewHistory}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              Lịch sử thanh lý
            </button>
          )}
          {canCreate && (
            <button
              onClick={onAdd}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Thêm thiết bị
            </button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Tổng thiết bị</p>
              <p className="text-2xl font-bold text-blue-700">{totalItems}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Hoạt động</p>
              <p className="text-2xl font-bold text-green-700">
                {equipment.filter(eq => eq.status === 'active').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Bảo trì</p>
              <p className="text-2xl font-bold text-yellow-700">
                {equipment.filter(eq => eq.status === 'maintenance').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Ngừng hoạt động</p>
              <p className="text-2xl font-bold text-red-700">
                {equipment.filter(eq => eq.status === 'inactive').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đã thanh lý</p>
              <p className="text-2xl font-bold text-gray-700">
                {equipment.filter(eq => eq.status === 'disposed').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Archive className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-standard">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Chi nhánh filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chi nhánh
            </label>
            <select
              value={filters.branchId}
              onChange={(e) => handleFilterChange('branchId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả chi nhánh</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Loại thiết bị filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại thiết bị
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả loại</option>
              {filterOptions.types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Trạng thái filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả trạng thái</option>
              {filterOptions.statuses.map((status) => (
                <option key={status} value={status}>
                  {status === 'active' ? 'Hoạt động' :
                   status === 'maintenance' ? 'Bảo trì' :
                   status === 'inactive' ? 'Ngừng hoạt động' :
                   status === 'preparing_liquidation' ? 'Chuẩn bị thanh lý' :
                   status === 'pending_liquidation' ? 'Chờ thanh lý' :
                   status === 'disposed' ? 'Đã thanh lý' : status}
                </option>
              ))}
            </select>
          </div>

          {/* Items per page */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hiển thị
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={5}>5 mục</option>
              <option value={10}>10 mục</option>
              <option value={20}>20 mục</option>
              <option value={50}>50 mục</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card-standard overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {canDelete && (
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedEquipment.length > 0 && selectedEquipment.length === equipment.filter(eq => eq.status !== 'disposed').length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                )}
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Tên thiết bị
                    <SortIcon field="name" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('qrCode')}
                >
                  <div className="flex items-center gap-1">
                    Mã RFID
                    <SortIcon field="qrCode" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Chi nhánh
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Trạng thái
                    <SortIcon field="status" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Ngày bảo trì kế tiếp
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {equipment.length === 0 ? (
                <tr>
                  <td colSpan={canDelete ? "7" : "6"} className="px-4 py-8 text-center text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Không tìm thấy thiết bị</p>
                  </td>
                </tr>
              ) : (
                equipment.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      item.status === 'disposed' ? 'bg-gray-50 opacity-75' : ''
                    }`}
                  >
                    {canDelete && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedEquipment.includes(item.id)}
                          onChange={() => handleSelectEquipment(item.id)}
                          disabled={item.status === 'disposed'}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${item.status === 'disposed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {item.name}
                        </span>
                        <span className="text-xs text-gray-500">{item.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700 font-mono">
                        {item.qrCode || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">
                        {getBranchName(item.branchId)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm ${isMaintenanceOverdue(item) ? 'text-red-600 font-semibold' : 'text-gray-700'}`}
                        title={item.status === 'disposed' ? 'Đã thanh lý' : calculateNextMaintenanceDate(item)}
                      >
                        {item.status === 'disposed'
                          ? 'Đã thanh lý'
                          : isMaintenanceOverdue(item)
                            ? `${calculateNextMaintenanceDate(item)} (quá hạn)`
                            : calculateNextMaintenanceDate(item)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {canView && (
                          <button
                            onClick={() => onView(item)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}

                        {item.status !== 'disposed' && canUpdate && (
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {item.status !== 'disposed' && canUpdate && onTransfer && (
                          <button
                            onClick={() => onTransfer(item)}
                            className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                            title="Điều chuyển"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}

                        {item.status === 'active' && isMaintenanceOverdue(item) && canUpdate && (
                          <>
                            <button
                              onClick={() => handleStatusChange(item, 'maintenance')}
                              className="p-1 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                              title="Chuyển sang bảo trì"
                            >
                              <Wrench className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(item, 'inactive')}
                              className="p-1 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                              title="Đánh dấu tạm dừng"
                            >
                              <PauseCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {item.status !== 'disposed' && canUpdate && onDispose && (
                          <button
                            onClick={() => onDispose(item)}
                            className="p-1 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                            title="Thanh lý"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}

                        {item.status !== 'disposed' && canDelete && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {item.status === 'disposed' && canDelete && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Xóa thiết bị đã thanh lý"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
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
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    // Chỉ hiển thị 5 trang gần currentPage
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
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
                    } else if (page === currentPage - 3 || page === currentPage + 3) {
                      return <span key={page} className="px-2 text-gray-500">...</span>;
                    }
                    return null;
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

export default EquipmentList;
