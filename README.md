# 招聘管理系统

基于 Node.js + Vue 3 的招聘管理后台系统，包含招聘需求审批、简历AI解析、面试看板、Offer管理等完整招聘流程。

## ⚡ 一键启动（推荐）

```bash
# 1. 克隆代码
git clone https://github.com/SHUAIGE-cyber/hrrecruitment-system.git
cd hrrecruitment-system

# 2. 一键启动（自动完成所有配置）
python3 start.py
```

**就这两步！** 脚本会自动：安装依赖 → 启动MongoDB → 初始化数据库 → 启动前后端 → 打开浏览器

---

## 👤 默认账号（4种角色）

| 角色 | 用户名 | 密码 | 权限 |
|------|--------|------|------|
| 超级管理员 | `admin` | `admin123` | 全部功能 |
| HR专员 | `hr01` | `hr123456` | 招聘全流程（无用户管理） |
| 部门主管 | `boss01` | `manager123` | 仅「招聘需求」（提交需求） |
| 部门面试官 | `mgr01` | `interview123` | 候选人（手机号打码）+面试看板 |

> 访问地址: http://localhost:5173

---

## 🤖 AI 功能配置（可选）

没有AI Key系统也能用，只是简历解析等AI功能不可用。配置方法：

```bash
# 编辑配置文件
open backend/.env
```

填入 API Key（推荐 DeepSeek，便宜好用）：

```env
AI_PROVIDER=deepseek
AI_API_KEY=sk-你的key
AI_MODEL=deepseek-chat
AI_BASE_URL=https://api.deepseek.com/v1
```

**获取 DeepSeek Key**: https://platform.deepseek.com （充值几块钱能用很久）

其他支持的模型：
- OpenAI: `AI_PROVIDER=openai`, `AI_BASE_URL=https://api.openai.com/v1`
- Anthropic: `AI_PROVIDER=anthropic`, `AI_BASE_URL=`（留空）

配置好后重启后端生效。

---

## 📋 功能模块

### 核心功能
- **招聘需求审批流** - 部门主管提交需求 → HR/管理员审批 → 一键转正式岗位
- **岗位管理** - 自定义评分标准（学历/经验/年龄/技能）
- **候选人管理** - 手动录入 + 简历上传(PDF/图片/Word)、AI自动解析、匹配打分
- **面试看板** - 拖拽式流程（初筛→一面→二面→终面→Offer→待入职）
- **Offer管理** - 新建Offer + 审批流
- **证书管理** - 上传证书 + 自动OCR识别有效期
- **仪表盘** - 招聘漏斗 + Excel数据导出
- **权限管理** - 四种角色分级权限

### AI 能力
1. **简历解析** - 自动提取姓名/学历/经验/技能等结构化信息
2. **JD匹配打分** - 0-100分 + 分维度评分 + 匹配理由
3. **面试题生成** - 根据JD+简历自动生成针对性问题
4. **面试总结** - 自动整理面试手记
5. **证书识别** - 提取证书名称/有效期/发证机构（macOS原生OCR）

---

## 🛠 环境要求

- **Node.js** >= 18（必需）: https://nodejs.org
- **Docker**（用来跑MongoDB）: https://www.docker.com/products/docker-desktop
- **Python 3**（运行一键脚本）
- macOS / Linux / Windows

---

## 📖 使用流程示例

### 场景1：部门主管申请招人
1. 部门主管登录（`boss01`）→ 提交招聘需求（岗位/人数/要求/JD）
2. HR登录（`hr01`）→ 「招聘需求」看到待审批 → 审批通过
3. HR点击「转正式岗位」→ 岗位管理出现新岗位

### 场景2：HR招人全流程
1. 岗位管理 → 新建岗位（设置评分标准）
2. 候选人管理 → 上传简历 → AI自动解析
3. 候选人详情 → 选择岗位 → 「开始打分」→ AI输出匹配度
4. 面试看板 → 拖拽候选人走流程
5. 面试 → AI生成面试题 → 面试后AI总结
6. Offer管理 → 发Offer → 审批流

---

## ❓ 常见问题

**Q: 启动报错 "Cannot connect to MongoDB"？**
```bash
# 检查Docker是否运行
docker ps | grep mongo
# 手动启动
docker start recruitment-mongo
```

**Q: AI功能报错？**
检查 `backend/.env` 里 `AI_API_KEY` 是否填了自己的Key。

**Q: 端口被占用？**
```bash
# 清理所有服务进程
pkill -f 'node.*index.js' && pkill -f vite
# 重新启动
python3 start.py
```

**Q: 怎么停止服务？**
```bash
pkill -f 'node.*index.js' && pkill -f vite
```

**Q: 想给别人用（局域网共享）？**
修改 `frontend/vite.config.js` 已支持 `--host`，用你的局域网IP访问：
```
http://你的IP:5173
```
也可以把系统部署到云服务器，让大家都能访问。

---

## 📁 项目结构

```
recruitment-system/
├── start.py              # ⭐ 一键启动脚本
├── README.md             # 本文档
├── DATABASE.md           # 数据库表结构
├── backend/              # 后端 (Node.js + Express + MongoDB)
│   ├── src/
│   │   ├── models/       # 数据模型
│   │   ├── routes/       # API路由
│   │   ├── services/     # AI服务、文档解析
│   │   ├── middleware/   # 认证、上传中间件
│   │   ├── index.js      # 入口
│   │   └── seed.js       # 初始化数据
│   ├── scripts/ocr.swift # macOS OCR工具
│   └── .env.example      # 配置模板
└── frontend/             # 前端 (Vue 3 + Vite + Element Plus)
    └── src/
        ├── views/        # 页面组件
        ├── api.js        # API封装
        ├── router/       # 路由+权限守卫
        └── stores/       # 状态管理
```

---

## 📄 License

MIT
