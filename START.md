#!/bin/bash
# 招聘管理系统 - 启动脚本（请在终端手动执行）
set -e

PROJECT="/Users/me/Projects/recruitment-system"

echo "=== 招聘管理系统启动 ==="
echo ""

# 1. 启动 MongoDB (Docker)
echo "[1/5] 启动 MongoDB..."
docker run -d -p 27017:27017 --name recruitment-mongo mongo:7
sleep 3
echo "      ✓ MongoDB 已启动"
echo ""

# 2. 安装后端依赖
echo "[2/5] 安装后端依赖..."
cd "$PROJECT/backend"
npm install
echo "      ✓ 后端依赖安装完成"
echo ""

# 3. 初始化数据库
echo "[3/5] 初始化数据库..."
node src/seed.js
echo "      ✓ 数据库初始化完成"
echo ""

# 4. 安装前端依赖
echo "[4/5] 安装前端依赖..."
cd "$PROJECT/frontend"
npm install
echo "      ✓ 前端依赖安装完成"
echo ""

# 5. 提示启动
echo "[5/5] 准备启动服务"
echo ""
echo "=========================================="
echo "  在两个新终端分别执行以下命令："
echo "=========================================="
echo ""
echo "  终端1 - 启动后端:"
echo "    cd $PROJECT/backend"
echo "    npm run dev"
echo ""
echo "  终端2 - 启动前端:"
echo "    cd $PROJECT/frontend"
echo "    npm run dev"
echo ""
echo "=========================================="
echo "  访问地址: http://localhost:5173"
echo "=========================================="
echo ""
echo "  默认账号:"
echo "    管理员: admin / admin123"
echo "    HR专员: hr01 / hr123456"
echo "    面试官: mgr01 / interview123"
echo ""
echo "  ⚠️  如需使用 AI 功能，请编辑 backend/.env"
echo "     填入你的 Anthropic API Key:"
echo "     ANTHROPIC_API_KEY=sk-ant-xxx"
echo ""
