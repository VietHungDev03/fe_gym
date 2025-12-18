import { useState, useEffect } from 'react';
import { Calendar, Clock, RefreshCw, Plus, Edit, Trash2, Eye, PlayCircle, Pause, CheckCircle2, Zap } from 'lucide-react';
import { trackingService } from '../../services/trackingService';
import { equipmentService } from '../../services/equipmentService';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS, hasPermission } from '../../utils/permissions';
import LoadingSpinner from '../ui/LoadingSpinner';
import EquipmentDetailModal from '../equipment/EquipmentDetailModal';

/**
 * Component: RecurringSchedulesList
 * Danh sách lịch bảo trì định kỳ tự động
 */
const RecurringSchedulesList = ({ onAddNew, onEdit }) => {
  const [schedules, setSchedules] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterActive, setFilterActive] = useState('all'); // 'all', 'active', 'inactive'
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [affectedEquipment, setAffectedEquipment] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showEquipmentDetail, setShowEquipmentDetail] = useState(false);

  const { showError, showSuccess } = useNotification();
  const { userProfile } = useAuth();

  const canCreate = hasPermission(userProfile?.role, PERMISSIONS.MAINTENANCE_CREATE);
  const canUpdate = hasPermission(userProfile?.role, PERMISSIONS.MAINTENANCE_UPDATE);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [schedulesData, equipmentData] = await Promise.all([
        trackingService.getMaintenanceSchedules(),
        equipmentService.getAllEquipment()
      ]);

      setSchedules(schedulesData);
      setEquipmentList(equipmentData);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      showError('Không thể tải dữ liệu lịch bảo trì');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (scheduleId, currentStatus) => {
    try {
      await trackingService.updateMaintenanceSchedule(scheduleId, {
        isActive: !currentStatus
      });

      setSchedules(prev =>
        prev.map(s => s.id === scheduleId ? { ...s, isActive: !currentStatus } : s)
      );

      showSuccess(!currentStatus ? 'Đã kích hoạt lịch bảo trì' : 'Đã tạm dừng lịch bảo trì');
    } catch (error) {
      showError('Không thể cập nhật trạng thái');
    }
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm('Bạn có chắc muốn xóa lịch bảo trì này?')) {
      return;
    }

    try {
      await trackingService.deleteMaintenanceSchedule(scheduleId);
      setSchedules(prev => prev.filter(s => s.id !== scheduleId));
      showSuccess('Đã xóa lịch bảo trì');
    } catch (error) {
      showError('Không thể xóa lịch bảo trì');
    }
  };

  const handleViewEquipment = async (schedule) => {
    try {
      setSelectedSchedule(schedule);
      const equipment = await trackingService.getScheduleEquipment(schedule.id);
      setAffectedEquipment(equipment);
      setShowEquipmentModal(true);
    } catch (error) {
      showError('Không thể tải danh sách thiết bị');
    }
  };

  const handleViewEquipmentDetail = (equipment) => {
    setSelectedEquipment(equipment);
    setShowEquipmentDetail(true);
  };

  const handleGenerateNow = async (scheduleId) => {
    if (!window.confirm('Bạn có chắc muốn tạo bản ghi bảo trì ngay bây giờ?')) {
      return;
    }

    try {
      const result = await trackingService.generateMaintenanceRecords(scheduleId);
      showSuccess(result.message || 'Đã tạo bản ghi bảo trì');
      loadData(); // Reload để cập nhật nextScheduledDate
    } catch (error) {
      showError(error.response?.data?.message || 'Không thể tạo bản ghi bảo trì');
    }
  };

  const handleAutoSchedule = async () => {
    if (!window.confirm('Hệ thống sẽ tự động kiểm tra và tạo lịch bảo trì cho tất cả thiết bị cần bảo trì. Bạn có chắc chắn?')) {
      return;
    }

    try {
      setLoading(true);
      const result = await trackingService.triggerAutoSchedule();
      showSuccess(result.message || `Đã tạo ${result.scheduledCount || 0} lịch bảo trì tự động`);
      loadData(); // Reload để hiển thị lịch mới
    } catch (error) {
      showError(error.response?.data?.message || 'Không thể tạo lịch bảo trì tự động');
    } finally {
      setLoading(false);
    }
  };

  const getEquipmentName = (equipmentId) => {
    const equipment = equipmentList.find(eq => eq.id === equipmentId);
    return equipment ? equipment.name : 'Không xác định';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Không xác định';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getScheduleType = (schedule) => {
    if (schedule.equipmentId) {
      return { label: 'Thiết bị cụ thể', color: 'bg-blue-100 text-blue-800' };
    } else if (schedule.equipmentType) {
      return { label: 'Nhóm thiết bị', color: 'bg-purple-100 text-purple-800' };
    } else if (schedule.branchId) {
      return { label: 'Toàn chi nhánh', color: 'bg-green-100 text-green-800' };
    }
    return { label: 'Không xác định', color: 'bg-gray-100 text-gray-800' };
  };

  const filteredSchedules = schedules.filter(schedule => {
    if (filterActive === 'active') return schedule.isActive;
    if (filterActive === 'inactive') return !schedule.isActive;
    return true;
  });

  if (loading) {
    return <LoadingSpinner className="py-8" size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Lịch Bảo Trì Định Kỳ
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Quản lý lịch bảo trì tự động cho thiết bị
          </p>
        </div>

        {canCreate && (
          <div className="flex gap-2">
            <button
              onClick={handleAutoSchedule}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
              title="Tự động tạo lịch bảo trì cho tất cả thiết bị cần bảo trì"
            >
              <Zap className="w-4 h-4" />
              Tự Động Tạo Lịch
            </button>
            <button
              onClick={onAddNew}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tạo Lịch Mới
            </button>
          </div>
        )}
      </div>

      {/* Bộ lọc */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Lọc:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterActive('all')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                filterActive === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterActive('active')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                filterActive === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đang hoạt động
            </button>
            <button
              onClick={() => setFilterActive('inactive')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                filterActive === 'inactive'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đã tạm dừng
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách lịch */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSchedules.map((schedule) => {
          const scheduleType = getScheduleType(schedule);

          return (
            <div
              key={schedule.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {schedule.name}
                    </h3>
                    {schedule.isActive ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <Pause className="w-3 h-3 mr-1" />
                        Tạm dừng
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    {schedule.description || 'Không có mô tả'}
                  </p>

                  <div className="flex items-center gap-2 text-xs">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${scheduleType.color}`}>
                      {scheduleType.label}
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-600">
                      {schedule.equipmentId
                        ? getEquipmentName(schedule.equipmentId)
                        : schedule.equipmentType || schedule.branchId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Thông tin lịch trình */}
              <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <RefreshCw className="w-4 h-4" />
                    Chu kỳ:
                  </span>
                  <span className="font-medium text-gray-900">
                    {schedule.recurrenceInterval} ngày/lần
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Bảo trì tiếp theo:
                  </span>
                  <span className="font-medium text-blue-600">
                    {formatDate(schedule.nextScheduledDate)}
                  </span>
                </div>

                {schedule.endDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Kết thúc:
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatDate(schedule.endDate)}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleViewEquipment(schedule)}
                  className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors text-sm flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  Xem thiết bị
                </button>

                {canUpdate && (
                  <>
                    <button
                      onClick={() => handleToggleActive(schedule.id, schedule.isActive)}
                      className={`${
                        schedule.isActive
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      } px-3 py-1.5 rounded-md transition-colors text-sm flex items-center gap-1`}
                    >
                      {schedule.isActive ? (
                        <>
                          <Pause className="w-4 h-4" />
                          Tạm dừng
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4" />
                          Kích hoạt
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleGenerateNow(schedule.id)}
                      className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-200 transition-colors text-sm flex items-center gap-1"
                      title="Tạo bản ghi bảo trì ngay"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Tạo ngay
                    </button>

                    <button
                      onClick={() => onEdit(schedule)}
                      className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors text-sm flex items-center gap-1"
                    >
                      <Edit className="w-4 h-4" />
                      Sửa
                    </button>

                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="bg-red-100 text-red-700 px-3 py-1.5 rounded-md hover:bg-red-200 transition-colors text-sm flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Xóa
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredSchedules.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            Không có lịch bảo trì
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {filterActive === 'all'
              ? 'Chưa có lịch bảo trì định kỳ nào'
              : `Không có lịch ${filterActive === 'active' ? 'đang hoạt động' : 'đã tạm dừng'}`}
          </p>
        </div>
      )}

      {/* Modal xem thiết bị */}
      {showEquipmentModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Thiết bị áp dụng: {selectedSchedule.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {affectedEquipment.length} thiết bị sẽ được bảo trì theo lịch này
              </p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {affectedEquipment.length > 0 ? (
                <div className="space-y-2">
                  {affectedEquipment.map((equipment) => (
                    <div
                      key={equipment.id}
                      onClick={() => handleViewEquipmentDetail(equipment)}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-blue-50 hover:border-blue-300 border border-transparent cursor-pointer transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{equipment.name}</p>
                        <p className="text-sm text-gray-600">{equipment.type}</p>
                        <p className="text-xs text-blue-600 mt-1">Click để xem lịch sử bảo trì</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        equipment.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {equipment.status === 'active' ? 'Hoạt động' :
                         equipment.status === 'maintenance' ? 'Bảo trì' :
                         equipment.status === 'inactive' ? 'Ngừng hoạt động' :
                         equipment.status === 'disposed' ? 'Đã thanh lý' :
                         equipment.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">Không có thiết bị phù hợp</p>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowEquipmentModal(false);
                  setSelectedSchedule(null);
                  setAffectedEquipment([]);
                }}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Detail Modal */}
      {showEquipmentDetail && selectedEquipment && (
        <EquipmentDetailModal
          equipment={selectedEquipment}
          onClose={() => {
            setShowEquipmentDetail(false);
            setSelectedEquipment(null);
          }}
          onEdit={() => {
            // Equipment edit không cần thiết ở đây
          }}
        />
      )}
    </div>
  );
};

export default RecurringSchedulesList;
