import { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import UserList from '../components/users/UserList';
import UserForm from '../components/users/UserForm';
import UserDetailModal from '../components/users/UserDetailModal';

const UserManagementPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refreshList, setRefreshList] = useState(0);

  const handleAdd = () => {
    setSelectedUser(null);
    setShowForm(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowForm(true);
  };

  const handleView = (user) => {
    setSelectedUser(user);
    setShowDetail(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedUser(null);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedUser(null);
  };

  const handleEditFromDetail = (user) => {
    setShowDetail(false);
    setSelectedUser(user);
    setShowForm(true);
  };

  const handleSave = () => {
    // Refresh danh sách sau khi lưu
    setRefreshList(prev => prev + 1);
  };

  return (
    <div>
      <UserList 
        key={refreshList}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
      />
      
      {showForm && (
        <UserForm
          user={selectedUser}
          onClose={handleCloseForm}
          onSave={handleSave}
        />
      )}

      {showDetail && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={handleCloseDetail}
          onEdit={handleEditFromDetail}
        />
      )}
    </div>
  );
};

export default UserManagementPage;