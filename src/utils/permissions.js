// Hệ thống phân quyền cho iGymCare

// Định nghĩa các permissions
export const PERMISSIONS = {
  // Quản lý thiết bị
  EQUIPMENT_VIEW: 'equipment:view',
  EQUIPMENT_CREATE: 'equipment:create', 
  EQUIPMENT_UPDATE: 'equipment:update',
  EQUIPMENT_DELETE: 'equipment:delete',
  
  // Theo dõi và bảo trì
  TRACKING_VIEW: 'tracking:view',
  MAINTENANCE_CREATE: 'maintenance:create',
  MAINTENANCE_UPDATE: 'maintenance:update',
  INCIDENT_CREATE: 'incident:create',
  INCIDENT_INVESTIGATE: 'incident:investigate',
  INCIDENT_RESOLVE: 'incident:resolve',
  
  // Quản lý người dùng
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // Quản lý chi nhánh
  BRANCH_VIEW: 'branch:view',
  BRANCH_CREATE: 'branch:create',
  BRANCH_UPDATE: 'branch:update',
  BRANCH_DELETE: 'branch:delete',

  // Báo cáo và thống kê
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  ANALYTICS_VIEW: 'analytics:view',
  
  // Quét QR/RFID
  SCAN_EQUIPMENT: 'scan:equipment',
  SCAN_ADVANCED: 'scan:advanced'
};

// Định nghĩa permissions cho từng role
export const ROLE_PERMISSIONS = {
  admin: [
    // Admin có toàn quyền
    ...Object.values(PERMISSIONS)
  ],
  
  manager: [
    // Manager: Quản lý và báo cáo, không tạo/xóa user
    PERMISSIONS.EQUIPMENT_VIEW,
    PERMISSIONS.EQUIPMENT_CREATE,
    PERMISSIONS.EQUIPMENT_UPDATE,

    PERMISSIONS.TRACKING_VIEW,
    PERMISSIONS.MAINTENANCE_CREATE,
    PERMISSIONS.MAINTENANCE_UPDATE,
    PERMISSIONS.INCIDENT_CREATE,
    PERMISSIONS.INCIDENT_INVESTIGATE,
    PERMISSIONS.INCIDENT_RESOLVE,

    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_UPDATE, // Chỉ sửa, không tạo/xóa

    PERMISSIONS.BRANCH_VIEW,
    PERMISSIONS.BRANCH_CREATE,
    PERMISSIONS.BRANCH_UPDATE, // Manager có thể quản lý chi nhánh

    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.ANALYTICS_VIEW,

    PERMISSIONS.SCAN_EQUIPMENT,
    PERMISSIONS.SCAN_ADVANCED
  ],
  
  technician: [
    // Technician: Bảo trì và sửa chữa, không quản lý user
    PERMISSIONS.EQUIPMENT_VIEW,
    PERMISSIONS.EQUIPMENT_UPDATE, // Chỉ sửa thông tin kỹ thuật

    PERMISSIONS.TRACKING_VIEW,
    PERMISSIONS.MAINTENANCE_CREATE,
    PERMISSIONS.MAINTENANCE_UPDATE,
    PERMISSIONS.INCIDENT_CREATE,
    PERMISSIONS.INCIDENT_INVESTIGATE, // Chỉ điều tra, không resolve

    PERMISSIONS.SCAN_EQUIPMENT,
    PERMISSIONS.SCAN_ADVANCED
  ],

  receptionist: [
    // Receptionist: Tiếp nhận và báo cáo sự cố, xem thiết bị chi nhánh
    PERMISSIONS.EQUIPMENT_VIEW, // Chỉ xem thiết bị chi nhánh

    PERMISSIONS.TRACKING_VIEW, // Xem lịch sử chi nhánh
    PERMISSIONS.INCIDENT_CREATE, // Báo cáo sự cố

    PERMISSIONS.SCAN_EQUIPMENT // Quét QR cơ bản
  ],

  user: [
    // User: Chỉ xem và sử dụng cơ bản
    PERMISSIONS.EQUIPMENT_VIEW,

    PERMISSIONS.TRACKING_VIEW, // Chỉ xem lịch sử của mình
    PERMISSIONS.INCIDENT_CREATE, // Báo cáo sự cố

    PERMISSIONS.SCAN_EQUIPMENT // Quét QR cơ bản
  ]
};

// Hàm kiểm tra permission
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

// Hàm kiểm tra nhiều permissions (cần tất cả)
export const hasAllPermissions = (userRole, permissions) => {
  return permissions.every(permission => hasPermission(userRole, permission));
};

