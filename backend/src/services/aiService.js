const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');

// 获取配置
const API_PROVIDER = process.env.AI_PROVIDER || 'anthropic';
const API_KEY = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const API_MODEL = process.env.AI_MODEL || 'claude-sonnet-4-20250514';
const API_BASE_URL = process.env.AI_BASE_URL || '';

let anthropicClient = null;
let openaiClient = null;

function getAnthropicClient() {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: API_KEY });
  }
  return anthropicClient;
}

function getOpenAIClient() {
  if (!openaiClient) {
    const config = { apiKey: API_KEY };
    if (API_BASE_URL) config.baseURL = API_BASE_URL;
    openaiClient = new OpenAI(config);
  }
  return openaiClient;
}

/**
 * 调用 AI API（统一入口）
 */
async function callAI(prompt, systemPrompt = '', maxTokens = 2000) {
  try {
    let result = '';

    if (API_PROVIDER === 'anthropic' || !API_KEY) {
      const client = getAnthropicClient();
      const response = await client.messages.create({
        model: API_MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      });
      result = response.content[0].text;
    } else {
      const client = getOpenAIClient();
      const messages = [];
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
      messages.push({ role: 'user', content: prompt });

      const response = await client.chat.completions.create({
        model: API_MODEL,
        max_tokens: maxTokens,
        messages: messages
      });
      result = response.choices[0].message.content;
    }

    return result;
  } catch (error) {
    console.error('AI API error:', error.message);
    throw error;
  }
}

/**
 * 简历解析
 */
async function parseResume(resumeText) {
  const systemPrompt = '你是一位专业的HR助手，擅长从简历中提取结构化信息。请严格按照JSON格式输出，不要包含任何额外的解释文字。';

  const prompt = `请从以下简历文本中提取结构化信息：

${resumeText}

请以JSON格式输出，包含以下字段：
{
  "name": "姓名",
  "gender": "性别",
  "age": 年龄或null,
  "phone": "手机号",
  "email": "邮箱",
  "location": "所在城市",
  "education": "最高学历",
  "university": "毕业院校",
  "major": "专业",
  "workExperience": 工作年限数字,
  "currentSalary": 当前薪资或null,
  "expectedSalary": 期望薪资或null,
  "noticePeriod": "离职/交接期",
  "skills": ["技能列表"],
  "tags": ["AI自动打标签"]
}`;

  const result = await callAI(prompt, systemPrompt, 3000);

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : result;
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('简历解析JSON解析失败:', e.message);
    return { name: '未知', tags: ['解析失败'], skills: [] };
  }
}

/**
 * JD 与简历匹配评分（支持自定义评分标准）
 */
async function matchJDAndResume(jd, requirements, resumeText, matchCriteria = null) {
  const criteriaDesc = matchCriteria
    ? `\n【评分标准（HR自定义）】
最低学历: ${matchCriteria.minEducation || '不限'}
最低工作年限: ${matchCriteria.minExperience ?? '不限'}年
年龄范围: ${matchCriteria.minAge || 18}-${matchCriteria.maxAge || 65}岁
必备技能: ${(matchCriteria.requiredSkills || []).join(', ') || '无'}
优先技能: ${(matchCriteria.preferredSkills || []).join(', ') || '无'}`
    : '';

  const prompt = `请分析以下职位描述(JD)和候选人简历的匹配度，给出0-100的匹配分数和详细匹配理由。

【职位描述】
岗位名称: ${jd.name}
部门: ${jd.department}
工作地点: ${jd.location}
薪资范围: ${jd.salaryMin || '?'}-${jd.salaryMax || '?'}
职位描述: ${jd.jd}
任职要求: ${requirements || jd.requirements}
${criteriaDesc}

【候选人简历】
${resumeText || '暂无简历文本'}

请严格按照JSON格式输出：
{
  "score": 匹配分数(0-100的整数),
  "matchReason": "详细匹配理由，包括逐项分析学历/经验/技能/年龄等维度的匹配情况",
  "strengths": ["匹配优势点"],
  "gaps": ["不足/差距点"],
  "dimensions": {
    "education": {"score": 单项分0-100, "comment": "评价"},
    "experience": {"score": 单项分0-100, "comment": "评价"},
    "skills": {"score": 单项分0-100, "comment": "评价"},
    "age": {"score": 单项分0-100, "comment": "评价"}
  }
}`;

  const result = await callAI(prompt, '你是一位资深招聘专家，擅长JD与简历匹配分析。', 2000);

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : result;
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('匹配评分JSON解析失败:', e.message);
    return { score: 0, matchReason: result, strengths: [], gaps: [], dimensions: {} };
  }
}

