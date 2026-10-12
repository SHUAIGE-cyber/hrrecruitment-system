#!/bin/bash
set -e

echo "=========================================="
echo "  招聘管理系统 - 安装并启动"
echo "=========================================="
echo ""

cd /Users/me/Projects/recruitment-system

# 检查 MongoDB
echo "[1/4] 检查 MongoDB..."
if ! docker ps | grep -q recruitment-mongo; then
    docker run -d -p 27017:27017 --name recruitment-mongo mongo:7
    sleep 3
    echo "    ✓ MongoDB 已启动"
else
    echo "    ✓ MongoDB 运行中"
fi

# 安装后端依赖
echo "[2/4] 安装后端依赖..."
cd backend
if [ ! -d "node_modules" ] || [ $(find node_modules -maxdepth 1 -type d 2>/dev/null | wc -l) -lt 50 ]; then
    echo "    正在安装 (需要几分钟)..."
    npm install
fi
echo "    ✓ 后端依赖就绪"

# 初始化数据库
echo "[3/4] 初始化数据库..."
node src/seed.js
echo "    ✓ 数据库初始化完成"

# 安装前端依赖
echo "[4/4] 检查前端依赖..."
cd ../frontend
if [ ! -d "node_modules" ] || [ $(find node_modules -maxdepth 1 -type d 2>/dev/null | wc -l) -lt 50 ]; then
    echo "    正在安装..."
    npm install
fi
echo "    ✓ 前端依赖就绪"

echo ""
echo "=========================================="
echo "  安装完成！现在启动服务"
echo "=========================================="
echo ""
echo "请在【终端1】执行:"
echo "  cd /Users/me/Projects/recruitment-system/backend && npm run dev"
echo ""
echo "请在【终端2】执行:"
echo "  cd /Users/me/Projects/recruitment-system/frontend && npm run dev"
echo ""
echo "=========================================="
echo "  访问: http://localhost:5173"
echo "=========================================="
echo ""
echo "  账号: admin / admin123"
echo ""
