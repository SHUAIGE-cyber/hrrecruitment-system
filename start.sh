#!/bin/bash
# 招聘管理系统 - 一键启动脚本
set -e

echo "=========================================="
echo "  招聘管理系统 - 启动中..."
echo "=========================================="
echo ""

cd /Users/me/Projects/recruitment-system/backend

# 1. 清理旧进程
echo "[1/4] 清理旧进程..."
pkill -9 -f "node.*index.js" 2>/dev/null || true
pkill -9 -f "vite" 2>/dev/null || true
sleep 1
echo "    ✓ 完成"

# 2. 启动 MongoDB
echo "[2/4] 检查 MongoDB..."
if ! docker ps | grep -q recruitment-mongo; then
    echo "    启动 MongoDB..."
    docker run -d -p 27017:27017 --name recruitment-mongo mongo:7
    sleep 3
fi
echo "    ✓ MongoDB 运行中"

# 3. 启动后端
echo "[3/4] 启动后端..."
node src/index.js > /tmp/recruitment-backend.log 2>&1 &
BEPID=$!
echo "    后端 PID: $BEPID"
sleep 3

# 检查后端是否启动
if lsof -i :3000 >/dev/null 2>&1; then
    echo "    ✓ 后端启动成功"
else
    echo "    ✗ 后端启动失败"
    echo "    查看日志: cat /tmp/recruitment-backend.log | tail -20"
    exit 1
fi

# 4. 启动前端
echo "[4/4] 启动前端..."
cd ../frontend
npx vite --port 5173 --host > /tmp/recruitment-frontend.log 2>&1 &
FEID=$!
echo "    前端 PID: $FEID"
sleep 3

if lsof -i :5173 >/dev/null 2>&1; then
    echo "    ✓ 前端启动成功"
else
    echo "    ⚠ 前端可能启动失败"
fi

echo ""
echo "=========================================="
echo "  ✅ 启动完成！"
echo "=========================================="
echo ""
echo "  📍 访问地址: http://localhost:5173"
echo ""
echo "  👤 默认账号:"
echo "     管理员: admin / admin123"
echo "     HR专员: hr01 / hr123456"
echo "     面试官: mgr01 / interview123"
echo ""
echo "  📝 日志文件:"
echo "     后端: /tmp/recruitment-backend.log"
echo "     前端: /tmp/recruitment-frontend.log"
echo ""
echo "  停止服务: pkill -f 'node.*recruitment' && pkill -f vite"
echo ""