/**
 * 自动生成面试题
 */
async function generateInterviewQuestions(jd, resumeText, stage) {
  const stageNames = {
    resume_screen: '简历初筛',
    interview_1: '一面',
    interview_2: '二面',
    interview_3: '终面',
    offer: 'Offer洽谈'
  };

  const prompt = `根据以下职位描述和候选人简历，为${stageNames[stage] || stage}面试生成5-8个针对性问题。

【职位描述】
岗位: ${jd.name}
职责: ${jd.jd}
要求: ${jd.requirements}

【候选人简历摘要】
${resumeText || '暂无简历信息'}

请以JSON数组格式输出，每个问题包含：
[
  {
    "question": "问题内容",
    "type": "行为面试/技术面试/经验考察/情景假设",
    "focus": "考察要点",
    "difficulty": "简单/中等/困难"
  }
]`;

  const result = await callAI(prompt, '你是一位经验丰富的面试官，擅长设计针对性的面试问题。', 2000);

  try {
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : result;
    return JSON.parse(jsonStr);
  } catch (e) {
    return [{ question: result, type: '开放题', focus: '综合', difficulty: '中等' }];
  }
}

/**
 * 面试手记自动总结
 */
async function summarizeInterview(interviewNotes, stage, position) {
  const stageNames = {
    resume_screen: '简历初筛',
    interview_1: '一面',
    interview_2: '二面',
    interview_3: '终面',
    offer: 'Offer洽谈'
  };

  const prompt = `请将以下面试记录整理成专业的面试评价摘要。

【面试信息】
阶段: ${stageNames[stage] || stage}
岗位: ${position?.name || position}
面试官: ${interviewNotes.interviewer || '未指定'}
评分: ${interviewNotes.score || '未评分'}/100

【面试记录】
${interviewNotes.evaluation || interviewNotes.notes || '无详细记录'}

请输出结构化的面试评价，包含：
1. 整体评价（200字以内）
2. 优势
3. 不足
4. 建议（录用/淘汰/进入下一轮）`;

  return await callAI(prompt, '你是一位专业的HR面试官，擅长撰写面试评价。请输出简洁专业的中文评价。', 1500);
}

/**
 * 证书文档识别
 */
async function extractCertificateInfo(text) {
  const prompt = `请从以下证书文本中提取关键信息。

${text}

请以JSON格式输出：
{
  "certificateName": "证书名称",
  "issuer": "发证机构",
  "issueDate": "发证日期",
  "expireDate": "到期日期或null",
  "certificateNo": "证书编号",
  "holderName": "持证人姓名",
  "status": "valid/expiring_soon/expired/unknown"
}`;

  const result = await callAI(prompt, '你是一位专业的文档识别助手，擅长从证书中提取结构化信息。', 1500);

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : result;
    return JSON.parse(jsonStr);
  } catch (e) {
    return { certificateName: text.substring(0, 100), status: 'unknown' };
  }
}

module.exports = {
  callAI,
  parseResume,
  matchJDAndResume,
  generateInterviewQuestions,
  summarizeInterview,
  extractCertificateInfo
};
