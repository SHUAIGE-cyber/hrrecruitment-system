const mongoose = require('mongoose');

// ========== 用户模型 ==========
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'hr', 'interviewer'], default: 'hr' },
  department: { type: String },
  realName: { type: String },
  email: { type: String },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// ========== 岗位模型 ==========
const positionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  headcount: { type: Number, default: 1, min: 1 },
  location: { type: String, required: true },
  jd: { type: String, required: true },
  requirements: { type: String, required: true },
  salaryMin: { type: Number },
  salaryMax: { type: Number },
  salaryCurrency: { type: String, default: 'CNY' },
  status: { type: String, enum: ['open', 'paused', 'filled', 'closed'], default: 'open' },
  publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  filledCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// ========== 候选人模型 ==========
const candidateSchema = new mongoose.Schema({
  // 基本信息
  name: { type: String, required: true },
  gender: { type: String, enum: ['男', '女', '其他'] },
  age: { type: Number },
  phone: { type: String, required: true },
  email: { type: String },
  location: { type: String },
  education: { type: String },
  university: { type: String },
  major: { type: String },
  workExperience: { type: Number },
  currentSalary: { type: Number },
  expectedSalary: { type: Number },
  noticePeriod: { type: String },
  wechat: { type: String },

  // AI 解析结果
  resumeText: { type: String },
  aiTags: [{ type: String }],
  aiParsed: { type: Boolean, default: false },
  aiProfile: { type: mongoose.Schema.Types.Mixed },

  // 关联岗位
  appliedPositions: [{
    positionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Position' },
    appliedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'interview', 'offer', 'hired', 'rejected'], default: 'pending' }
  }],

  // 当前面试阶段
  currentStage: {
    type: String,
    enum: ['resume_screen', 'interview_1', 'interview_2', 'interview_3', 'offer', 'onboard', 'rejected'],
    default: 'resume_screen'
  },

  // 简历文件
  resumeFile: { type: String }, // 文件路径
  resumeFileName: { type: String },

  // 匹配度
  matchScore: { type: Number, min: 0, max: 100 },
  matchReason: { type: String },

  // 面试评价汇总
  overallEvaluation: { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// ========== 面试记录模型 ==========
const interviewSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  positionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Position' },
  stage: { type: String, enum: ['resume_screen', 'interview_1', 'interview_2', 'interview_3', 'offer', 'onboard', 'rejected'] },
  interviewer: { type: String },
  interviewDate: { type: Date },
  interviewDuration: { type: Number }, // 分钟
  score: { type: Number, min: 0, max: 100 },
  evaluation: { type: String },
  generatedQuestions: [String], // AI 生成的面试题
  aiSummary: { type: String }, // AI 面试总结
  reason: { type: String }, // 淘汰原因
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// ========== Offer 模型 ==========
const offerSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  positionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Position' },
  salary: { type: Number },
  bonus: { type: Number },
  stock: { type: String },
  startDate: { type: Date },
  title: { type: String },
  department: { type: String },
  reportTo: { type: String },
  benefits: [String],
  status: { type: String, enum: ['draft', 'pending_approval', 'approved', 'sent', 'accepted', 'rejected', 'expired'], default: 'draft' },
  approvalFlow: [{
    approver: { type: String },
    role: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'] },
    comment: { type: String },
    approvedAt: { type: Date }
  }],
  offerFile: { type: String },
  offerFileName: { type: String },
  expireDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// ========== 证书模型 ==========
const certificateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  issuer: { type: String },
  issueDate: { type: Date },
  expireDate: { type: Date },
  certificateNo: { type: String },
  status: { type: String, enum: ['valid', 'expiring_soon', 'expired', 'unknown'], default: 'unknown' },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  file: { type: String },
  fileName: { type: String },
  aiExtracted: { type: Boolean, default: false },
  aiData: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// ========== 系统设置模型 ==========
const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed },
  description: { type: String },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// 索引
candidateSchema.index({ name: 'text', resumeText: 'text', aiTags: 'text' });
candidateSchema.index({ currentStage: 1, createdAt: -1 });
positionSchema.index({ status: 1, department: 1 });
interviewSchema.index({ candidateId: 1, stage: 1 });
offerSchema.index({ candidateId: 1, status: 1 });
certificateSchema.index({ candidateId: 1 });

module.exports = {
  User: mongoose.model('User', userSchema),
  Position: mongoose.model('Position', positionSchema),
  Candidate: mongoose.model('Candidate', candidateSchema),
  Interview: mongoose.model('Interview', interviewSchema),
  Offer: mongoose.model('Offer', offerSchema),
  Certificate: mongoose.model('Certificate', certificateSchema),
  Setting: mongoose.model('Setting', settingSchema)
};
