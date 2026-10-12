#!/bin/bash
set -e

PROJECT="/Users/me/Projects/recruitment-system"

echo "🚀 招聘管理系统 - 启动中..."
echo ""

# 检查 MongoDB
echo "[1/4] 检查 MongoDB..."
if docker ps | grep -q recruitment-mongo; then
    echo "    ✓ MongoDB 运行中"
else
    docker run -d -p 27017:27017 --name recruitment-mongo mongo:7
    echo "    ✓ MongoDB 已启动"
fi

# 安装后端依赖
echo "[2/4] 安装后端依赖..."
cd "$PROJECT/backend"
if [ ! -d "node_modules" ]; then
    npm install
    echo "    ✓ 后端依赖安装完成"
else
    echo "    ✓ 后端依赖已安装"
fi

# 初始化数据库
echo "[3/4] 初始化数据库..."
node src/seed.js
echo "    ✓ 数据库初始化完成"

# 安装前端依赖
echo "[4/4] 安装前端依赖..."
cd "$PROJECT/frontend"
if [ ! -d "node_modules" ]; then
    npm install
    echo "    ✓ 前端依赖安装完成"
else
    echo "    ✓ 前端依赖已安装"
fi

echo ""
echo "✅ 准备完成！"
echo ""
echo "=========================================="
echo "  启动服务："
echo "=========================================="
echo ""
echo "  【终端1】启动后端:"
echo "    cd $PROJECT/backend && npm run dev"
echo ""
echo "  【终端2】启动前端:"
echo "    cd $Project/frontend && npm run dev"
echo ""
echo "  访问地址: http://localhost:5173"
echo ""
echo "  默认账号:"
echo "    管理员: admin / admin123"
echo "    HR专员: hr01 / hr123456"
echo "    面试官: mgr01 / interview123"
echo ""
echo "  ⚠ AI功能需配置 API Key:"
echo "    编辑 $PROJECT/backend/.env"
echo "    ANTHROPIC_API_KEY=sk-ant-xxx"
echo ""
