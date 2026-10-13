const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { Candidate, Position, Interview } = require('../models');
const { auth, authorize, deny, maskPhone } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { parseResume, matchJDAndResume, generateInterviewQuestions } = require('../services/aiService');
const { extractText } = require('../services/documentService');

router.use(maskPhone);
router.use(auth, deny('dept_manager'));

// 获取候选人列表
router.get('/', auth, async (req, res) => {
  try {
    const { search, stage, department, tags, page = 1, pageSize = 20 } = req.query;
    const filter = {};

    if (search) {
      filter.$text = { $search: search };
    }
    if (stage) {
      filter.currentStage = stage;
    }
    if (department) {
      filter['appliedPositions.department'] = department;
    }
    if (tags) {
      filter.aiTags = { $in: tags.split(',') };
    }

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const [candidates, total] = await Promise.all([
      Candidate.find(filter)
        .populate('appliedPositions.positionId', 'name department')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(pageSize)),
      Candidate.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: candidates,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / parseInt(pageSize))
    });
  } catch (error) {
    console.error('获取候选人列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取单个候选人
router.get('/:id', auth, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate('appliedPositions.positionId', 'name department jd requirements')
      .populate('resumeFile');

    if (!candidate) {
      return res.status(404).json({ success: false, message: '候选人不存在' });
    }

    // 获取该候选人的面试记录
    const interviews = await Interview.find({ candidateId: req.params.id })
      .populate('positionId', 'name department')
      .sort({ createdAt: -1 });

    candidate.interviews = interviews;
    res.json({ success: true, data: candidate });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 创建候选人 (手动录入)
router.post('/', auth, authorize('super_admin', 'hr'), async (req, res) => {
  try {
    const candidate = await Candidate.create(req.body);
    res.json({ success: true, data: candidate });
  } catch (error) {
    console.error('创建候选人错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 上传简历并解析
router.post('/upload', auth, authorize('super_admin', 'hr'), upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请上传简历文件' });
    }

    // 提取文本
    const text = await extractText(req.file.path);

    // AI 解析简历
    const parsedData = await parseResume(text);

    // 创建候选人记录
    const candidate = await Candidate.create({
      name: parsedData.name || req.body.name || '未知',
      gender: parsedData.gender,
      age: parsedData.age,
      phone: parsedData.phone || req.body.phone,
      email: parsedData.email || req.body.email,
      location: parsedData.location,
      education: parsedData.education,
      university: parsedData.university,
      major: parsedData.major,
      workExperience: parsedData.workExperience,
      currentSalary: parsedData.currentSalary,
      expectedSalary: parsedData.expectedSalary,
      noticePeriod: parsedData.noticePeriod,
      wechat: parsedData.wechat,
      resumeText: text,
      aiTags: parsedData.tags || parsedData.skills || [],
      aiParsed: true,
      aiProfile: parsedData,
      resumeFile: `resumes/${req.file.filename}`,
      resumeFileName: req.file.originalname
    });

    res.json({
      success: true,
      data: candidate,
      message: '简历解析成功'
    });
  } catch (error) {
    console.error('简历上传解析错误:', error);
    res.status(500).json({ success: false, message: '简历处理失败: ' + error.message });
  }
});

// 更新候选人
router.put('/:id', auth, authorize('super_admin', 'hr'), async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!candidate) {
      return res.status(404).json({ success: false, message: '候选人不存在' });
    }
    res.json({ success: true, data: candidate });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// JD 匹配评分
router.post('/:id/match/:positionId', auth, authorize('super_admin', 'hr'), async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    const position = await Position.findById(req.params.positionId);

    if (!candidate || !position) {
      return res.status(404).json({ success: false, message: '候选人或岗位不存在' });
    }

    const result = await matchJDAndResume(position, position.requirements, candidate.resumeText, position.matchCriteria);

    // 更新匹配度
    candidate.matchScore = result.score;
    candidate.matchReason = result.matchReason;
    await candidate.save();

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('匹配评分错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 生成面试题
router.post('/:id/interview-questions/:positionId', auth, authorize('super_admin', 'hr'), async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    const position = await Position.findById(req.params.positionId);

    if (!candidate || !position) {
      return res.status(404).json({ success: false, message: '候选人或岗位不存在' });
    }

    const stage = req.body.stage || 'interview_1';
    const questions = await generateInterviewQuestions(position, candidate.resumeText, stage);

    res.json({ success: true, data: questions });
  } catch (error) {
    console.error('生成面试题错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 删除候选人
router.delete('/:id', auth, authorize('super_admin'), async (req, res) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 搜索候选人 (全文检索)
router.get('/search/:keyword', auth, async (req, res) => {
  try {
    const candidates = await Candidate.find({ $text: { $search: req.params.keyword } })
      .select('name phone email education currentStage matchScore aiTags')
      .limit(20);
    res.json({ success: true, data: candidates });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
