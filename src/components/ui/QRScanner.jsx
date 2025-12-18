import { useState, useEffect, useRef } from 'react';
import { Camera, X, Flashlight, RotateCcw } from 'lucide-react';

const QRScanner = ({ onScan, onClose }) => {
  const [hasCamera, setHasCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [manualInput, setManualInput] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Kiểm tra camera khi component mount
  useEffect(() => {
    checkCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const checkCamera = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setHasCamera(videoDevices.length > 0);
    } catch (err) {
      console.error('Lỗi kiểm tra camera:', err);
      setHasCamera(false);
    }
  };

  const startCamera = async () => {
    try {
      setError('');
      setIsScanning(true);

      const constraints = {
        video: {
          facingMode: 'environment', // Camera sau nếu có
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Mô phỏng quét QR (trong thực tế sẽ dùng thư viện như jsQR)
      simulateQRScanning();

    } catch (err) {
      console.error('Lỗi khởi động camera:', err);
      setError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Mô phỏng quét QR code (để demo)
  const simulateQRScanning = () => {
    // Trong thực tế, đây sẽ là logic xử lý frame từ video để tìm QR code
    // Ví dụ dùng thư viện jsQR hoặc zxing-js
    
    // Mô phỏng các mã QR có sẵn trong hệ thống
    const availableCodes = [
      'EQ001_TREADMILL',
      'EQ002_WEIGHTS', 
      'EQ003_BIKE',
      'EQ004_ELLIPTICAL',
      'EQ005_BARBELL'
    ];
    
    setTimeout(() => {
      // Mô phỏng phát hiện một mã QR ngẫu nhiên sau 2-4 giây
      if (isScanning && streamRef.current) {
        const randomCode = availableCodes[Math.floor(Math.random() * availableCodes.length)];
        handleQRDetected(randomCode);
      }
    }, 2000 + Math.random() * 2000);
  };

  const handleQRDetected = (qrCode) => {
    stopCamera();
    onScan(qrCode);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary">
            Quét mã QR/RFID
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Nội dung chính */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {hasCamera ? (
          <div className="w-full max-w-md">
            {/* Camera view */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden mb-6">
              {isScanning ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-64 object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                  
                  {/* Khung quét */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm text-center">
                        Đưa mã QR vào khung này
                      </span>
                    </div>
                  </div>

                  {/* Loading indicator */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                      Đang quét...
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-64 flex items-center justify-center text-white">
                  <div className="text-center">
                    <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-300 mb-4">
                      Nhấn nút bên dưới để bắt đầu quét
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={isScanning ? stopCamera : startCamera}
                className={`btn-primary flex-1 flex items-center justify-center gap-2 ${
                  isScanning ? 'bg-red-500 hover:bg-red-600' : ''
                }`}
              >
                <Camera className="w-4 h-4" />
                {isScanning ? 'Dừng quét' : 'Bắt đầu quét'}
              </button>
              
              {isScanning && (
                <button
                  onClick={() => {
                    stopCamera();
                    startCamera();
                  }}
                  className="btn-secondary p-2"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-white mb-6">
            <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Camera không khả dụng</h3>
            <p className="text-gray-300 mb-4">
              Thiết bị không có camera hoặc không được phép truy cập
            </p>
          </div>
        )}

        {/* Nhập thủ công */}
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg p-6">
            <h3 className="font-medium text-primary mb-3">
              Hoặc nhập mã thủ công
            </h3>
            
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Nhập mã QR/RFID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={!manualInput.trim()}
              >
                Xác nhận
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Hướng dẫn */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="text-center text-sm text-secondary">
          <p className="mb-1">
            💡 <strong>Hướng dẫn:</strong> Đưa camera gần mã QR/RFID để quét
          </p>
          <p>Hoặc bạn có thể nhập mã thủ công ở phía trên</p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;