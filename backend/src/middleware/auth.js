const jwt = require('jsonwebtoken');
const { User } = require('../models');

// JWT 认证中间件
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: '未授权访问' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ success: false, message: '用户不存在或已禁用' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: '令牌无效或已过期' });
  }
};

// 角色权限中间件
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: '权限不足' });
    }
    next();
  };
};

// 排除指定角色（如：部门主管只能访问招聘需求，其他模块禁止）
const deny = (...roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: '权限不足，该模块仅限HR/管理员使用' });
    }
    next();
  };
};

// 面试经理看不到手机号
const maskPhone = async (req, res, next) => {
  const originalSend = res.json;
  res.json = function (body) {
    if (req.user.role === 'interviewer' && body?.data) {
      const maskField = (data) => {
        if (Array.isArray(data)) {
          data.forEach(item => maskField(item));
        } else if (data && typeof data === 'object') {
          // 候选人脱敏
          if (data.phone) {
            data.phone = data.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
          }
          if (data.wechat) {
            data.wechat = '****';
          }
          Object.values(data).forEach(v => maskField(v));
        }
      };
      maskField(body.data);
    }
    return originalSend.call(this, body);
  };
  next();
};

module.exports = { auth, authorize, deny, maskPhone };
