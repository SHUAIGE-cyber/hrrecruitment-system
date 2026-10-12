const express = require('express');
const router = express.Router();
const { Interview, Candidate, Position } = require('../models');
const { auth, authorize, maskPhone } = require('../middleware/auth');
const { summarizeInterview } = require('../services/aiService');

router.use(maskPhone);

// 获取面试列表
router.get('/', auth, async (req, res) => {
  try {
    const { candidateId, positionId, stage, status, page = 1, pageSize = 20 } = req.query;
    const filter = {};
    if (candidateId) filter.candidateId = candidateId;
    if (positionId) filter.positionId = positionId;
    if (stage) filter.stage = stage;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const [interviews, total] = await Promise.all([
      Interview.find(filter)
        .populate('candidateId', 'name phone email')
        .populate('positionId', 'name department')
        .sort({ interviewDate: -1 })
        .skip(skip)
        .limit(parseInt(pageSize)),
      Interview.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: interviews,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (error) {
    console.error('获取面试列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取单个面试
router.get('/:id', auth, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('candidateId', 'name phone email education workExperience')
      .populate('positionId', 'name department jd requirements');
    if (!interview) {
      return res.status(404).json({ success: false, message: '面试记录不存在' });
    }
    res.json({ success: true, data: interview });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 创建面试
router.post('/', auth, authorize('super_admin', 'hr'), async (req, res) => {
  try {
    const { candidateId, positionId, stage, interviewer, interviewDate, notes } = req.body;

    // 检查是否已存在该阶段面试
    const existing = await Interview.findOne({ candidateId, positionId, stage });
    if (existing) {
      return res.status(400).json({ success: false, message: '该阶段面试已存在' });
    }

    const interview = await Interview.create({
      candidateId,
      positionId,
      stage,
      interviewer,
      interviewDate: interviewDate ? new Date(interviewDate) : undefined,
      notes,
      status: 'scheduled'
    });

    // 自动更新候选人当前阶段
    await Candidate.findByIdAndUpdate(candidateId, { currentStage: stage });

    res.json({ success: true, data: interview });
  } catch (error) {
    console.error('创建面试错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新面试 (完成面试时调用)
router.put('/:id', auth, authorize('super_admin', 'hr'), async (req, res) => {
  try {
    const interview = await Interview.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('candidateId positionId');

    if (!interview) {
      return res.status(404).json({ success: false, message: '面试记录不存在' });
    }

    // 如果完成了面试，更新候选人阶段
    if (req.body.status === 'completed' || req.body.score !== undefined) {
      const candidate = await Candidate.findById(interview.candidateId);
      if (candidate) {
        const stageOrder = ['resume_screen', 'interview_1', 'interview_2', 'interview_3', 'offer', 'onboard', 'rejected'];
        const currentIndex = stageOrder.indexOf(interview.stage);
        if (req.body.reason && req.body.reason.trim()) {
          candidate.currentStage = 'rejected';
        } else if (currentIndex < stageOrder.length - 1) {
          candidate.currentStage = stageOrder[currentIndex + 1];
        }
        await candidate.save();
      }
    }

    res.json({ success: true, data: interview });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// AI 自动总结面试
router.post('/:id/summarize', auth, authorize('super_admin', 'hr'), async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('candidateId positionId');

    if (!interview) {
      return res.status(404).json({ success: false, message: '面试记录不存在' });
    }

    const summary = await summarizeInterview(
      {
        interviewer: interview.interviewer,
        interviewDate: interview.interviewDate,
        evaluation: interview.evaluation,
        notes: interview.notes,
        score: interview.score
      },
      interview.stage,
      interview.positionId
    );

    interview.aiSummary = summary;
    await interview.save();

    res.json({ success: true, data: { aiSummary: summary } });
  } catch (error) {
    console.error('AI总结错误:', error);
    res.status(500).json({ success: false, message: 'AI总结失败' });
  }
});

// 删除面试
router.delete('/:id', auth, authorize('super_admin'), async (req, res) => {
  try {
    await Interview.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
