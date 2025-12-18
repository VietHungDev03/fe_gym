import { useState } from 'react';
import BranchList from '../components/branches/BranchList';
import BranchForm from '../components/branches/BranchForm';

const BranchManagementPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [refreshList, setRefreshList] = useState(0);

  const handleAdd = () => {
    setSelectedBranch(null);
    setShowForm(true);
  };

  const handleEdit = (branch) => {
    setSelectedBranch(branch);
    setShowForm(true);
  };

  const handleView = (branch) => {
    // Tạm thời sử dụng edit form để xem chi tiết
    // Sau này có thể tạo BranchDetailModal riêng nếu cần
    setSelectedBranch(branch);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedBranch(null);
  };

  const handleSave = () => {
    // Refresh danh sách sau khi lưu
    setRefreshList(prev => prev + 1);
  };

  return (
    <div>
      <BranchList
        key={refreshList}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
      />

      {showForm && (
        <BranchForm
          branch={selectedBranch}
          onClose={handleCloseForm}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default BranchManagementPage;
