const express = require('express');
const router = express.Router();
const { Position } = require('../models');
const { auth, authorize, deny, maskPhone } = require('../middleware/auth');

router.use(maskPhone);
router.use(auth, deny('dept_manager'));

// 获取所有岗位
router.get('/', auth, async (req, res) => {
  try {
    const { status, department, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const positions = await Position.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: positions });
  } catch (error) {
    console.error('获取岗位列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取单个岗位
router.get('/:id', auth, async (req, res) => {
  try {
    const position = await Position.findById(req.params.id);
    if (!position) {
      return res.status(404).json({ success: false, message: '岗位不存在' });
    }
    res.json({ success: true, data: position });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 创建岗位
router.post('/', auth, authorize('super_admin', 'hr'), async (req, res) => {
  try {
    const position = await Position.create({
      ...req.body,
      publishedBy: req.user.id
    });
    res.json({ success: true, data: position });
  } catch (error) {
    console.error('创建岗位错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新岗位
router.put('/:id', auth, authorize('super_admin', 'hr'), async (req, res) => {
  try {
    const position = await Position.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!position) {
      return res.status(404).json({ success: false, message: '岗位不存在' });
    }
    res.json({ success: true, data: position });
  } catch (error) {
    console.error('更新岗位错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 删除岗位
router.delete('/:id', auth, authorize('super_admin'), async (req, res) => {
  try {
    const position = await Position.findByIdAndDelete(req.params.id);
    if (!position) {
      return res.status(404).json({ success: false, message: '岗位不存在' });
    }
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 自动填充 (根据招聘人数和已招人数)
router.put('/:id/auto-fill', auth, authorize('super_admin', 'hr'), async (req, res) => {
  try {
    const position = await Position.findById(req.params.id);
    if (!position) {
      return res.status(404).json({ success: false, message: '岗位不存在' });
    }

    // 这里可以添加逻辑：根据filledCount和headcount自动判断状态
    if (position.filledCount >= position.headcount) {
      position.status = 'filled';
    }
    await position.save();
    res.json({ success: true, data: position });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
