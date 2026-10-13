const express = require('express');
const router = express.Router();
const { Offer, Candidate, Position } = require('../models');
const { auth, authorize, deny, maskPhone } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(maskPhone);
router.use(auth, deny('dept_manager'));

// 获取 Offer 列表
router.get('/', auth, async (req, res) => {
  try {
    const { candidateId, positionId, status, page = 1, pageSize = 20 } = req.query;
    const filter = {};
    if (candidateId) filter.candidateId = candidateId;
    if (positionId) filter.positionId = positionId;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const [offers, total] = await Promise.all([
      Offer.find(filter)
        .populate('candidateId', 'name phone email')
        .populate('positionId', 'name department')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(pageSize)),
      Offer.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: offers,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (error) {
    console.error('获取Offer列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取单个 Offer
router.get('/:id', auth, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate('candidateId', 'name phone email education workExperience')
      .populate('positionId', 'name department');
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer不存在' });
    }
    res.json({ success: true, data: offer });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 创建 Offer
router.post('/', auth, authorize('super_admin', 'hr'), upload.single('offerFile'), async (req, res) => {
  try {
    const offerData = {
      ...req.body,
      candidateId: req.body.candidateId,
      positionId: req.body.positionId,
      salary: req.body.salary ? parseFloat(req.body.salary) : undefined,
      bonus: req.body.bonus ? parseFloat(req.body.bonus) : undefined
    };

    if (req.file) {
      offerData.offerFile = req.file.path.replace('uploads/', '');
      offerData.offerFileName = req.file.originalname;
    }

    const offer = await Offer.create(offerData);

    // 自动构建审批流
    if (offerData.approvalFlow) {
      offer.approvalFlow = offerData.approvalFlow.map(step => ({
        ...step,
        status: step.status || 'pending',
        approvedAt: null
      }));
      await offer.save();
    }

    res.json({ success: true, data: offer });
  } catch (error) {
    console.error('创建Offer错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新 Offer
router.put('/:id', auth, authorize('super_admin', 'hr'), async (req, res) => {
  try {
    const offer = await Offer.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('candidateId positionId');

    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer不存在' });
    }
    res.json({ success: true, data: offer });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 审批操作
router.post('/:id/approve', auth, authorize('super_admin', 'hr'), async (req, res) => {
  try {
    const { comment } = req.body;
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer不存在' });
    }

    // 找到当前待审批的节点
    const currentStep = offer.approvalFlow.find(step => step.status === 'pending');
    if (!currentStep) {
      return res.status(400).json({ success: false, message: '当前没有待审批的节点' });
    }

    currentStep.status = req.body.approved ? 'approved' : 'rejected';
    currentStep.comment = comment;
    currentStep.approvedAt = new Date();

    // 检查是否所有节点都审批完成
    const allDone = offer.approvalFlow.every(step => step.status !== 'pending');
    if (allDone) {
      offer.status = currentStep.status === 'approved' ? 'approved' : 'rejected';
      // 如果候选人通过所有审批，自动更新阶段
      if (offer.status === 'approved') {
        await Candidate.findByIdAndUpdate(offer.candidateId, { currentStage: 'offer' });
      }
    }

    await offer.save();
    res.json({ success: true, data: offer });
  } catch (error) {
    console.error('审批操作错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 删除 Offer
router.delete('/:id', auth, authorize('super_admin'), async (req, res) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
