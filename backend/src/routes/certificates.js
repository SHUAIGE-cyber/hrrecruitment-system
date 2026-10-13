const express = require('express');
const router = express.Router();
const { Certificate, Candidate } = require('../models');
const { auth, authorize, deny, maskPhone } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { extractCertificateInfo } = require('../services/aiService');
const { extractText } = require('../services/documentService');

router.use(maskPhone);
router.use(auth, deny('dept_manager'));

// 获取证书列表
router.get('/', auth, async (req, res) => {
  try {
    const { candidateId, type, status, page = 1, pageSize = 20 } = req.query;
    const filter = {};
    if (candidateId) filter.candidateId = candidateId;
    if (type) filter.type = type;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const [certificates, total] = await Promise.all([
      Certificate.find(filter)
        .populate('candidateId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(pageSize)),
      Certificate.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: certificates,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (error) {
    console.error('获取证书列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 上传证书并解析
router.post('/', auth, authorize('super_admin', 'hr'), upload.single('certificate'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请上传证书文件' });
    }

    // 提取文本
    const text = await extractText(req.file.path);

    // AI 提取证书信息
    const extractedData = await extractCertificateInfo(text);

    const certificate = await Certificate.create({
      name: req.body.name || extractedData.certificateName || '未知证书',
      type: req.body.type || extractedData.type || '其他',
      issuer: extractedData.issuer,
      issueDate: extractedData.issueDate ? new Date(extractedData.issueDate) : undefined,
      expireDate: extractedData.expireDate ? new Date(extractedData.expireDate) : undefined,
      certificateNo: extractedData.certificateNo,
      status: extractedData.status || 'unknown',
      candidateId: req.body.candidateId,
      file: req.file.path.replace('uploads/', ''),
      fileName: req.file.originalname,
      aiExtracted: true,
      aiData: extractedData
    });

    res.json({ success: true, data: certificate });
  } catch (error) {
    console.error('上传证书错误:', error);
    res.status(500).json({ success: false, message: '证书处理失败: ' + error.message });
  }
});

// 更新证书
router.put('/:id', auth, authorize('super_admin', 'hr'), async (req, res) => {
  try {
    const certificate = await Certificate.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!certificate) {
      return res.status(404).json({ success: false, message: '证书不存在' });
    }
    res.json({ success: true, data: certificate });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 删除证书
router.delete('/:id', auth, authorize('super_admin'), async (req, res) => {
  try {
    await Certificate.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
