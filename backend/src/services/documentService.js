const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;
const path = require('path');

/**
 * 从 PDF 提取文本
 */
async function extractTextFromPDF(filePath) {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

/**
 * 从 DOCX 提取文本
 */
async function extractTextFromDocx(filePath) {
  const dataBuffer = await fs.readFile(filePath);
  const result = await mammoth.extractRawText({ buffer: dataBuffer });
  return result.value;
}

/**
 * 从图片提取文本 (OCR) - 使用系统工具
 */
async function extractTextFromImage(filePath) {
  // macOS/Linux 使用 tesseract，Windows 可能需要其他方案
  // 这里返回文件路径，让上层决定如何处理
  return `图片文件: ${filePath}`;
}

/**
 * 提取文件文本内容
 */
async function extractText(filePath) {
  // 获取文件扩展名
  const ext = path.extname(filePath).toLowerCase();

  // 如果扩展名为空，尝试从原始文件名获取
  if (!ext) {
    const basename = path.basename(filePath, path.extname(filePath));
    const match = basename.match(/\.(pdf|doc|docx|jpg|jpeg|png|bmp|tiff|txt)$/i);
    if (match) {
      // 重新尝试
    }
  }

  try {
    if (ext === '.pdf') {
      return await extractTextFromPDF(filePath);
    } else if (ext === '.docx' || ext === '.doc') {
      return await extractTextFromDocx(filePath);
    } else if (['.jpg', '.jpeg', '.png', '.bmp', '.tiff'].includes(ext)) {
      return await extractTextFromImage(filePath);
    } else if (ext === '.txt') {
      return await fs.readFile(filePath, 'utf-8');
    } else {
      // 尝试读取文件内容作为文本
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        return content;
      } catch {
        throw new Error(`不支持的文件类型: ${ext || '(未知)'}`);
      }
    }
  } catch (error) {
    console.error('文本提取失败:', error.message);
    throw error;
  }
}

module.exports = { extractText, extractTextFromPDF, extractTextFromDocx, extractTextFromImage };
