const express = require('express');
const router = express.Router();
const { HiringRequest, Position, User } = require('../models');
const { auth, authorize } = require('../middleware/auth');

// 获取招聘需求列表
// - 部门主管：只看到自己提交的
// - HR/管理员：看到所有
router.get('/', auth, async (req, res) => {
  try {
    const { status, department, page = 1, pageSize = 20 } = req.query;
    const filter = {};

    if (req.user.role === 'dept_manager') {
      filter.requesterId = req.user._id;
    }
    if (status) filter.status = status;
    if (department) filter.department = department;

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const [requests, total] = await Promise.all([
      HiringRequest.find(filter)
        .populate('requesterId', 'realName username department')
        .populate('positionId', 'name status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(pageSize)),
      HiringRequest.countDocuments(filter)
    ]);

    // 待审批数量（给HR/管理员看）
    let pendingCount = 0;
    if (['super_admin', 'hr'].includes(req.user.role)) {
      pendingCount = await HiringRequest.countDocuments({ status: 'pending' });
    }

    res.json({
      success: true,
      data: requests,
      total,
      pendingCount,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (error) {
    console.error('获取招聘需求错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 部门主管提交招聘需求
router.post('/', auth, authorize('dept_manager', 'hr', 'super_admin'), async (req, res) => {
  try {
    const {
      positionName, headcount, location, reason, urgency,
      expectedDate, jd, requirements, salaryMin, salaryMax, department
    } = req.body;

    if (!positionName || !reason || !jd || !requirements) {
      return res.status(400).json({ success: false, message: '请填写完整的需求信息' });
    }

    const request = await HiringRequest.create({
      requesterId: req.user._id,
      requesterName: req.user.realName || req.user.username,
      department: department || req.user.department || '未指定',
      positionName,
      headcount: headcount || 1,
      location,
      reason,
      urgency: urgency || 'normal',
      expectedDate: expectedDate ? new Date(expectedDate) : undefined,
      jd,
      requirements,
      salaryMin,
      salaryMax
    });

    res.json({ success: true, data: request, message: '招聘需求已提交，等待审批' });
  } catch (error) {
    console.error('提交招聘需求错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 审批招聘需求（HR/管理员）
router.post('/:id/review', auth, authorize('super_admin', 'hr'), async (req, res) => {
  try {
    const { approved, comment, rejectReason } = req.body;

    const request = await HiringRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: '招聘需求不存在' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: '该需求已审批过' });
    }

    request.status = approved ? 'approved' : 'rejected';
    request.approverId = req.user._id;
    request.approverName = req.user.realName || req.user.username;
    request.approvedAt = new Date();
    request.reviewComment = comment;
    if (!approved) request.rejectReason = rejectReason || comment;

    await request.save();
    res.json({ success: true, data: request, message: approved ? '已通过审批' : '已驳回' });
  } catch (error) {
    console.error('审批错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 一键转成正式岗位（HR/管理员）
router.post('/:id/transfer', auth, authorize('super_admin', 'hr'), async (req, res) => {
  try {
    const request = await HiringRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: '招聘需求不存在' });
    }
    if (request.status !== 'approved') {
      return res.status(400).json({ success: false, message: '只有已通过的需求才能转为岗位' });
    }
    if (request.positionId) {
      return res.status(400).json({ success: false, message: '该需求已转过岗位' });
    }

    // 创建正式岗位
    const position = await Position.create({
      name: request.positionName,
      department: request.department,
      headcount: request.headcount,
      location: request.location || '待定',
      jd: request.jd,
      requirements: request.requirements,
      salaryMin: request.salaryMin,
      salaryMax: request.salaryMax,
      status: 'open',
      publishedBy: req.user._id
    });

    request.status = 'transferred';
    request.positionId = position._id;
    await request.save();

    res.json({ success: true, data: { request, position }, message: '已转为正式岗位，开始招聘' });
  } catch (error) {
    console.error('转岗位错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取单个需求详情
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await HiringRequest.findById(req.params.id)
      .populate('requesterId', 'realName username department')
      .populate('positionId');

    if (!request) {
      return res.status(404).json({ success: false, message: '招聘需求不存在' });
    }

    // 部门主管只能看自己的
    if (req.user.role === 'dept_manager' && request.requesterId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: '无权查看' });
    }

    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 撤销/删除需求（提交人可撤销待审批的，管理员可删任意）
router.delete('/:id', auth, async (req, res) => {
  try {
    const request = await HiringRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: '招聘需求不存在' });
    }

    const isOwner = request.requesterId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'super_admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: '无权删除' });
    }
    if (isOwner && !isAdmin && request.status !== 'pending') {
      return res.status(400).json({ success: false, message: '已审批的需求不能撤销' });
    }

    await HiringRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: '已删除' });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
