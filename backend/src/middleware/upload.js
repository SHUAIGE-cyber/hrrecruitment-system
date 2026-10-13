const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = process.env.UPLOAD_PATH || './uploads';

// 确保上传目录存在
const uploadDirs = [
  uploadDir,
  `${uploadDir}/resumes`,
  `${uploadDir}/offers`,
  `${uploadDir}/certificates`,
  `${uploadDir}/avatars`
];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subdir = 'files';
    if (file.fieldname === 'resume') subdir = 'resumes';
    else if (file.fieldname === 'offer') subdir = 'offers';
    else if (file.fieldname === 'certificate') subdir = 'certificates';
    else if (file.fieldname === 'avatar') subdir = 'avatars';
    cb(null, `${uploadDir}/${subdir}`);
  },
  filename: (req, file, cb) => {
    // 修复中文文件名乱码（multer默认按latin1解码，中文会变乱码）
    try {
      file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    } catch (e) {
      // 保持原样
    }
    // 生成唯一文件名，保留原始扩展名
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // 修复中文文件名乱码
  try {
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
  } catch (e) {}
  const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.txt', '.bmp', '.tiff'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${ext}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 }
});

module.exports = upload;
