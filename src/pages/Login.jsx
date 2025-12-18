import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Helper để lấy redirect path theo role
const getRedirectPathByRole = (role) => {
  switch (role) {
    case 'receptionist':
      return '/receptionist-incidents';
    case 'technician':
      return '/my-tasks';
    default:
      return '/';
  }
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, currentUser, userProfile } = useAuth();
  const { showSuccess, showError } = useNotification();

  // Redirect nếu đã đăng nhập - theo role
  if (currentUser && userProfile) {
    const redirectPath = getRedirectPathByRole(userProfile.role);
    return <Navigate to={redirectPath} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      showError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      showSuccess('Đăng nhập thành công!');
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);

      // Xử lý lỗi từ backend NestJS
      let errorMessage = 'Đăng nhập thất bại';

      if (error.response) {
        // Lỗi từ server
        const status = error.response.status;
        const message = error.response.data?.message;

        if (status === 401) {
          errorMessage = 'Email hoặc mật khẩu không chính xác';
        } else if (status === 404) {
          errorMessage = 'Tài khoản không tồn tại';
        } else if (status === 400) {
          errorMessage = message || 'Thông tin đăng nhập không hợp lệ';
        } else if (status === 429) {
          errorMessage = 'Quá nhiều lần thử. Vui lòng thử lại sau';
        } else if (message) {
          errorMessage = message;
        }
      } else if (error.request) {
        // Không nhận được response từ server
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối';
      }

      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-main flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">iGC</span>
          </div>
          <h2 className="text-3xl font-semibold text-primary">
            Đăng nhập iGymCare
          </h2>
          <p className="mt-2 text-sm text-secondary">
            Hệ thống quản lý thiết bị gym
          </p>
        </div>

        {/* Form */}
        <div className="card-standard">
          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập email của bạn"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-primary mb-1">
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập mật khẩu"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading && <LoadingSpinner size="sm" />}
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-secondary">
            © 2025 iGymCare. Hệ thống quản lý thiết bị gym.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
