import { useState, useEffect } from 'react';
import { 
  Users, UserCheck, UserPlus, 
  Award, TrendingUp, Clock, CheckCircle,
  AlertTriangle, Calendar, Target, Activity, Trophy,
  Edit, Trash2, Mail, Phone, MapPin, X, Save,
  Plus, Search, Filter, Download, UserX, Shield, User
} from 'lucide-react';
import { userService } from '../services/userService';
import { trackingService } from '../services/trackingService';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const TeamManagementPage = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamStats, setTeamStats] = useState({
    totalTechnicians: 0,
    activeMembers: 0,
    totalTasks: 0,
    completedTasks: 0,
    averageEfficiency: 0
  });
  const [workloadData, setWorkloadData] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditMember, setShowEditMember] = useState(false);
  const [showMemberDetail, setShowMemberDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterWorkload, setFilterWorkload] = useState('all');
  const [editingMember, setEditingMember] = useState(null);
  const [newMemberData, setNewMemberData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'technician',
    department: '',
    address: ''
  });

  const { showError, showSuccess } = useNotification();
  const { userProfile } = useAuth();

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      setLoading(true);

      // Load all users and filter technicians
      const allUsers = await userService.getAllUsers();
      const technicians = allUsers.filter(user => user.role === 'technician');
      
      // Load maintenance and incident data
      const maintenanceRecords = await trackingService.getMaintenanceRecords();
      const incidents = await trackingService.getIncidentReports();

      // Calculate workload for each technician
      const workloadAnalysis = technicians.map(tech => {
        const assignedMaintenance = maintenanceRecords.filter(record => 
          record.assignedTo === tech.id
        );
        const assignedIncidents = incidents.filter(incident => 
          incident.assignedTo === tech.id || incident.investigator === tech.id
        );

        const totalTasks = assignedMaintenance.length + assignedIncidents.length;
        const completedTasks = [
          ...assignedMaintenance.filter(r => r.status === 'completed'),
          ...assignedIncidents.filter(i => ['resolved', 'closed'].includes(i.status))
        ].length;
        
        const pendingTasks = [
          ...assignedMaintenance.filter(r => ['scheduled', 'pending'].includes(r.status)),
          ...assignedIncidents.filter(i => i.status === 'reported')
        ].length;
        
        const inProgressTasks = [
          ...assignedMaintenance.filter(r => r.status === 'in-progress'),
          ...assignedIncidents.filter(i => ['investigating', 'in-progress'].includes(i.status))
        ].length;

        const efficiency = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
        const workloadLevel = totalTasks >= 20 ? 'overloaded' : totalTasks >= 10 ? 'busy' : 'available';

        return {
          ...tech,
          totalTasks,
          completedTasks,
          pendingTasks,
          inProgressTasks,
          efficiency,
          workloadLevel,
          lastActive: new Date(), // Mock data
          joinDate: tech.createdAt || new Date()
        };
      });

      // Calculate team statistics
      const totalTasks = workloadAnalysis.reduce((sum, member) => sum + member.totalTasks, 0);
      const completedTasks = workloadAnalysis.reduce((sum, member) => sum + member.completedTasks, 0);
      const averageEfficiency = workloadAnalysis.length > 0 
        ? Math.round(workloadAnalysis.reduce((sum, member) => sum + member.efficiency, 0) / workloadAnalysis.length)
        : 0;

      setTeamMembers(technicians);
      setWorkloadData(workloadAnalysis.sort((a, b) => b.efficiency - a.efficiency));
      setTeamStats({
        totalTechnicians: technicians.length,
        activeMembers: workloadAnalysis.filter(m => m.inProgressTasks > 0).length,
        totalTasks,
        completedTasks,
        averageEfficiency
      });

    } catch (error) {
      console.error('Lỗi tải dữ liệu team:', error);
      showError('Không thể tải dữ liệu team');
    } finally {
      setLoading(false);
    }
  };

  const getWorkloadColor = (level) => {
    const colors = {
      available: 'text-green-600 bg-green-100',
      busy: 'text-yellow-600 bg-yellow-100',
      overloaded: 'text-red-600 bg-red-100'
    };
    return colors[level] || colors.available;
  };

  const getWorkloadLabel = (level) => {
    const labels = {
      available: 'Sẵn sàng',
      busy: 'Bận',
      overloaded: 'Quá tải'
    };
    return labels[level] || 'Sẵn sàng';
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (date) => {
    if (!date) return 'Không xác định';
    
    // Handle different date formats
    let dateObj;
    if (date.toDate && typeof date.toDate === 'function') {
      // Firestore Timestamp
      dateObj = date;
    } else if (date.seconds) {
      // Firestore Timestamp object
      dateObj = new Date(date.seconds * 1000);
    } else if (date instanceof Date) {
      // Regular Date object
      dateObj = date;
    } else if (typeof date === 'string' || typeof date === 'number') {
      // String or number date
      dateObj = new Date(date);
    } else {
      return 'Không xác định';
    }

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Không xác định';
    }

    return dateObj.toLocaleDateString('vi-VN');
  };

  // Filter team members based on search and filters
  const filteredMembers = workloadData.filter(member => {
    const matchesSearch = member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    const matchesWorkload = filterWorkload === 'all' || member.workloadLevel === filterWorkload;
    return matchesSearch && matchesRole && matchesWorkload;
  });

  // Handle add new member
  const handleAddMember = async (e) => {
    e.preventDefault();
    
    if (!newMemberData.fullName || !newMemberData.email) {
      showError('Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      setLoading(true);
      const newMember = {
        id: Date.now().toString(),
        uid: Date.now().toString(),
        ...newMemberData,
        displayName: newMemberData.fullName,
        status: 'active',
        joinDate: new Date(),
        completedTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0,
        efficiency: 85,
        workloadLevel: 'available'
      };
      
      setWorkloadData(prev => [...prev, newMember]);
      setShowAddMember(false);
      setNewMemberData({
        fullName: '',
        email: '',
        phone: '',
        role: 'technician',
        department: '',
        address: ''
      });
      showSuccess('Thêm thành viên mới thành công!');
      await loadTeamData();
    } catch (error) {
      console.error('Lỗi thêm thành viên:', error);
      showError('Không thể thêm thành viên mới');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit member
  const handleEditMember = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setWorkloadData(prev => 
        prev.map(member => 
          member.id === editingMember.id 
            ? { ...member, ...editingMember }
            : member
        )
      );
      
      setShowEditMember(false);
      setEditingMember(null);
      showSuccess('Cập nhật thông tin thành công!');
    } catch (error) {
      console.error('Lỗi cập nhật thành viên:', error);
      showError('Không thể cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete member
  const handleDeleteMember = async (memberId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thành viên này?')) {
      return;
    }

    try {
      setLoading(true);
      setWorkloadData(prev => prev.filter(member => member.id !== memberId));
      showSuccess('Xóa thành viên thành công!');
      await loadTeamData();
    } catch (error) {
      console.error('Lỗi xóa thành viên:', error);
      showError('Không thể xóa thành viên');
    } finally {
      setLoading(false);
    }
  };

  // Export team report to Excel
  const handleExportReport = () => {
    const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const roleLabel = (role) => ({
      admin: 'Admin',
      manager: 'Manager',
      technician: 'Technician',
      user: 'User'
    }[role] || 'User');
    const statusLabel = (level) => ({
      available: 'Available',
      busy: 'Busy',
      overloaded: 'Overloaded'
    }[level] || 'Available');

    const headers = [
      'Full Name',
      'Email',
      'Role',
      'Completed',
      'Ongoing',
      'Performance (%)',
      'Status',
      'Join Date'
    ];

    const rows = workloadData.map(member => [
      escapeCsv(member.fullName),
      escapeCsv(member.email),
      escapeCsv(roleLabel(member.role)),
      member.completedTasks,
      member.inProgressTasks,
      member.efficiency,
      escapeCsv(statusLabel(member.workloadLevel)),
      escapeCsv(formatDate(member.joinDate))
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess('Xuất Excel thành công!');
  };

  if (loading) {
    return <LoadingSpinner className="py-8" size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">
            Quản lý Team
          </h1>
          <p className="text-secondary mt-1">
            Theo dõi và quản lý hiệu suất đội ngũ kỹ thuật viên
          </p>
        </div>
        
        <button
          onClick={handleExportReport}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Xuất Excel
        </button>
      </div>

      {/* Team Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng nhân viên</p>
              <p className="text-2xl font-bold text-gray-900">{teamStats.totalTechnicians}</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Đang hoạt động</p>
              <p className="text-2xl font-bold text-green-700">{teamStats.activeMembers}</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Tổng nhiệm vụ</p>
              <p className="text-2xl font-bold text-blue-700">{teamStats.totalTasks}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Đã hoàn thành</p>
              <p className="text-2xl font-bold text-yellow-700">{teamStats.completedTasks}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">Hiệu suất TB</p>
              <p className="text-2xl font-bold text-purple-700">{teamStats.averageEfficiency}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Team Performance Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
            <Award className="w-5 h-5" />
            Hiệu suất từng thành viên
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhân viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng CV
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hoàn thành
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đang làm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hiệu suất
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tham gia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workloadData.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {member.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{member.totalTasks}</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-green-600 font-medium">{member.completedTasks}</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-blue-600 font-medium">{member.inProgressTasks}</div>
                    <div className="text-xs text-yellow-600">
                      {member.pendingTasks || 0} chờ xử lý
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${member.efficiency}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-medium ${getEfficiencyColor(member.efficiency)}`}>
                        {member.efficiency}%
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getWorkloadColor(member.workloadLevel)}`}>
                      {getWorkloadLabel(member.workloadLevel)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(member.joinDate)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button 
                      onClick={() => {
                        setSelectedMember(member);
                        setShowMemberDetail(true);
                      }}
                      className="text-purple-600 hover:text-purple-900 mr-3 flex items-center gap-1"
                    >
                      <User className="w-4 h-4" />
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Nhân viên xuất sắc
          </h3>
          
          {workloadData.slice(0, 3).map((member, index) => (
            <div key={member.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                  index === 0 ? 'bg-yellow-500' : 
                  index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{member.fullName}</div>
                  <div className="text-sm text-gray-500">
                    {member.completedTasks} hoàn thành / {member.totalTasks} tổng
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-purple-600">{member.efficiency}%</div>
                <div className="text-xs text-gray-500">hiệu suất</div>
              </div>
            </div>
          ))}
        </div>

        {/* Team Workload Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Phân bố khối lượng công việc
          </h3>
          
          <div className="space-y-4">
            {['available', 'busy', 'overloaded'].map(level => {
              const count = workloadData.filter(m => m.workloadLevel === level).length;
              const percentage = workloadData.length > 0 ? Math.round((count / workloadData.length) * 100) : 0;
              
              return (
                <div key={level} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${
                      level === 'available' ? 'bg-green-500' :
                      level === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm text-gray-700 capitalize">
                      {getWorkloadLabel(level)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          level === 'available' ? 'bg-green-500' :
                          level === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12">{count} người</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Member Detail Modal */}
      {showMemberDetail && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Chi tiết thành viên
              </h2>
              <button
                onClick={() => {
                  setShowMemberDetail(false);
                  setSelectedMember(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-500" />
                    Thông tin cá nhân
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Tên:</span>
                      <span className="text-sm font-medium">{selectedMember.fullName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm font-medium">{selectedMember.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">SĐT:</span>
                      <span className="text-sm font-medium">{selectedMember.phone || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Vai trò:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedMember.role === 'admin' ? 'bg-red-100 text-red-800' :
                        selectedMember.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        selectedMember.role === 'technician' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedMember.role === 'admin' ? 'Quản trị viên' :
                         selectedMember.role === 'manager' ? 'Quản lý' :
                         selectedMember.role === 'technician' ? 'Kỹ thuật viên' : 'Người dùng'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Hiệu suất công việc
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Hoàn thành:</span>
                      <span className="text-sm font-bold text-green-600">{selectedMember.completedTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Đang làm:</span>
                      <span className="text-sm font-bold text-blue-600">{selectedMember.inProgressTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Chờ xử lý:</span>
                      <span className="text-sm font-bold text-yellow-600">{selectedMember.pendingTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Hiệu suất:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${selectedMember.efficiency}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-bold ${getEfficiencyColor(selectedMember.efficiency)}`}>
                          {selectedMember.efficiency}%
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Trạng thái:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getWorkloadColor(selectedMember.workloadLevel)}`}>
                        {getWorkloadLabel(selectedMember.workloadLevel)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin bổ sung</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Ngày tham gia:</span>
                    <div className="text-sm font-medium">{formatDate(selectedMember.joinDate)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Phòng ban:</span>
                    <div className="text-sm font-medium">{selectedMember.department || 'Chưa cập nhật'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowMemberDetail(false);
                  setSelectedMember(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagementPage;
