const express = require('express');
const router = express.Router();
const { Candidate, Position, Interview, Offer } = require('../models');
const { auth } = require('../middleware/auth');
const ExcelJS = require('exceljs');

// 获取仪表盘数据
router.get('/dashboard', auth, async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // 基础统计
    const [totalCandidates, totalPositions, totalInterviews, totalOffers] = await Promise.all([
      Candidate.countDocuments(),
      Position.countDocuments({ status: 'open' }),
      Interview.countDocuments(),
      Offer.countDocuments({ status: 'approved' })
    ]);

    // 招聘漏斗
    const funnel = await Candidate.aggregate([
      {
        $group: {
          _id: '$currentStage',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // 本月新增候选人
    const newCandidates = await Candidate.countDocuments({
      createdAt: { $gte: monthStart }
    });

    // 本月面试
    const monthInterviews = await Interview.countDocuments({
      interviewDate: { $gte: monthStart }
    });

    // 各部门岗位统计
    const deptStats = await Position.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 }, open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } } } },
      { $sort: { count: -1 } }
    ]);

    // 候选人趋势 (最近7天)
    const candidateTrend = await Candidate.aggregate([
      {
        $match: {
          createdAt: { $gte: monthAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 面试趋势
    const interviewTrend = await Interview.aggregate([
      {
        $match: {
          interviewDate: { $gte: monthAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$interviewDate' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 最近面试记录
    const recentInterviews = await Interview.find({})
      .populate('candidateId', 'name')
      .populate('positionId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        stats: { totalCandidates, totalPositions, totalInterviews, totalOffers, newCandidates, monthInterviews },
        funnel,
        deptStats,
        candidateTrend,
        interviewTrend,
        recentInterviews
      }
    });
  } catch (error) {
    console.error('仪表盘数据错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 导出 Excel
router.get('/export', auth, async (req, res) => {
  try {
    const { type } = req.query;
    const workbook = new ExcelJS.Workbook();
    let worksheet;

    if (type === 'candidates') {
      const candidates = await Candidate.find()
        .populate('appliedPositions.positionId', 'name department')
        .sort({ createdAt: -1 });

      worksheet = workbook.addWorksheet('候选人');
      worksheet.columns = [
        { header: '姓名', key: 'name', width: 15 },
        { header: '电话', key: 'phone', width: 15 },
        { header: '邮箱', key: 'email', width: 25 },
        { header: '学历', key: 'education', width: 15 },
        { header: '学校', key: 'university', width: 20 },
        { header: '工作经验', key: 'workExperience', width: 12 },
        { header: '当前阶段', key: 'currentStage', width: 15 },
        { header: '匹配度', key: 'matchScore', width: 10 },
        { header: '申请岗位', key: 'positions', width: 30 },
        { header: '创建时间', key: 'createdAt', width: 20 }
      ];

      candidates.forEach(c => {
        worksheet.addRow({
          name: c.name,
          phone: c.phone,
          email: c.email,
          education: c.education,
          university: c.university,
          workExperience: c.workExperience,
          currentStage: c.currentStage,
          matchScore: c.matchScore,
          positions: c.appliedPositions.map(p => p.positionId?.name).join(', '),
          createdAt: c.createdAt?.toLocaleString('zh-CN')
        });
      });
    } else if (type === 'positions') {
      const positions = await Position.find().sort({ createdAt: -1 });

      worksheet = workbook.addWorksheet('岗位');
      worksheet.columns = [
        { header: '岗位名', key: 'name', width: 20 },
        { header: '部门', key: 'department', width: 15 },
        { header: '地点', key: 'location', width: 15 },
        { header: '招聘人数', key: 'headcount', width: 10 },
        { header: '已招人数', key: 'filledCount', width: 10 },
        { header: '薪资范围', key: 'salaryRange', width: 20 },
        { header: '状态', key: 'status', width: 10 },
        { header: '创建时间', key: 'createdAt', width: 20 }
      ];

      positions.forEach(p => {
        worksheet.addRow({
          name: p.name,
          department: p.department,
          location: p.location,
          headcount: p.headcount,
          filledCount: p.filledCount,
          salaryRange: `${p.salaryMin || 0}-${p.salaryMax || 0}`,
          status: p.status,
          createdAt: p.createdAt?.toLocaleString('zh-CN')
        });
      });
    } else if (type === 'interviews') {
      const interviews = await Interview.find()
        .populate('candidateId', 'name')
        .populate('positionId', 'name')
        .sort({ createdAt: -1 });

      worksheet = workbook.addWorksheet('面试记录');
      worksheet.columns = [
        { header: '候选人', key: 'candidate', width: 15 },
        { header: '岗位', key: 'position', width: 20 },
        { header: '阶段', key: 'stage', width: 15 },
        { header: '面试官', key: 'interviewer', width: 15 },
        { header: '面试时间', key: 'interviewDate', width: 20 },
        { header: '评分', key: 'score', width: 10 },
        { header: '状态', key: 'status', width: 12 },
        { header: '评价', key: 'evaluation', width: 40 }
      ];

      interviews.forEach(i => {
        worksheet.addRow({
          candidate: i.candidateId?.name,
          position: i.positionId?.name,
          stage: i.stage,
          interviewer: i.interviewer,
          interviewDate: i.interviewDate?.toLocaleString('zh-CN'),
          score: i.score,
          status: i.status,
          evaluation: i.evaluation
        });
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=export_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('导出错误:', error);
    res.status(500).json({ success: false, message: '导出失败' });
  }
});

module.exports = router;
