const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/recruitment');
    console.log('MongoDB 连接成功');

    // 清除已有数据
    await User.deleteMany({});

    // 创建默认用户
    const adminPassword = await bcrypt.hash('admin123', 10);
    const hrPassword = await bcrypt.hash('hr123456', 10);
    const interviewerPassword = await bcrypt.hash('interview123', 10);

    const users = [
      {
        username: 'admin',
        password: adminPassword,
        role: 'super_admin',
        realName: '系统管理员',
        department: 'IT部',
        email: 'admin@company.com',
        isActive: true
      },
      {
        username: 'hr01',
        password: hrPassword,
        role: 'hr',
        realName: '张HR',
        department: '人力资源部',
        email: 'hr01@company.com',
        isActive: true
      },
      {
        username: 'mgr01',
        password: interviewerPassword,
        role: 'interviewer',
        realName: '李经理',
        department: '技术部',
        email: 'mgr01@company.com',
        isActive: true
      }
    ];

    await User.insertMany(users);
    console.log('默认用户创建成功:');
    console.log('  超级管理员: admin / admin123');
    console.log('  HR专员: hr01 / hr123456');
    console.log('  面试官: mgr01 / interview123');

    process.exit(0);
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  }
}

seed();