// Hàm kiểm tra ít nhất một permission
export const hasAnyPermission = (userRole, permissions) => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

// Hook để sử dụng trong components
export const usePermissions = (userRole) => {
  return {
    can: (permission) => hasPermission(userRole, permission),
    canAll: (permissions) => hasAllPermissions(userRole, permissions),
    canAny: (permissions) => hasAnyPermission(userRole, permissions)
  };
};

// Helper để lấy menu items dựa trên role
export const getMenuItemsForRole = (userRole) => {
  const canView = (permission) => hasPermission(userRole, permission);
  
  const menuItems = [];
  
  // Dashboard - tất cả role đều thấy
  menuItems.push({
    title: 'Tổng quan',
    path: '/',
    show: true
  });
  
  // Equipment - tùy theo quyền (không cho receptionist vì họ có trang riêng)
  if (canView(PERMISSIONS.EQUIPMENT_VIEW) && userRole !== 'receptionist') {
    menuItems.push({
      title: 'Quản lý thiết bị',
      path: '/equipment',
      show: true
    });
  }

  // Tracking - tùy theo quyền (không cho receptionist vì họ có trang riêng)
  if (canView(PERMISSIONS.TRACKING_VIEW) && userRole !== 'receptionist') {
    menuItems.push({
      title: 'Theo dõi sử dụng',
      path: '/tracking',
      show: true
    });
  }

  // Maintenance Schedules - admin, manager, technician
  if (canView(PERMISSIONS.MAINTENANCE_CREATE) || canView(PERMISSIONS.MAINTENANCE_UPDATE)) {
    menuItems.push({
      title: 'Lịch bảo trì định kỳ',
      path: '/maintenance-schedules',
      show: true
    });
  }

  // My Tasks - chỉ dành cho technician
  if (userRole === 'technician') {
    menuItems.push({
      title: 'Công việc của tôi',
      path: '/my-tasks',
      show: true
    });
  }

  // Personal Activity - chỉ dành cho user
  if (userRole === 'user') {
    menuItems.push({
      title: 'Hoạt động của tôi',
      path: '/my-activity',
      show: true
    });
  }

  // Team Management - chỉ dành cho manager
  if (userRole === 'manager') {
    menuItems.push({
      title: 'Quản lý team',
      path: '/team-management',
      show: true
    });
  }

  // Receptionist Dashboard - Quản lý sự cố chi nhánh (dành cho receptionist)
  if (userRole === 'receptionist') {
    menuItems.push({
      title: 'Thiết bị & Sự cố',
      path: '/receptionist-incidents',
      show: true
    });
  }

  // Reports - chỉ admin, manager
  if (canView(PERMISSIONS.REPORTS_VIEW)) {
    menuItems.push({
      title: 'Báo cáo & Thống kê', 
      path: '/reports',
      show: true
    });
  }
  
  // Scan - tất cả role
  if (canView(PERMISSIONS.SCAN_EQUIPMENT)) {
    menuItems.push({
      title: 'Quét QR/RFID',
      path: '/scan',
      show: true
    });
  }
  
  // User management - chỉ admin
  if (canView(PERMISSIONS.USER_VIEW)) {
    menuItems.push({
      title: 'Quản lý tài khoản',
      path: '/users',
      show: true
    });
  }

  // Branch management - admin và manager
  if (canView(PERMISSIONS.BRANCH_VIEW)) {
    menuItems.push({
      title: 'Quản lý chi nhánh',
      path: '/branches',
      show: true
    });
  }

  // Profile - tất cả role đều có
  menuItems.push({
    title: 'Thông tin cá nhân',
    path: '/profile',
    show: true
  });
  
  return menuItems.filter(item => item.show);
};

// Helper messages cho từng role
export const getRoleDescription = (role) => {
  const descriptions = {
    admin: 'Toàn quyền quản trị hệ thống - có thể thực hiện mọi thao tác',
    manager: 'Quản lý hoạt động và báo cáo - không thể tạo/xóa tài khoản người dùng',
    technician: 'Bảo trì và sửa chữa thiết bị - tập trung vào công việc kỹ thuật',
    receptionist: 'Tiếp nhận khách hàng và báo cáo sự cố - quản lý thiết bị chi nhánh',
    user: 'Sử dụng thiết bị cơ bản - quyền hạn bị giới hạn cho an toàn'
  };

  return descriptions[role] || 'Chưa xác định quyền hạn';
};