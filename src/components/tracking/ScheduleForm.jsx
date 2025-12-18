import { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { trackingService } from '../../services/trackingService';
import { equipmentService } from '../../services/equipmentService';
import { branchService } from '../../services/branchService';
import { userService } from '../../services/userService';
import { useNotification } from '../../contexts/NotificationContext';

/**
 * Component: ScheduleForm
 * Form tạo/sửa lịch bảo trì định kỳ
 */
const ScheduleForm = ({ schedule = null, onClose, onSave }) => {
  const isEdit = !!schedule;
  const { showError, showSuccess } = useNotification();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    // Phạm vi áp dụng
    scope: 'equipment', // 'equipment', 'multiple', 'type', 'branch'
    branchId: '', // Chi nhánh được chọn
    equipmentIds: [], // Mảng thiết bị được chọn (cho multiple)
    equipmentId: '', // Thiết bị đơn lẻ
    equipmentType: '',
    // Thông tin bảo trì
    maintenanceType: 'preventive',
    priority: 'medium',
    assignedTo: '',
    // Lịch trình
    startDate: '',
    recurrenceInterval: 30,
    endDate: '',
    isActive: true
  });

  const [branches, setBranches] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();

    if (schedule) {
      // Xác định scope
      let scope = 'equipment';
      if (schedule.equipmentId) scope = 'equipment';
      else if (schedule.equipmentType) scope = 'type';
      else if (schedule.branchId) scope = 'branch';

      setFormData({
        name: schedule.name || '',
        description: schedule.description || '',
        scope,
        branchId: schedule.branchId || '',
        equipmentIds: [],
        equipmentId: schedule.equipmentId || '',
        equipmentType: schedule.equipmentType || '',
        maintenanceType: schedule.maintenanceType || 'preventive',
        priority: schedule.priority || 'medium',
        assignedTo: schedule.assignedTo || '',
        startDate: schedule.startDate ? schedule.startDate.split('T')[0] : '',
        recurrenceInterval: schedule.recurrenceInterval || 30,
        endDate: schedule.endDate ? schedule.endDate.split('T')[0] : '',
        isActive: schedule.isActive !== undefined ? schedule.isActive : true
      });
    }
  }, [schedule]);

  // Load tất cả data cần thiết
  const loadData = async () => {
    try {
      const [branchesData, equipmentData, filterOptions, techniciansList] = await Promise.all([
        branchService.getActiveBranches(),
        equipmentService.getAllEquipment(),
        equipmentService.getFilterOptions(),
        userService.getUsersByRole('technician')
      ]);

      console.log('📊 Data loaded:');
      console.log('- Branches:', branchesData?.length || 0);
      console.log('- Equipment:', equipmentData?.length || 0);
      console.log('- Technicians từ API:', techniciansList);

      const activeTechnicians = techniciansList.filter(t => t.status === 'active');
      console.log('- Technicians active:', activeTechnicians);

      setBranches(branchesData);
      setEquipmentList(equipmentData);
      setFilteredEquipment(equipmentData);
      setEquipmentTypes(filterOptions.types || []);
      setTechnicians(activeTechnicians);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
    }
  };

  // Filter thiết bị theo chi nhánh
  useEffect(() => {
    if (formData.branchId) {
      const filtered = equipmentList.filter(eq => eq.branchId === formData.branchId);
      setFilteredEquipment(filtered);

      // Reset equipment selection khi đổi chi nhánh
      setFormData(prev => ({
        ...prev,
        equipmentId: '',
        equipmentIds: [],
        equipmentType: ''
      }));
    } else {
      setFilteredEquipment(equipmentList);
    }
  }, [formData.branchId, equipmentList]);

  // Toggle equipment trong danh sách chọn nhiều
  const toggleEquipment = (equipmentId) => {
    setFormData(prev => {
      const isSelected = prev.equipmentIds.includes(equipmentId);
      return {
        ...prev,
        equipmentIds: isSelected
          ? prev.equipmentIds.filter(id => id !== equipmentId)
          : [...prev.equipmentIds, equipmentId]
      };
    });
  };

  // Chọn tất cả thiết bị trong chi nhánh
  const selectAllInBranch = () => {
    const allIds = filteredEquipment.map(eq => eq.id);
    setFormData(prev => ({
      ...prev,
      equipmentIds: allIds
    }));
  };

  // Bỏ chọn tất cả
  const deselectAll = () => {
    setFormData(prev => ({
      ...prev,
      equipmentIds: []
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name) {
      showError('Vui lòng nhập tên lịch bảo trì');
      return;
    }

    if (!formData.startDate) {
      showError('Vui lòng chọn ngày bắt đầu');
      return;
    }

    // Validate scope
    if (formData.scope === 'equipment' && !formData.equipmentId) {
      showError('Vui lòng chọn thiết bị');
      return;
    }

    if (formData.scope === 'multiple') {
      if (!formData.branchId) {
        showError('Vui lòng chọn chi nhánh');
        return;
      }
      if (formData.equipmentIds.length === 0) {
        showError('Vui lòng chọn ít nhất một thiết bị');
        return;
      }
    }

    if (formData.scope === 'type') {
      if (!formData.branchId) {
        showError('Vui lòng chọn chi nhánh');
        return;
      }
      if (!formData.equipmentType) {
        showError('Vui lòng chọn loại thiết bị');
        return;
      }
    }

    if (formData.scope === 'branch' && !formData.branchId) {
      showError('Vui lòng chọn chi nhánh');
      return;
    }

    try {
      setLoading(true);

      // Nếu scope là 'multiple', tạo nhiều schedule cho từng thiết bị
      if (formData.scope === 'multiple' && !isEdit) {
        const promises = formData.equipmentIds.map(equipmentId => {
          const data = {
            name: `${formData.name} - ${equipmentList.find(e => e.id === equipmentId)?.name}`,
            description: formData.description,
            maintenanceType: formData.maintenanceType,
            priority: formData.priority,
            assignedTo: formData.assignedTo || null,
            startDate: formData.startDate,
            recurrenceInterval: parseInt(formData.recurrenceInterval),
            endDate: formData.endDate || null,
            isActive: formData.isActive,
            equipmentId
          };
          return trackingService.createMaintenanceSchedule(data);
        });

        await Promise.all(promises);
        showSuccess(`Đã tạo ${formData.equipmentIds.length} lịch bảo trì`);
        onSave();
        onClose();
        return;
      }

      // Tạo data cho scope khác
      const data = {
        name: formData.name,
        description: formData.description,
        maintenanceType: formData.maintenanceType,
        priority: formData.priority,
        assignedTo: formData.assignedTo || null,
        startDate: formData.startDate,
        recurrenceInterval: parseInt(formData.recurrenceInterval),
        endDate: formData.endDate || null,
        isActive: formData.isActive
      };

      // Add scope-specific fields
      if (formData.scope === 'equipment') {
        data.equipmentId = formData.equipmentId;
      } else if (formData.scope === 'type') {
        data.equipmentType = formData.equipmentType;
        data.branchId = formData.branchId; // Filter by branch
      } else if (formData.scope === 'branch') {
        data.branchId = formData.branchId;
      }

      if (isEdit) {
        await trackingService.updateMaintenanceSchedule(schedule.id, data);
        showSuccess('Đã cập nhật lịch bảo trì');
      } else {
        await trackingService.createMaintenanceSchedule(data);
        showSuccess('Đã tạo lịch bảo trì mới');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Lỗi lưu lịch bảo trì:', error);
      showError(error.response?.data?.message || 'Không thể lưu lịch bảo trì');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Sửa Lịch Bảo Trì' : 'Tạo Lịch Bảo Trì Mới'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Lên lịch bảo trì cho thiết bị, nhóm thiết bị hoặc toàn bộ chi nhánh
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Thông tin cơ bản */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Thông tin cơ bản</h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên lịch bảo trì *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: Bảo trì định kỳ máy chạy bộ"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả công việc
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Kiểm tra, vệ sinh, bôi trơn..."
                  />
                </div>
              </div>
            </div>

            {/* Phạm vi áp dụng */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Phạm vi áp dụng</h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn phạm vi *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        value="equipment"
                        checked={formData.scope === 'equipment'}
                        onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">Một thiết bị</span>
                    </label>
                    <label className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        value="multiple"
                        checked={formData.scope === 'multiple'}
                        onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">Nhiều thiết bị</span>
                    </label>
                    <label className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        value="type"
                        checked={formData.scope === 'type'}
                        onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">Nhóm thiết bị</span>
                    </label>
                    <label className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        value="branch"
                        checked={formData.scope === 'branch'}
                        onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">Toàn chi nhánh</span>
                    </label>
                  </div>
                </div>

                {/* Chi nhánh (cho tất cả scope trừ equipment đơn lẻ không bắt buộc) */}
                {(formData.scope !== 'equipment' || formData.scope === 'equipment') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chi nhánh {formData.scope !== 'equipment' && '*'}
                    </label>
                    <select
                      value={formData.branchId}
                      onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={formData.scope !== 'equipment'}
                    >
                      <option value="">-- {formData.scope === 'equipment' ? 'Tất cả chi nhánh' : 'Chọn chi nhánh'} --</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name} ({branch.code})
                        </option>
                      ))}
                    </select>
                    {formData.scope === 'equipment' && (
                      <p className="text-xs text-gray-500 mt-1">Chọn chi nhánh để lọc thiết bị</p>
                    )}
                  </div>
                )}

                {/* Thiết bị đơn lẻ */}
                {formData.scope === 'equipment' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chọn thiết bị *
                    </label>
                    <select
                      value={formData.equipmentId}
                      onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">-- Chọn thiết bị --</option>
                      {filteredEquipment.map(eq => (
                        <option key={eq.id} value={eq.id}>
                          {eq.name} - {eq.type} {eq.location && `(${eq.location})`}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {filteredEquipment.length} thiết bị khả dụng
                    </p>
                  </div>
                )}

                {/* Nhiều thiết bị */}
                {formData.scope === 'multiple' && formData.branchId && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Chọn thiết bị * ({formData.equipmentIds.length} đã chọn)
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={selectAllInBranch}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Chọn tất cả
                        </button>
                        {formData.equipmentIds.length > 0 && (
                          <button
                            type="button"
                            onClick={deselectAll}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Bỏ chọn
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                      {filteredEquipment.length === 0 ? (
                        <p className="text-sm text-gray-500 p-4 text-center">
                          Không có thiết bị nào trong chi nhánh này
                        </p>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {filteredEquipment.map(eq => (
                            <label
                              key={eq.id}
                              className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={formData.equipmentIds.includes(eq.id)}
                                onChange={() => toggleEquipment(eq.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">{eq.name}</div>
                                <div className="text-xs text-gray-500">
                                  {eq.type} {eq.location && `- ${eq.location}`}
                                </div>
                              </div>
                              {formData.equipmentIds.includes(eq.id) && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Nhóm thiết bị */}
                {formData.scope === 'type' && formData.branchId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chọn loại thiết bị *
                    </label>
                    <select
                      value={formData.equipmentType}
                      onChange={(e) => setFormData({ ...formData, equipmentType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">-- Chọn loại --</option>
                      {equipmentTypes
                        .filter(type => filteredEquipment.some(eq => eq.type === type))
                        .map(type => {
                          const count = filteredEquipment.filter(eq => eq.type === type).length;
                          return (
                            <option key={type} value={type}>
                              {type} ({count} thiết bị)
                            </option>
                          );
                        })}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Áp dụng cho tất cả thiết bị cùng loại trong chi nhánh
                    </p>
                  </div>
                )}

                {/* Toàn chi nhánh */}
                {formData.scope === 'branch' && formData.branchId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Lưu ý:</strong> Lịch bảo trì sẽ được áp dụng cho tất cả {filteredEquipment.length} thiết bị trong chi nhánh này.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Thông tin bảo trì */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Thông tin bảo trì</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại bảo trì
                  </label>
                  <select
                    value={formData.maintenanceType}
                    onChange={(e) => setFormData({ ...formData, maintenanceType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="preventive">Bảo trì định kỳ</option>
                    <option value="corrective">Bảo trì sửa chữa</option>
                    <option value="emergency">Bảo trì khẩn cấp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Độ ưu tiên
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                    <option value="critical">Khẩn cấp</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Người phụ trách
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chưa chỉ định --</option>
                    {technicians.map(tech => (
                      <option key={tech.id} value={tech.id}>
                        {tech.fullName} {tech.phoneNumber && `- ${tech.phoneNumber}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Lịch trình */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Lịch trình</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày bắt đầu *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chu kỳ (ngày) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.recurrenceInterval}
                    onChange={(e) => setFormData({ ...formData, recurrenceInterval: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="30"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">VD: 30 ngày, 60 ngày, 90 ngày...</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Để trống nếu không giới hạn</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 pt-7">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Kích hoạt ngay
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo lịch')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleForm;
