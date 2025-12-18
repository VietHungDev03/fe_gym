import { equipmentService } from '../services/equipmentService';
import { trackingService } from '../services/trackingService';

// Dữ liệu mẫu thiết bị
const sampleEquipment = [
  {
    name: 'Máy chạy bộ Life Fitness T3',
    type: 'Máy chạy bộ',
    description: 'Máy chạy bộ cao cấp với màn hình cảm ứng và nhiều chương trình tập luyện',
    location: 'Khu vực Cardio - Tầng 1',
    specifications: 'Động cơ 3.0HP, tốc độ tối đa 20km/h, độ dốc 15%',
    purchaseDate: '2024-01-15',
    warrantyExpiry: '2026-01-15',
    maintenanceInterval: 30,
    status: 'active'
  },
  {
    name: 'Máy tập tạ đa năng Technogym',
    type: 'Máy tập tạ',
    description: 'Máy tập tạ đa năng với nhiều bài tập cho toàn thân',
    location: 'Khu vực Strength - Tầng 1',
    specifications: 'Trọng lượng tối đa 200kg, 12 bài tập khác nhau',
    purchaseDate: '2024-02-10',
    warrantyExpiry: '2027-02-10',
    maintenanceInterval: 45,
    status: 'active'
  },
  {
    name: 'Xe đạp tập thể dục Schwinn',
    type: 'Xe đạp tập thể dục',
    description: 'Xe đạp tập với hệ thống điều khiển từ tính',
    location: 'Khu vực Cardio - Tầng 1',
    specifications: '32 mức độ kháng cự, màn hình LCD',
    purchaseDate: '2024-01-20',
    warrantyExpiry: '2026-01-20',
    maintenanceInterval: 60,
    status: 'maintenance'
  },
  {
    name: 'Máy chèo thuyền Concept2',
    type: 'Máy chèo thuyền',
    description: 'Máy chèo thuyền chuyên nghiệp cho bài tập toàn thân',
    location: 'Khu vực Cardio - Tầng 2',
    specifications: 'Hệ thống phanh khí, màn hình PM5',
    purchaseDate: '2024-03-05',
    warrantyExpiry: '2026-03-05',
    maintenanceInterval: 90,
    status: 'active'
  },
  {
    name: 'Máy tập bụng AB Coaster',
    type: 'Máy tập bụng',
    description: 'Máy tập bụng với động tác tự nhiên, bảo vệ cột sống',
    location: 'Khu vực Functional - Tầng 1',
    specifications: 'Khung thép không gỉ, đệm cao cấp',
    purchaseDate: '2024-02-25',
    warrantyExpiry: '2025-02-25',
    maintenanceInterval: 30,
    status: 'inactive'
  },
  {
    name: 'Máy tập vai Hammer Strength',
    type: 'Máy tập vai',
    description: 'Máy tập vai chuyên nghiệp với chuyển động tự nhiên',
    location: 'Khu vực Strength - Tầng 2',
    specifications: 'Tải trọng tối đa 150kg, điều chỉnh đa cấp',
    purchaseDate: '2024-01-30',
    warrantyExpiry: '2027-01-30',
    maintenanceInterval: 45,
    status: 'active'
  }
];

// Hàm seed dữ liệu
export const seedDatabase = async () => {
  try {
    console.log('🌱 Bắt đầu seed dữ liệu...');
    
    // Kiểm tra xem đã có dữ liệu chưa
    const existingEquipment = await equipmentService.getAllEquipment();
    if (existingEquipment.length > 0) {
      console.log('📊 Đã có dữ liệu trong database, bỏ qua seed');
      return { success: true, message: 'Dữ liệu đã tồn tại' };
    }

    const createdEquipment = [];

    // Thêm thiết bị mẫu
    console.log('📦 Đang thêm thiết bị mẫu...');
    for (const equipment of sampleEquipment) {
      const qrCode = equipmentService.generateQRCode(Date.now().toString());
      const equipmentData = {
        ...equipment,
        qrCode: qrCode
      };
      
      const equipmentId = await equipmentService.createEquipment(equipmentData);
      createdEquipment.push({ id: equipmentId, ...equipmentData });
      console.log(`✅ Đã tạo: ${equipment.name}`);
    }

    // Tạo lịch bảo trì mẫu
    console.log('📅 Đang tạo lịch bảo trì mẫu...');
    for (let i = 0; i < Math.min(3, createdEquipment.length); i++) {
      const equipment = createdEquipment[i];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30) + 1);

      await trackingService.scheduleMaintenance(
        equipment.id,
        futureDate,
        'preventive',
        `Bảo trì định kỳ cho ${equipment.name}`,
        'medium'
      );
      console.log(`🔧 Đã lên lịch bảo trì: ${equipment.name}`);
    }

    // Tạo một số usage logs mẫu
    console.log('📊 Đang tạo usage logs mẫu...');
    for (let i = 0; i < Math.min(5, createdEquipment.length); i++) {
      const equipment = createdEquipment[i];
      await trackingService.logUsage(
        equipment.id,
        'demo_user',
        'Sử dụng demo từ seed data'
      );
      console.log(`📈 Đã tạo usage log: ${equipment.name}`);
    }

    console.log('🎉 Seed dữ liệu hoàn thành!');
    return { 
      success: true, 
      message: `Đã tạo ${createdEquipment.length} thiết bị với dữ liệu mẫu` 
    };

  } catch (error) {
    console.error('❌ Lỗi seed dữ liệu:', error);
    return { 
      success: false, 
      message: error.message 
    };
  }
};

// Hàm xóa tất cả dữ liệu (chỉ dùng trong development)
export const clearDatabase = async () => {
  try {
    console.log('🧹 Đang xóa tất cả dữ liệu...');
    
    const equipment = await equipmentService.getAllEquipment();
    
    for (const item of equipment) {
      await equipmentService.deleteEquipment(item.id);
      console.log(`🗑️ Đã xóa: ${item.name}`);
    }

    console.log('✅ Đã xóa tất cả dữ liệu');
    return { success: true, message: 'Đã xóa tất cả dữ liệu' };
    
  } catch (error) {
    console.error('❌ Lỗi xóa dữ liệu:', error);
    return { success: false, message: error.message };
  }
};