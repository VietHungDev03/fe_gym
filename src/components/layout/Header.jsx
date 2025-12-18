import { useState } from 'react';
import { Menu, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const Header = ({ onMenuToggle }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { currentUser, logout, userProfile } = useAuth();
  const { showSuccess, showError } = useNotification();

  const getRoleDisplayName = (role) => {
    const roleNames = {
      admin: 'Quản trị viên',
      manager: 'Quản lý',
      technician: 'Kỹ thuật viên',
      user: 'Người dùng'
    };
    return roleNames[role] || 'Người dùng';
  };

  const handleLogout = async () => {
    try {
      await logout();
      showSuccess('Đăng xuất thành công!');
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
      showError('Có lỗi xảy ra khi đăng xuất');
    }
  };

  return (
    <header className="bg-white shadow-md border-b border-gray-100 h-16 fixed w-full top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className=" h-full mr-4">
        <div className="flex items-center justify-between h-full">
          {/* Nút menu */}
          <div className="flex items-center">
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 lg:hidden"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Right side: User menu */}
          <div className="flex items-center gap-3">
            {/* Thông tin người dùng */}
            <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-gray-200 hover:border-gray-300"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center shadow-sm">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {userProfile?.fullName || currentUser?.displayName || 'Người dùng'}
                </p>
                <p className="text-xs text-gray-500 -mt-0.5">
                  {getRoleDisplayName(userProfile?.role)}
                </p>
              </div>
            </button>

            {/* Dropdown menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="py-2">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {userProfile?.fullName || currentUser?.displayName || 'Người dùng'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getRoleDisplayName(userProfile?.role)} • {currentUser?.email}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 transition-colors"
                  >
                    <div className="p-1 rounded-md bg-red-100">
                      <LogOut className="w-4 h-4 text-red-600" />
                    </div>
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
