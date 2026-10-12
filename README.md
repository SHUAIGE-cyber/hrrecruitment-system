# 招聘管理系统

基于 Node.js + Vue 3 的招聘管理后台系统，支持简历解析、面试看板、Offer管理等功能。

## 功能特性

### 核心模块
- **岗位管理** - 新增/编辑/停用岗位，支持状态流转
- **候选人管理** - 手动录入 + 简历上传，AI自动解析
- **面试看板** - 拖拽式流程管理（简历初筛→一面→二面→终面→Offer→待入职）
- **Offer管理** - 新建Offer + 审批流 + 状态跟踪
- **证书管理** - 上传证书 + AI识别有效期
- **仪表盘** - 招聘漏斗图表 + 数据导出Excel
- **权限管理** - 超级管理员 / HR专员 / 部门面试官

### AI能力
1. 简历解析 - 自动提取结构化信息
2. JD匹配打分 - 输出0-100分 + 匹配理由
3. 生成面试题 - 根据JD+简历生成针对性问题
4. 面试总结 - AI自动整理面试手记
5. 证书识别 - 提取证书名称、有效期

## 技术栈

**后端:**
- Node.js + Express
- MongoDB + Mongoose
- JWT 认证
- Multer 文件上传
- Anthropic Claude / DeepSeek AI

**前端:**
- Vue 3 + Vite
- Element Plus UI
- Pinia 状态管理
- Vue Router 路由

## 快速开始

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd recruitment-system
```

### 2. 安装依赖
```bash
# 后端
cd backend && npm install && cd ..

# 前端
cd frontend && npm install && cd ..
```

### 3. 配置环境
```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 编辑配置文件
open backend/.env
```

需要配置：
- `MONGODB_URI` - MongoDB连接地址
- `AI_API_KEY` - AI API密钥（DeepSeek推荐）
- `AI_BASE_URL` - API地址（DeepSeek: https://api.deepseek.com/v1）

### 4. 启动服务
```bash
# 方式1: 使用启动脚本
python3 start.py

# 方式2: 手动启动
# 终端1 - 后端
cd backend && node src/index.js

# 终端2 - 前端
cd frontend && npx vite --port 5173
```

### 5. 访问系统
- 前端: http://localhost:5173
- 后端: http://localhost:3000

## 默认账号
- 超级管理员: `admin` / `admin123`
- HR专员: `hr01` / `hr123456`
- 面试官: `mgr01` / `interview123`

## AI配置说明

### 使用 DeepSeek（推荐）
1. 注册：https://platform.deepseek.com
2. 充值（很便宜，几块钱就能用很久）
3. 创建API Key
4. 修改 `.env`:
```env
AI_PROVIDER=openai
AI_API_KEY=你的DeepSeek-Key
AI_MODEL=deepseek-chat
AI_BASE_URL=https://api.deepseek.com/v1
```

### 使用 Anthropic Claude
1. 注册：https://console.anthropic.com
2. 创建API Key
3. 修改 `.env`:
```env
AI_PROVIDER=anthropic
AI_API_KEY=你的Anthropic-Key
AI_MODEL=claude-sonnet-4-20250514
```

## 目录结构
```
recruitment-system/
├── backend/              # 后端服务
│   ├── src/
│   │   ├── models/      # MongoDB模型
│   │   ├── routes/      # API路由
│   │   ├── services/    # 业务逻辑(AI、文档解析)
│   │   ├── middleware/  # 中间件(认证、上传)
│   │   ├── index.js     # 入口
│   │   └── seed.js      # 数据初始化
│   ├── uploads/         # 文件上传目录
│   ├── package.json
│   └── .env.example
├── frontend/            # 前端应用
│   ├── src/
│   │   ├── views/       # 页面组件
│   │   ├── api/         # API请求
│   │   ├── router/      # 路由配置
│   │   ├── stores/      # Pinia状态管理
│   │   └── styles/      # 样式
│   ├── package.json
│   └── vite.config.js
├── README.md
├── DATABASE.md          # 数据库表结构
└── start.py             # 一键启动脚本
```

## API接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录 |
| GET | /api/auth/me | 获取当前用户 |
| GET | /api/positions | 岗位列表 |
| POST | /api/candidates/upload | 上传简历 |
| GET | /api/dashboard/dashboard | 仪表盘数据 |

## 部署说明

### Docker部署
```bash
# 使用Docker Compose
docker-compose up -d
```

### 生产环境
```bash
# 构建前端
cd frontend && npm run build

# 启动后端
NODE_ENV=production node src/index.js
```

## 许可证
MIT License

## 贡献指南
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request
