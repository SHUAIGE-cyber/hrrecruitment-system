const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { auth, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// 获取用户列表
router.get('/', auth, authorize('super_admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 创建用户
router.post('/', auth, authorize('super_admin'), async (req, res) => {
  try {
    const { username, password, role, realName, department, email, phone } = req.body;

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashedPassword,
      role,
      realName,
      department,
      email,
      phone
    });

    res.json({ success: true, data: { id: user._id, username: user.username, role: user.role, realName: user.realName } });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新用户
router.put('/:id', auth, authorize('super_admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ...req.body, password: undefined },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 删除用户
router.delete('/:id', auth, authorize('super_admin'), async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: '不能删除自己' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
