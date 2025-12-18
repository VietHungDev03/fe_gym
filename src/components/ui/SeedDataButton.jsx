import { useState } from 'react';
import { Database, Trash2 } from 'lucide-react';
import { seedDatabase, clearDatabase } from '../../utils/seedData';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from './LoadingSpinner';

const SeedDataButton = ({ onDataSeeded }) => {
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  
  const { showError, showSuccess, showInfo } = useNotification();

  const handleSeedData = async () => {
    setLoading(true);
    try {
      const result = await seedDatabase();
      showSuccess(result.message);
      
      if (result.success && onDataSeeded) {
        onDataSeeded();
      }
    } catch (error) {
      showError('Lỗi tạo dữ liệu mẫu: ' + error.message);
    } finally {
      setLoading(false);
      setShowOptions(false);
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('⚠️ CẢNH BÁO: Thao tác này sẽ xóa TẤT CẢ dữ liệu trong hệ thống. Bạn có chắc chắn?')) {
      return;
    }

    if (!window.confirm('Xác nhận lần cuối: Xóa tất cả thiết bị, lịch bảo trì và dữ liệu liên quan?')) {
      return;
    }

    setLoading(true);
    try {
      const result = await clearDatabase();
      showInfo(result.message);
      
      if (result.success && onDataSeeded) {
        onDataSeeded();
      }
    } catch (error) {
      showError('Lỗi xóa dữ liệu: ' + error.message);
    } finally {
      setLoading(false);
      setShowOptions(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="btn-secondary flex items-center gap-2 text-sm"
        disabled={loading}
      >
        {loading ? (
          <>
            <LoadingSpinner size="sm" />
            Đang xử lý...
          </>
        ) : (
          <>
            <Database className="w-4 h-4" />
            Dữ liệu Demo
          </>
        )}
      </button>

      {showOptions && !loading && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
              Quản lý dữ liệu mẫu
            </div>
            
            <button
              onClick={handleSeedData}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Database className="w-4 h-4 text-green-500" />
              Tạo dữ liệu mẫu
            </button>
            
            <button
              onClick={handleClearData}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Xóa tất cả dữ liệu
            </button>
            
            <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
              ⚠️ Chỉ dùng trong môi trường development
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {showOptions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowOptions(false)}
        />
      )}
    </div>
  );
};

export default SeedDataButton;