import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Activity,
  BarChart3,
  QrCode,
  Users,
  X,
  ClipboardCheck,
  UserCheck,
  TrendingUp,
  User,
  Calendar,
  AlertTriangle,
  Building2
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getMenuItemsForRole } from '../../utils/permissions';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { userProfile } = useAuth();

  // Mapping icons cho từng path
  const iconMapping = {
    '/': LayoutDashboard,
    '/equipment': Package,
    '/tracking': Activity,
    '/maintenance-schedules': Calendar,
    '/my-tasks': ClipboardCheck,
    '/my-activity': TrendingUp,
    '/team-management': UserCheck,
    '/receptionist-incidents': AlertTriangle,
    '/reports': BarChart3,
    '/scan': QrCode,
    '/users': Users,
    '/branches': Building2,
    '/profile': User,
  };

  // Lấy menu items dựa trên role của user
  const userRole = userProfile?.role || 'user';
  const allowedMenuItems = getMenuItemsForRole(userRole);
  
  // Thêm icon vào menu items
  const menuItems = allowedMenuItems.map(item => ({
    ...item,
    icon: iconMapping[item.path] || Package
  }));

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Overlay cho mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 w-64 h-full bg-white shadow-lg border-r border-gray-100
        transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Nút đóng cho mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-md hover:bg-gray-100 lg:hidden z-10"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Logo */}
        <div className="px-6 py-6 border-b border-gray-100 mt-16 lg:mt-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">iGC</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">iGymCare</h2>
              <p className="text-xs text-gray-500">Quản lý thiết bị gym</p>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => onClose()}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                      ${active 
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <div className={`
                      p-1.5 rounded-lg transition-colors
                      ${active 
                        ? 'bg-blue-200 text-blue-700' 
                        : 'text-gray-500 group-hover:text-gray-700 group-hover:bg-gray-200'
                      }
                    `}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer info */}
        <div className="px-4 py-4 border-t border-gray-100 bg-gray-50/50">
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p className="font-medium text-gray-700">iGymCare v1.0</p>
            <p>© 2025 Hệ thống quản lý thiết bị gym</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;