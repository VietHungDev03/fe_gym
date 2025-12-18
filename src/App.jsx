import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import EquipmentPage from './pages/EquipmentPage';
import TrackingPage from './pages/TrackingPage';
import MaintenanceSchedulesPage from './pages/MaintenanceSchedulesPage';
import MyTasksPage from './pages/MyTasksPage';
import MyActivityPage from './pages/MyActivityPage';
import TeamManagementPage from './pages/TeamManagementPage';
import ReceptionistIncidentsPage from './pages/ReceptionistIncidentsPage';
import ScanPage from './pages/ScanPage';
import ReportsPage from './pages/ReportsPage';
import UserManagementPage from './pages/UserManagementPage';
import BranchManagementPage from './pages/BranchManagementPage';
import ProfilePage from './pages/ProfilePage';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { PERMISSIONS } from './utils/permissions';

// Component để bảo vệ routes cần đăng nhập
const AuthenticatedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Login />;
  }
  
  return <Layout>{children}</Layout>;
};

// Component placeholder cho các pages chưa hoàn thành
const ComingSoon = ({ title }) => (
  <div className="flex flex-col items-center justify-center min-h-64">
    <h2 className="text-2xl font-semibold text-primary mb-2">{title}</h2>
    <p className="text-secondary">Tính năng đang được phát triển...</p>
  </div>
);

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route 
                path="/" 
                element={
                  <AuthenticatedRoute>
                    <Dashboard />
                  </AuthenticatedRoute>
                } 
              />
              <Route 
                path="/equipment" 
                element={
                  <AuthenticatedRoute>
                    <ProtectedRoute requiredPermission={PERMISSIONS.EQUIPMENT_VIEW}>
                      <EquipmentPage />
                    </ProtectedRoute>
                  </AuthenticatedRoute>
                } 
              />
              <Route
                path="/tracking"
                element={
                  <AuthenticatedRoute>
                    <ProtectedRoute requiredPermission={PERMISSIONS.TRACKING_VIEW}>
                      <TrackingPage />
                    </ProtectedRoute>
                  </AuthenticatedRoute>
                }
              />
              <Route
                path="/maintenance-schedules"
                element={
                  <AuthenticatedRoute>
                    <ProtectedRoute requiredPermission={PERMISSIONS.MAINTENANCE_CREATE}>
                      <MaintenanceSchedulesPage />
                    </ProtectedRoute>
                  </AuthenticatedRoute>
                }
              />
              <Route 
                path="/reports" 
                element={
                  <AuthenticatedRoute>
                    <ProtectedRoute requiredPermission={PERMISSIONS.REPORTS_VIEW}>
                      <ReportsPage />
                    </ProtectedRoute>
                  </AuthenticatedRoute>
                } 
              />
              <Route 
                path="/my-tasks" 
                element={
                  <AuthenticatedRoute>
                    <MyTasksPage />
                  </AuthenticatedRoute>
                } 
              />
              <Route 
                path="/my-activity" 
                element={
                  <AuthenticatedRoute>
                    <MyActivityPage />
                  </AuthenticatedRoute>
                } 
              />
              <Route
                path="/team-management"
                element={
                  <AuthenticatedRoute>
                    <TeamManagementPage />
                  </AuthenticatedRoute>
                }
              />
              <Route
                path="/receptionist-incidents"
                element={
                  <AuthenticatedRoute>
                    <ReceptionistIncidentsPage />
                  </AuthenticatedRoute>
                }
              />
              <Route
                path="/scan" 
                element={
                  <AuthenticatedRoute>
                    <ProtectedRoute requiredPermission={PERMISSIONS.SCAN_EQUIPMENT}>
                      <ScanPage />
                    </ProtectedRoute>
                  </AuthenticatedRoute>
                } 
              />
              <Route
                path="/users"
                element={
                  <AuthenticatedRoute>
                    <ProtectedRoute requiredPermission={PERMISSIONS.USER_VIEW}>
                      <UserManagementPage />
                    </ProtectedRoute>
                  </AuthenticatedRoute>
                }
              />
              <Route
                path="/branches"
                element={
                  <AuthenticatedRoute>
                    <ProtectedRoute requiredPermission={PERMISSIONS.BRANCH_VIEW}>
                      <BranchManagementPage />
                    </ProtectedRoute>
                  </AuthenticatedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <AuthenticatedRoute>
                    <ProfilePage />
                  </AuthenticatedRoute>
                }
              />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App
