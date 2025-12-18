import { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS, hasPermission } from '../utils/permissions';
import { equipmentService } from '../services/equipmentService';
import EquipmentList from '../components/equipment/EquipmentList';
import EquipmentForm from '../components/equipment/EquipmentForm';
import EquipmentDetailModal from '../components/equipment/EquipmentDetailModal';
import DisposalModal from '../components/equipment/DisposalModal';
import BulkDisposalModal from '../components/equipment/BulkDisposalModal';
import LiquidationHistoryModal from '../components/equipment/LiquidationHistoryModal';
import EquipmentTransferModal from '../components/equipment/EquipmentTransferModal';
import TransferHistoryModal from '../components/equipment/TransferHistoryModal';

const EquipmentPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showDisposal, setShowDisposal] = useState(false);
  const [showBulkDisposal, setShowBulkDisposal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showTransferHistory, setShowTransferHistory] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [refreshList, setRefreshList] = useState(0);

  const { userProfile } = useAuth();
  const { showError } = useNotification();

  // Check permissions
  const canView = hasPermission(userProfile?.role, PERMISSIONS.EQUIPMENT_VIEW);
  const canCreate = hasPermission(userProfile?.role, PERMISSIONS.EQUIPMENT_CREATE);
  const canUpdate = hasPermission(userProfile?.role, PERMISSIONS.EQUIPMENT_UPDATE);

  // Redirect if no view permission
  if (!canView) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <h3 className="text-lg font-medium">Không có quyền truy cập</h3>
          <p className="text-sm mt-1">
            Bạn không có quyền xem danh sách thiết bị. Liên hệ quản trị viên để được cấp quyền.
          </p>
        </div>
      </div>
    );
  }

  const handleAdd = () => {
    if (!canCreate) {
      showError('Bạn không có quyền thêm thiết bị');
      return;
    }
    setSelectedEquipment(null);
    setShowForm(true);
  };

  const handleEdit = (equipment) => {
    if (!canUpdate) {
      showError('Bạn không có quyền sửa thiết bị');
      return;
    }
    setSelectedEquipment(equipment);
    setShowForm(true);
  };

  const handleView = (equipment) => {
    setSelectedEquipment(equipment);
    setShowDetail(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedEquipment(null);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedEquipment(null);
  };

  const handleEditFromDetail = (equipment) => {
    if (!canUpdate) {
      showError('Bạn không có quyền sửa thiết bị');
      return;
    }
    setShowDetail(false);
    setSelectedEquipment(equipment);
    setShowForm(true);
  };

  const handleDispose = (equipment) => {
    if (!canUpdate) {
      showError('Bạn không có quyền thanh lý thiết bị');
      return;
    }
    setSelectedEquipment(equipment);
    setShowDisposal(true);
  };

  const handleCloseDisposal = () => {
    setShowDisposal(false);
    setSelectedEquipment(null);
  };

  const handleDisposed = () => {
    // Refresh danh sách sau khi thanh lý
    setRefreshList(prev => prev + 1);
  };

  const handleSave = () => {
    // Refresh danh sách sau khi lưu
    setRefreshList(prev => prev + 1);
  };

  const handleBulkDispose = (selectedIds, currentEquipmentList) => {
    if (!canUpdate) {
      showError('Bạn không có quyền thanh lý thiết bị');
      return;
    }
    setSelectedEquipmentIds(selectedIds);
    setEquipmentList(currentEquipmentList);
    setShowBulkDisposal(true);
  };

  const handleCloseBulkDisposal = () => {
    setShowBulkDisposal(false);
    setSelectedEquipmentIds([]);
  };

  const handleBulkDisposed = () => {
    // Refresh danh sách sau khi thanh lý
    setRefreshList(prev => prev + 1);
    setSelectedEquipmentIds([]);
  };

  const handleViewHistory = () => {
    setShowHistory(true);
  };

  const handleCloseHistory = () => {
    setShowHistory(false);
  };

  const handleUpdateLiquidationStatus = async (equipmentId, newStatus) => {
    try {
      await equipmentService.updateLiquidationStatus(equipmentId, newStatus);
      // Refresh history modal
      setRefreshList(prev => prev + 1);
    } catch (error) {
      showError('Không thể cập nhật trạng thái thanh lý');
    }
  };

  const handleTransfer = (equipment) => {
    if (!canUpdate) {
      showError('Bạn không có quyền điều chuyển thiết bị');
      return;
    }
    setSelectedEquipment(equipment);
    setShowTransfer(true);
  };

  const handleCloseTransfer = () => {
    setShowTransfer(false);
    setSelectedEquipment(null);
  };

  const handleTransferred = () => {
    // Refresh danh sách sau khi điều chuyển
    setRefreshList(prev => prev + 1);
  };

  const handleViewTransferHistory = () => {
    setShowTransferHistory(true);
  };

  const handleCloseTransferHistory = () => {
    setShowTransferHistory(false);
  };

  return (
    <div>
      <EquipmentList
        key={refreshList}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDispose={handleDispose}
        onBulkDispose={handleBulkDispose}
        onViewHistory={handleViewHistory}
        onTransfer={handleTransfer}
        onViewTransferHistory={handleViewTransferHistory}
      />

      {showForm && (
        <EquipmentForm
          equipment={selectedEquipment}
          onClose={handleCloseForm}
          onSave={handleSave}
        />
      )}

      {showDetail && selectedEquipment && (
        <EquipmentDetailModal
          equipment={selectedEquipment}
          onClose={handleCloseDetail}
          onEdit={handleEditFromDetail}
        />
      )}

      {showDisposal && selectedEquipment && (
        <DisposalModal
          equipment={selectedEquipment}
          onClose={handleCloseDisposal}
          onDisposed={handleDisposed}
        />
      )}

      {showBulkDisposal && (
        <BulkDisposalModal
          isOpen={showBulkDisposal}
          onClose={handleCloseBulkDisposal}
          selectedEquipmentIds={selectedEquipmentIds}
          equipmentList={equipmentList}
          onSuccess={handleBulkDisposed}
        />
      )}

      {showHistory && (
        <LiquidationHistoryModal
          isOpen={showHistory}
          onClose={handleCloseHistory}
          onUpdateStatus={handleUpdateLiquidationStatus}
        />
      )}

      {showTransfer && selectedEquipment && (
        <EquipmentTransferModal
          isOpen={showTransfer}
          onClose={handleCloseTransfer}
          equipment={selectedEquipment}
          onSuccess={handleTransferred}
        />
      )}

      {showTransferHistory && (
        <TransferHistoryModal
          isOpen={showTransferHistory}
          onClose={handleCloseTransferHistory}
        />
      )}
    </div>
  );
};

export default EquipmentPage;