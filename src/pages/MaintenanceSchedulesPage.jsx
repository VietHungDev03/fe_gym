import { useState } from 'react';
import RecurringSchedulesList from '../components/tracking/RecurringSchedulesList';
import ScheduleForm from '../components/tracking/ScheduleForm';
import MaintenanceSchedulesDashboard from '../components/tracking/MaintenanceSchedulesDashboard';

/**
 * Page: MaintenanceSchedulesPage
 * Trang quản lý lịch bảo trì định kỳ
 */
const MaintenanceSchedulesPage = () => {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'dashboard'
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddNew = () => {
    setEditingSchedule(null);
    setShowForm(true);
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingSchedule(null);
  };

  const handleSave = () => {
    setRefreshKey(prev => prev + 1); // Trigger reload
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'list'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Danh Sách Lịch
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'dashboard'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Dashboard Thống Kê
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'list' && (
        <RecurringSchedulesList
          key={refreshKey}
          onAddNew={handleAddNew}
          onEdit={handleEdit}
        />
      )}

      {activeTab === 'dashboard' && (
        <MaintenanceSchedulesDashboard key={refreshKey} />
      )}

      {/* Form Modal */}
      {showForm && (
        <ScheduleForm
          schedule={editingSchedule}
          onClose={handleCloseForm}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default MaintenanceSchedulesPage;
