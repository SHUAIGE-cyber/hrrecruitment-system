const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const util = require('util');

const execFileAsync = util.promisify(execFile);

const OCR_SCRIPT = path.join(__dirname, '../../scripts/ocr.swift');
const OCR_BINARY = path.join(__dirname, '../../scripts/ocr');

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
 * 从图片提取文本 (OCR) - 使用 macOS Vision Framework
 */
async function extractTextFromImage(filePath) {
  try {
    // 优先使用预编译的二进制（快），否则用 swift 解释执行
    let bin = OCR_BINARY;
    if (!fsSync.existsSync(bin)) {
      // 尝试编译一次
      try {
        await execFileAsync('swiftc', [OCR_SCRIPT, '-o', OCR_BINARY], { timeout: 120000 });
      } catch (e) {
        // 编译失败就用 swift 直接运行（慢但能用）
        bin = 'swift';
      }
    }

    const args = bin === 'swift' ? [OCR_SCRIPT, filePath] : [filePath];
    const { stdout } = await execFileAsync(bin, args, {
      timeout: 90000,
      maxBuffer: 10 * 1024 * 1024
    });

    const text = stdout.trim();
    if (!text) {
      console.warn('OCR未识别到文本:', filePath);
      return `[图片OCR未识别到文字] 文件: ${path.basename(filePath)}`;
    }
    console.log(`OCR识别成功: ${text.length} 字符`);
    return text;
  } catch (error) {
    console.error('OCR失败:', error.message);
    return `[图片OCR失败] 文件: ${path.basename(filePath)}`;
  }
}

/**
 * 检测文件真实类型（根据文件头magic number）
 */
function detectFileType(filePath) {
  try {
    const buffer = Buffer.alloc(8);
    const fd = fsSync.openSync(filePath, 'r');
    fsSync.readSync(fd, buffer, 0, 8, 0);
    fsSync.closeSync(fd);

    // PDF: %PDF
    if (buffer.slice(0, 4).toString() === '%PDF') return '.pdf';
    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return '.png';
    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return '.jpg';
    // DOCX/XLSX (ZIP): PK
    if (buffer[0] === 0x50 && buffer[1] === 0x4B) return '.docx';
    // DOC (OLE2): D0 CF 11 E0
    if (buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0) return '.doc';
  } catch (e) {
    // ignore
  }
  return null;
}

/**
 * 提取文件文本内容
 */
async function extractText(filePath) {
  let ext = path.extname(filePath).toLowerCase();

  // 如果没有扩展名，通过文件内容检测真实类型
  if (!ext) {
    const detected = detectFileType(filePath);
    if (detected) {
      ext = detected;
      console.log(`文件类型检测: ${path.basename(filePath)} -> ${detected}`);
    }
  }

  try {
    if (ext === '.pdf') {
      return await extractTextFromPDF(filePath);
    } else if (ext === '.docx' || ext === '.doc') {
      return await extractTextFromDocx(filePath);
    } else if (['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'].includes(ext)) {
      return await extractTextFromImage(filePath);
    } else if (ext === '.txt') {
      return await fs.readFile(filePath, 'utf-8');
    } else {
      // 尝试按文本读取
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

module.exports = { extractText, extractTextFromPDF, extractTextFromDocx, extractTextFromImage, detectFileType };
