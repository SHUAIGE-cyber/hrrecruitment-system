#!/bin/bash
set -e

PROJECT="/Users/me/Projects/recruitment-system"

echo "=========================================="
echo "  招聘管理系统 - 一键启动"
echo "=========================================="

# 检查 MongoDB
if ! docker ps | grep -q recruitment-mongo; then
    echo ""
    echo "[1/4] 启动 MongoDB..."
    docker run -d -p 27017:27017 --name recruitment-mongo mongo:7
    sleep 3
    echo "      ✓ MongoDB 已启动"
else
    echo "[1/4] MongoDB 已在运行 ✓"
fi

# 安装后端依赖
echo "[2/4] 安装后端依赖..."
cd "$PROJECT/backend"
if [ ! -d "node_modules" ] || [ $(ls node_modules 2>/dev/null | wc -l) -lt 5 ]; then
    npm install
    echo "      ✓ 后端依赖安装完成"
else
    echo "      ✓ 后端依赖已存在"
fi

# 安装前端依赖
echo "[3/4] 安装前端依赖..."
cd "$PROJECT/frontend"
if [ ! -d "node_modules" ] || [ $(ls node_modules 2>/dev/null | wc -l) -lt 5 ]; then
    npm install
    echo "      ✓ 前端依赖安装完成"
else
    echo "      ✓ 前端依赖已存在"
fi

# 初始化数据库
echo "[4/4] 初始化数据库..."
cd "$PROJECT/backend"
node src/seed.js

echo ""
echo "=========================================="
echo "  启动完成！现在启动服务..."
echo "=========================================="
echo ""
echo "请在【终端1】运行:"
echo "  cd $PROJECT/backend && npm run dev"
echo ""
echo "请在【终端2】运行:"
echo "  cd $Project/frontend && npm run dev"
echo ""
echo "访问地址: http://localhost:5173"
echo ""
echo "默认账号:"
echo "  管理员: admin / admin123"
echo "  HR专员: hr01 / hr123456"
echo "  面试官: mgr01 / interview123"
echo ""
echo "如需 AI 功能，编辑 backend/.env 填入:"
echo "  ANTHROPIC_API_KEY=sk-ant-your-key-here"
echo ""
