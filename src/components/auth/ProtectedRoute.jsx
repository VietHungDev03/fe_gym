import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../utils/permissions';
import { AlertTriangle, Lock } from 'lucide-react';

const ProtectedRoute = ({ children, requiredPermission, fallback }) => {
  const { userProfile, currentUser } = useAuth();
  
  // Chưa đăng nhập
  if (!currentUser) {
    return fallback || <div>Vui lòng đăng nhập</div>;
  }
  
  // Chưa có profile
  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin người dùng...</p>
        </div>
      </div>
    );
  }
  
  // Kiểm tra permission
  if (requiredPermission && !hasPermission(userProfile.role, requiredPermission)) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Không có quyền truy cập
          </h2>
          
          <p className="text-gray-600 mb-6">
            Bạn không có quyền truy cập vào tính năng này. 
            Vui lòng liên hệ quản trị viên nếu cần hỗ trợ.
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-5 h-5" />
              <p className="text-sm font-medium">
                Vai trò hiện tại: <span className="capitalize">{userProfile.role}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return children;
};

export default ProtectedRoute;