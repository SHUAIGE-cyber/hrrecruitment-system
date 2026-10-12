{
  "name": "recruitment-system",
  "version": "1.0.0",
  "description": "招聘管理后台系统 - 数据库表结构设计",
  "database": "MongoDB",
  "tables": [
    {
      "name": "users",
      "description": "用户表",
      "fields": [
        { "name": "username", "type": "String", "required": true, "unique": true, "description": "用户名" },
        { "name": "password", "type": "String", "required": true, "description": "密码(BCrypt加密)" },
        { "name": "role", "type": "String", "enum": ["super_admin", "hr", "interviewer"], "default": "hr", "description": "角色" },
        { "name": "realName", "type": "String", "description": "真实姓名" },
        { "name": "department", "type": "String", "description": "所属部门" },
        { "name": "email", "type": "String", "description": "邮箱" },
        { "name": "phone", "type": "String", "description": "电话" },
        { "name": "isActive", "type": "Boolean", "default": true, "description": "是否启用" },
        { "name": "createdAt", "type": "Date", "description": "创建时间" }
      ]
    },
    {
      "name": "positions",
      "description": "岗位表",
      "fields": [
        { "name": "name", "type": "String", "required": true, "description": "岗位名称" },
        { "name": "department", "type": "String", "required": true, "description": "所属部门" },
        { "name": "headcount", "type": "Number", "default": 1, "description": "招聘人数" },
        { "name": "location", "type": "String", "required": true, "description": "工作地点" },
        { "name": "jd", "type": "String", "required": true, "description": "职位描述" },
        { "name": "requirements", "type": "String", "required": true, "description": "任职要求" },
        { "name": "salaryMin", "type": "Number", "description": "最低薪资" },
        { "name": "salaryMax", "type": "Number", "description": "最高薪资" },
        { "name": "status", "type": "String", "enum": ["open", "paused", "filled", "closed"], "default": "open", "description": "状态" },
        { "name": "filledCount", "type": "Number", "default": 0, "description": "已招人数" },
        { "name": "publishedBy", "type": "ObjectId(ref: User)", "description": "发布人" },
        { "name": "createdAt", "type": "Date", "description": "创建时间" },
        { "name": "updatedAt", "type": "Date", "description": "更新时间" }
      ]
    },
    {
      "name": "candidates",
      "description": "候选人表",
      "fields": [
        { "name": "name", "type": "String", "required": true, "description": "姓名" },
        { "name": "gender", "type": "String", "enum": ["男", "女", "其他"], "description": "性别" },
        { "name": "age", "type": "Number", "description": "年龄" },
        { "name": "phone", "type": "String", "required": true, "description": "电话" },
        { "name": "email", "type": "String", "description": "邮箱" },
        { "name": "location", "type": "String", "description": "所在城市" },
        { "name": "education", "type": "String", "description": "最高学历" },
        { "name": "university", "type": "String", "description": "毕业院校" },
        { "name": "major", "type": "String", "description": "专业" },
        { "name": "workExperience", "type": "Number", "description": "工作年限" },
        { "name": "currentSalary", "type": "Number", "description": "当前薪资" },
        { "name": "expectedSalary", "type": "Number", "description": "期望薪资" },
        { "name": "noticePeriod", "type": "String", "description": "离职/交接期" },
        { "name": "wechat", "type": "String", "description": "微信" },
        { "name": "resumeText", "type": "String", "description": "简历原文(用于检索)" },
        { "name": "aiTags", "type": "Array<String>", "description": "AI标签" },
        { "name": "aiParsed", "type": "Boolean", "default": false, "description": "是否已AI解析" },
        { "name": "aiProfile", "type": "Mixed", "description": "AI解析的完整信息" },
        { "name": "appliedPositions", "type": "Array<Object>", "description": "申请的岗位列表" },
        { "name": "currentStage", "type": "String", "enum": ["resume_screen", "interview_1", "interview_2", "interview_3", "offer", "onboard", "rejected"], "default": "resume_screen", "description": "当前面试阶段" },
        { "name": "resumeFile", "type": "String", "description": "简历文件路径" },
        { "name": "resumeFileName", "type": "String", "description": "简历文件名" },
        { "name": "matchScore", "type": "Number", "min": 0, "max": 100, "description": "JD匹配度" },
        { "name": "matchReason", "type": "String", "description": "匹配理由" },
        { "name": "overallEvaluation", "type": "String", "description": "面试评价汇总" },
        { "name": "createdAt", "type": "Date", "description": "创建时间" },
        { "name": "updatedAt", "type": "Date", "description": "更新时间" }
      ],
      "indexes": [
        { "fields": ["name", "resumeText", "aiTags"], "type": "text", "description": "全文检索索引" },
        { "fields": ["currentStage", "createdAt"], "type": "compound", "description": "阶段+时间索引" }
      ]
    },
    {
      "name": "interviews",
      "description": "面试记录表",
      "fields": [
        { "name": "candidateId", "type": "ObjectId(ref: Candidate)", "required": true, "description": "候选人ID" },
        { "name": "positionId", "type": "ObjectId(ref: Position)", "description": "岗位ID" },
        { "name": "stage", "type": "String", "enum": ["resume_screen", "interview_1", "interview_2", "interview_3", "offer", "onboard", "rejected"], "description": "面试阶段" },
        { "name": "interviewer", "type": "String", "description": "面试官" },
        { "name": "interviewDate", "type": "Date", "description": "面试时间" },
        { "name": "interviewDuration", "type": "Number", "description": "面试时长(分钟)" },
        { "name": "score", "type": "Number", "min": 0, "max": 100, "description": "评分" },
        { "name": "evaluation", "type": "String", "description": "面试评价" },
        { "name": "generatedQuestions", "type": "Array<String>", "description": "AI生成的面试题" },
        { "name": "aiSummary", "type": "String", "description": "AI面试总结" },
        { "name": "reason", "type": "String", "description": "淘汰原因" },
        { "name": "status", "type": "String", "enum": ["scheduled", "completed", "cancelled"], "default": "scheduled", "description": "面试状态" },
        { "name": "notes", "type": "String", "description": "备注" },
        { "name": "createdAt", "type": "Date", "description": "创建时间" },
        { "name": "updatedAt", "type": "Date", "description": "更新时间" }
      ]
    },
    {
      "name": "offers",
      "description": "Offer表",
      "fields": [
        { "name": "candidateId", "type": "ObjectId(ref: Candidate)", "required": true, "description": "候选人ID" },
        { "name": "positionId", "type": "ObjectId(ref: Position)", "description": "岗位ID" },
        { "name": "salary", "type": "Number", "description": "薪资" },
        { "name": "bonus", "type": "Number", "description": "奖金" },
        { "name": "stock", "type": "String", "description": "股票/期权" },
        { "name": "startDate", "type": "Date", "description": "入职日期" },
        { "name": "title", "type": "String", "description": "职位头衔" },
        { "name": "department", "type": "String", "description": "所属部门" },
        { "name": "reportTo", "type": "String", "description": "汇报对象" },
        { "name": "benefits", "type": "Array<String>", "description": "福利列表" },
        { "name": "status", "type": "String", "enum": ["draft", "pending_approval", "approved", "sent", "accepted", "rejected", "expired"], "default": "draft", "description": "状态" },
        { "name": "approvalFlow", "type": "Array<Object>", "description": "审批流程" },
        { "name": "offerFile", "type": "String", "description": "Offer文件路径" },
        { "name": "offerFileName", "type": "String", "description": "Offer文件名" },
        { "name": "expireDate", "type": "Date", "description": "有效期" },
        { "name": "createdAt", "type": "Date", "description": "创建时间" },
        { "name": "updatedAt", "type": "Date", "description": "更新时间" }
      ]
    },
    {
      "name": "certificates",
      "description": "证书表",
      "fields": [
        { "name": "name", "type": "String", "required": true, "description": "证书名称" },
        { "name": "type", "type": "String", "required": true, "description": "证书类型" },
        { "name": "issuer", "type": "String", "description": "发证机构" },
        { "name": "issueDate", "type": "Date", "description": "发证日期" },
        { "name": "expireDate", "type": "Date", "description": "到期日期" },
        { "name": "certificateNo", "type": "String", "description": "证书编号" },
        { "name": "status", "type": "String", "enum": ["valid", "expiring_soon", "expired", "unknown"], "default": "unknown", "description": "状态" },
        { "name": "candidateId", "type": "ObjectId(ref: Candidate)", "description": "关联候选人" },
        { "name": "employeeId", "type": "ObjectId(ref: User)", "description": "关联员工" },
        { "name": "file", "type": "String", "description": "证书文件路径" },
        { "name": "fileName", "type": "String", "description": "证书文件名" },
        { "name": "aiExtracted", "type": "Boolean", "default": false, "description": "是否已AI提取" },
        { "name": "aiData", "type": "Mixed", "description": "AI提取的数据" },
        { "name": "createdAt", "type": "Date", "description": "创建时间" },
        { "name": "updatedAt", "type": "Date", "description": "更新时间" }
      ]
    }
  ]
}
