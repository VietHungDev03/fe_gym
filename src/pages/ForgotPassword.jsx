import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { useNotification } from '../contexts/NotificationContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { showError, showSuccess } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      showError('Vui lòng nhập địa chỉ email');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Định dạng email không hợp lệ');
      return;
    }

    try {
      setLoading(true);
      await authService.forgotPassword(email);
      setEmailSent(true);
      showSuccess('Email đặt lại mật khẩu đã được gửi!');
    } catch (error) {
      console.error('Lỗi gửi email đặt lại mật khẩu:', error);
      
      if (error.response?.status === 404) {
        showError('Không tìm thấy tài khoản với email này');
      } else if (error.response?.status === 400) {
        showError(error.response?.data?.message || 'Định dạng email không hợp lệ');
      } else if (error.response?.status === 429) {
        showError('Quá nhiều yêu cầu. Vui lòng thử lại sau');
      } else {
        showError('Có lỗi xảy ra. Vui lòng thử lại sau');
      }
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email đã được gửi!</h2>
              <p className="text-gray-600 mb-6">
                Chúng tôi đã gửi liên kết đặt lại mật khẩu đến email <strong>{email}</strong>. 
                Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Lưu ý:</strong> Email có thể nằm trong thư mục Spam/Junk. 
                  Liên kết sẽ hết hạn sau 1 giờ.
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  to="/login"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Quay lại đăng nhập
                </Link>
                
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Gửi lại email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Quên mật khẩu?</h2>
            <p className="text-gray-600">
              Nhập email của bạn và chúng tôi sẽ gửi liên kết đặt lại mật khẩu
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Nhập địa chỉ email của bạn"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang gửi...
                  </div>
                ) : (
                  'Gửi liên kết đặt lại mật khẩu'
                )}
              </button>
            </div>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại đăng nhập
            </Link>
          </div>

          {/* Help text */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Cần giúp đỡ?</h4>
            <p className="text-xs text-gray-600">
              Nếu bạn không nhận được email trong vòng 5 phút, vui lòng kiểm tra thư mục Spam 
              hoặc liên hệ quản trị viên để được hỗ trợ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;