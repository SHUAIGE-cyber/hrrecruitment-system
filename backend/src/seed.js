const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/recruitment');
    console.log('MongoDB 连接成功');

    // 创建默认用户（已存在则跳过，不删除现有数据）
    const adminPassword = await bcrypt.hash('admin123', 10);
    const hrPassword = await bcrypt.hash('hr123456', 10);
    const interviewerPassword = await bcrypt.hash('interview123', 10);
    const deptManagerPassword = await bcrypt.hash('manager123', 10);

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
      },
      {
        username: 'boss01',
        password: deptManagerPassword,
        role: 'dept_manager',
        realName: '王主管',
        department: '技术部',
        email: 'boss01@company.com',
        isActive: true
      }
    ];

    let created = 0;
    for (const u of users) {
      const exists = await User.findOne({ username: u.username });
      if (!exists) {
        await User.create(u);
        created++;
      }
    }

    if (created > 0) {
      console.log(`新增 ${created} 个默认用户:`);
      console.log('  超级管理员: admin / admin123');
      console.log('  HR专员: hr01 / hr123456');
      console.log('  面试官: mgr01 / interview123');
      console.log('  部门主管: boss01 / manager123');
    } else {
      console.log('所有默认用户已存在，无需创建');
    }
    console.log('（已有账号和数据保持不变）');

    process.exit(0);
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  }
}

seed();
