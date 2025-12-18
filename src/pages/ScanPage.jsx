import { useState, useEffect } from 'react';
import { QrCode, Search, Clock, Package, AlertTriangle, Calendar, MapPin, CheckCircle, XCircle, Wrench, Archive, Shield, Building2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import QRScanner from '../components/ui/QRScanner';
import { equipmentService } from '../services/equipmentService';
import { trackingService } from '../services/trackingService';
import { branchService } from '../services/branchService';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const ScanPage = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedEquipment, setScannedEquipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [branch, setBranch] = useState(null);
  const [maintenanceInfo, setMaintenanceInfo] = useState(null);

  const { showError, showSuccess, showInfo, showWarning } = useNotification();
  const { userProfile } = useAuth();

  useEffect(() => {
    loadRecentScans();
  }, []);

  const loadRecentScans = () => {
    // Lấy từ localStorage (trong thực tế có thể lấy từ Firebase)
    const stored = localStorage.getItem('recentScans');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentScans(parsed.slice(0, 10)); // Chỉ giữ 10 lần quét gần nhất
      } catch (err) {
        console.error('Lỗi parse recent scans:', err);
      }
    }
  };

  const saveRecentScan = (equipment, timestamp) => {
    const newScan = {
      id: equipment.id,
      name: equipment.name,
      qrCode: equipment.qrCode,
      timestamp: timestamp,
      status: equipment.status
    };

    const updated = [newScan, ...recentScans.filter(scan => scan.id !== equipment.id)].slice(0, 10);
    setRecentScans(updated);
    localStorage.setItem('recentScans', JSON.stringify(updated));
  };

  const handleScan = async (qrCode) => {
    setShowScanner(false);
    setLoading(true);

    try {
      // Tìm thiết bị theo mã QR
      const equipment = await equipmentService.getEquipmentByCode(qrCode);

      // Load thông tin chi nhánh nếu có
      if (equipment.branchId) {
        try {
          const branchData = await branchService.getBranchById(equipment.branchId);
          setBranch(branchData);
        } catch (error) {
          console.error('Lỗi tải thông tin chi nhánh:', error);
        }
      }

      // Load thông tin bảo trì
      try {
        const maintenanceRecords = await trackingService.getMaintenanceRecords(null, equipment.id);
        if (maintenanceRecords && maintenanceRecords.length > 0) {
          // Tìm lần bảo trì gần nhất
          const upcoming = maintenanceRecords.find(m => m.status === 'scheduled');
          const completed = maintenanceRecords.filter(m => m.status === 'completed');
          setMaintenanceInfo({
            upcoming,
            lastMaintenance: completed[0],
            totalMaintenances: completed.length
          });
        }
      } catch (error) {
        console.error('Lỗi tải thông tin bảo trì:', error);
      }

      // Ghi nhận lần quét - lưu userId của người đang đăng nhập
      const timestamp = new Date().toISOString();
      await trackingService.logUsage(equipment.id, userProfile?.id || null, 'Quét QR/RFID');

      // Lưu vào recent scans
      saveRecentScan(equipment, timestamp);

      setScannedEquipment(equipment);
      showSuccess(`Đã quét thành công thiết bị: ${equipment.name}`);

      // Cảnh báo nếu thiết bị có vấn đề
      if (equipment.status === 'disposed') {
        showError(`Thiết bị ${equipment.name} đã được thanh lý`);
      } else if (equipment.status === 'maintenance') {
        showWarning(`Thiết bị ${equipment.name} đang trong tình trạng bảo trì`);
      } else if (equipment.status === 'inactive') {
        showWarning(`Thiết bị ${equipment.name} hiện không hoạt động`);
      }

    } catch (err) {
      console.error('Lỗi quét mã:', err);
      showError(err.message || 'Không tìm thấy thiết bị với mã này');
    } finally {
      setLoading(false);
    }
  };

  const handleReportIssue = async (severity) => {
    if (!scannedEquipment) return;

    const description = prompt('Mô tả sự cố:');
    if (!description) return;

    try {
      await trackingService.reportIncident(
        scannedEquipment.id,
        description,
        severity
      );
      
      showSuccess('Báo cáo sự cố thành công! Đội bảo trì sẽ được thông báo.');
      
      if (severity === 'critical') {
        showWarning('Sự cố nghiêm trọng đã được ưu tiên xử lý');
      }
    } catch (error) {
      console.error('Lỗi báo cáo sự cố:', error);
      showError('Không thể báo cáo sự cố. Vui lòng thử lại sau.');
    }
  };

  const StatusBadge = ({ status }) => {
    const configs = {
      active: { label: 'Hoạt động', class: 'bg-green-100 text-green-800', icon: CheckCircle },
      maintenance: { label: 'Bảo trì', class: 'bg-yellow-100 text-yellow-800', icon: Wrench },
      inactive: { label: 'Ngừng hoạt động', class: 'bg-red-100 text-red-800', icon: XCircle },
      disposed: { label: 'Đã thanh lý', class: 'bg-gray-100 text-gray-800', icon: Archive }
    };

    const config = configs[status] || configs.active;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${config.class}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Không xác định';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateNextMaintenanceDate = (equipment) => {
    if (!equipment.lastMaintenanceDate && !equipment.purchaseDate && !equipment.createdAt) {
      return null;
    }

    const baseDate = equipment.lastMaintenanceDate || equipment.purchaseDate || equipment.createdAt;
    const interval = equipment.maintenanceInterval || 30;

    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + interval);

    return nextDate;
  };

  const getDaysUntilMaintenance = (equipment) => {
    const nextDate = calculateNextMaintenanceDate(equipment);
    if (!nextDate) return null;

    const now = new Date();
    const diffTime = nextDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-primary">Đang xử lý mã...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-primary mb-2">
          Quét mã QR/RFID
        </h1>
        <p className="text-secondary">
          Quét mã thiết bị để xem thông tin và thực hiện các thao tác
        </p>
      </div>

      {/* Nút quét chính */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowScanner(true)}
          className="btn-primary text-lg py-4 px-8 flex items-center gap-3"
        >
          <QrCode className="w-6 h-6" />
          Bắt đầu quét
        </button>
      </div>


      {/* Thông tin thiết bị vừa quét */}
      {scannedEquipment && (
        <div className="space-y-4">
          {/* Header với QR Code */}
          <div className="card-standard">
            <div className="flex flex-col md:flex-row gap-6">
              {/* QR Code */}
              <div className="flex justify-center md:justify-start">
                <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                  <QRCode
                    value={scannedEquipment.qrCode || scannedEquipment.id}
                    size={120}
                    level="H"
                  />
                </div>
              </div>

              {/* Thông tin chính */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {scannedEquipment.name}
                    </h2>
                    <p className="text-gray-600">{scannedEquipment.type}</p>
                  </div>
                  <StatusBadge status={scannedEquipment.status} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <QrCode className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Mã:</span>
                    <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-800 font-mono">
                      {scannedEquipment.qrCode}
                    </code>
                  </div>

                  {branch && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Chi nhánh:</span>
                      <span className="text-gray-900 font-medium">{branch.name}</span>
                    </div>
                  )}

                  {scannedEquipment.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Vị trí:</span>
                      <span className="text-gray-900">{scannedEquipment.location}</span>
                    </div>
                  )}

                  {scannedEquipment.purchaseDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Ngày mua:</span>
                      <span className="text-gray-900">{formatDate(scannedEquipment.purchaseDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cảnh báo nếu thiết bị có vấn đề */}
          {scannedEquipment.status === 'disposed' && (
            <div className="bg-gray-50 border-l-4 border-gray-500 p-4 rounded-r-lg">
              <div className="flex items-start gap-3">
                <Archive className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Thiết bị đã thanh lý</h4>
                  <p className="text-sm text-gray-700">
                    Thiết bị này đã ngừng hoạt động và được thanh lý.
                    {scannedEquipment.disposalDate && ` Ngày thanh lý: ${formatDate(scannedEquipment.disposalDate)}`}
                  </p>
                  {scannedEquipment.disposalReason && (
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Lý do:</strong> {scannedEquipment.disposalReason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {scannedEquipment.status === 'maintenance' && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
              <div className="flex items-start gap-3">
                <Wrench className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-1">Thiết bị đang bảo trì</h4>
                  <p className="text-sm text-yellow-700">
                    Thiết bị này hiện đang được bảo trì. Vui lòng không sử dụng cho đến khi hoàn tất.
                  </p>
                </div>
              </div>
            </div>
          )}

          {scannedEquipment.status === 'inactive' && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">Thiết bị không hoạt động</h4>
                  <p className="text-sm text-red-700">
                    Thiết bị này hiện không hoạt động. Vui lòng thông báo cho nhân viên.
                  </p>
                </div>
              </div>
            </div>
          )}

          {scannedEquipment.status === 'active' && (() => {
            const daysUntil = getDaysUntilMaintenance(scannedEquipment);
            if (daysUntil !== null && daysUntil <= 7 && daysUntil > 0) {
              return (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Sắp đến lịch bảo trì</h4>
                      <p className="text-sm text-blue-700">
                        Thiết bị này sẽ cần bảo trì trong vòng {daysUntil} ngày tới.
                      </p>
                    </div>
                  </div>
                </div>
              );
            } else if (daysUntil !== null && daysUntil <= 0) {
              return (
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-orange-900 mb-1">Đã quá hạn bảo trì</h4>
                      <p className="text-sm text-orange-700">
                        Thiết bị này đã quá hạn bảo trì. Vui lòng thông báo cho bộ phận kỹ thuật.
                      </p>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Chi tiết thiết bị */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Thông tin kỹ thuật */}
            <div className="card-standard">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Thông tin kỹ thuật
              </h3>
              <div className="space-y-2 text-sm">
                {scannedEquipment.description && (
                  <div>
                    <span className="text-gray-600">Mô tả:</span>
                    <p className="text-gray-900 mt-1">{scannedEquipment.description}</p>
                  </div>
                )}
                {scannedEquipment.specifications && (
                  <div>
                    <span className="text-gray-600">Thông số kỹ thuật:</span>
                    <pre className="text-gray-900 mt-1 whitespace-pre-wrap bg-gray-50 p-2 rounded text-xs">
                      {scannedEquipment.specifications}
                    </pre>
                  </div>
                )}
                {!scannedEquipment.description && !scannedEquipment.specifications && (
                  <p className="text-gray-500 italic">Chưa có thông tin kỹ thuật</p>
                )}
              </div>
            </div>

            {/* Bảo trì & Bảo hành */}
            <div className="card-standard">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-600" />
                Bảo trì & Bảo hành
              </h3>
              <div className="space-y-3 text-sm">
                {scannedEquipment.warrantyExpiry && (
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <span className="text-gray-600">Bảo hành đến:</span>
                      <p className="text-gray-900 font-medium">{formatDate(scannedEquipment.warrantyExpiry)}</p>
                      {new Date(scannedEquipment.warrantyExpiry) > new Date() && (
                        <span className="text-green-600 text-xs">Còn hiệu lực</span>
                      )}
                      {new Date(scannedEquipment.warrantyExpiry) <= new Date() && (
                        <span className="text-red-600 text-xs">Đã hết hạn</span>
                      )}
                    </div>
                  </div>
                )}

                {scannedEquipment.lastMaintenanceDate && (
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <span className="text-gray-600">Bảo trì lần cuối:</span>
                      <p className="text-gray-900">{formatDate(scannedEquipment.lastMaintenanceDate)}</p>
                    </div>
                  </div>
                )}

                {calculateNextMaintenanceDate(scannedEquipment) && (
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <span className="text-gray-600">Bảo trì tiếp theo:</span>
                      <p className="text-gray-900">
                        {formatDate(calculateNextMaintenanceDate(scannedEquipment))}
                      </p>
                      {(() => {
                        const days = getDaysUntilMaintenance(scannedEquipment);
                        if (days !== null) {
                          if (days > 0) {
                            return <span className="text-blue-600 text-xs">Còn {days} ngày</span>;
                          } else if (days === 0) {
                            return <span className="text-orange-600 text-xs font-semibold">Hôm nay</span>;
                          } else {
                            return <span className="text-red-600 text-xs font-semibold">Quá hạn {Math.abs(days)} ngày</span>;
                          }
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}

                {maintenanceInfo && maintenanceInfo.totalMaintenances > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Tổng số lần bảo trì:</span>
                    <p className="text-gray-900 font-semibold">{maintenanceInfo.totalMaintenances} lần</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lịch sử quét gần đây */}
      {recentScans.length > 0 && (
        <div className="card-standard">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Thiết bị đã quét gần đây
          </h3>
          
          <div className="space-y-3">
            {recentScans.map((scan, index) => (
              <div 
                key={`${scan.id}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => setScannedEquipment(scan)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  
                  <div>
                    <p className="font-medium text-primary text-sm">{scan.name}</p>
                    <p className="text-xs text-secondary">{scan.qrCode}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <StatusBadge status={scan.status} />
                  <p className="text-xs text-secondary mt-1">
                    {formatDateTime(scan.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hướng dẫn sử dụng */}
      <div className="card-standard">
        <h3 className="text-lg font-semibold text-primary mb-3">
          Hướng dẫn sử dụng
        </h3>
        
        <div className="space-y-2 text-sm text-secondary">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
            <span>Nhấn nút "Bắt đầu quét" để mở camera</span>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
            <span>Đưa camera gần mã QR/RFID trên thiết bị</span>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
            <span>Xem thông tin thiết bị và thực hiện các thao tác cần thiết</span>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default ScanPage;