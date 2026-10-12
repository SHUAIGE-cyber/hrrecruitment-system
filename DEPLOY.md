# 招聘管理系统 - 部署指南

## 环境要求

- Node.js >= 18
- MongoDB >= 6.0
- npm >= 9

## 部署步骤

### 1. 安装 MongoDB

```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# 或 Docker
docker run -d -p 27017:27017 --name mongo mongo:latest
```

### 2. 配置后端

```bash
cd backend
cp .env.example .env
```

编辑 `.env`:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/recruitment
JWT_SECRET=your_random_secret_key_change_this
ANTHROPIC_API_KEY=sk-ant-xxx
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

### 3. 安装依赖并启动

```bash
# 后端
npm install
npm run dev

# 初始化数据
node src/seed.js
```

### 4. 前端开发

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173

### 5. 生产构建

```bash
# 前端构建
cd frontend
npm run build

# 后端生产启动
cd ../backend
NODE_ENV=production npm start
```

## 模型切换

在 `.env` 中修改 `ANTHROPIC_MODEL`:

```env
# Claude 模型选项
ANTHROPIC_MODEL=claude-sonnet-4-20250514   # 推荐:性能与成本平衡
ANTHROPIC_MODEL=claude-opus-4-20250514    # 最强:适合复杂任务
ANTHROPIC_MODEL=claude-haiku-3-20240307   # 快速:适合简单任务
```

## 常见问题

### Q: MongoDB 连接失败
```bash
# 检查 MongoDB 是否运行
brew services list | grep mongodb
# 或
docker ps | grep mongo
```

### Q: Anthropic API Key 无效
- 前往 https://console.anthropic.com 获取 API Key
- 确保账户有余额

### Q: 简历解析失败
- 检查文件类型是否支持: PDF, DOCX, JPG, PNG
- 检查文件大小是否超过 10MB

## 安全建议

1. 生产环境修改 `JWT_SECRET` 为随机字符串
2. 启用 HTTPS
3. 配置 MongoDB 认证
4. 限制 API 访问频率
