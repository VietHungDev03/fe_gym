import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(false);

  const { register, currentUser } = useAuth();
  const { showSuccess, showError } = useNotification();

  // Redirect nếu đã đăng nhập
  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      showError('Vui lòng nhập họ tên');
      return false;
    }

    if (!formData.email.trim()) {
      showError('Vui lòng nhập email');
      return false;
    }

    if (!formData.email.includes('@')) {
      showError('Email không hợp lệ');
      return false;
    }

    if (formData.password.length < 6) {
      showError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      showError('Mật khẩu xác nhận không khớp');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await register(formData.email, formData.password, {
        fullName: formData.fullName,
        role: formData.role
      });
      
      showSuccess('Đăng ký thành công! Chào mừng đến với iGymCare');
    } catch (error) {
      console.error('Lỗi đăng ký:', error);
      
      // Xử lý các lỗi Firebase phổ biến
      let errorMessage = 'Đăng ký thất bại';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email này đã được sử dụng';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Mật khẩu quá yếu';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email không hợp lệ';
      } else if (error.message) {
        errorMessage = error.message;
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
            Đăng ký tài khoản
          </h2>
          <p className="mt-2 text-sm text-secondary">
            Tạo tài khoản để truy cập hệ thống iGymCare
          </p>
        </div>

        {/* Form */}
        <div className="card-standard">
          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-primary mb-1">
                Họ và tên *
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập họ và tên"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary mb-1">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập địa chỉ email"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-primary mb-1">
                Vai trò
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="user">Người dùng</option>
                <option value="technician">Kỹ thuật viên</option>
                <option value="manager">Quản lý</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-primary mb-1">
                Mật khẩu *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary mb-1">
                Xác nhận mật khẩu *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập lại mật khẩu"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading && <LoadingSpinner size="sm" />}
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          {/* Link to login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-secondary">
              Đã có tài khoản?{' '}
              <Link 
                to="/login" 
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </div>
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

export default Register;