#!/bin/bash
# 招聘管理系统 - 一键启动脚本（修复版）
set -e

echo "=========================================="
echo "  招聘管理系统 - 启动"
echo "=========================================="
echo ""

cd /Users/me/Projects/recruitment-system

# 1. 清理旧进程
echo "[1/6] 清理旧进程..."
pkill -9 -f "recruitment" 2>/dev/null || true
pkill -9 -f "vite" 2>/dev/null || true
pkill -9 -f "nodemon" 2>/dev/null || true
sleep 2
echo "    ✓ 清理完成"

# 2. 检查 MongoDB
echo "[2/6] 检查 MongoDB..."
if docker ps | grep -q recruitment-mongo; then
    echo "    ✓ MongoDB 运行中"
else
    docker run -d -p 27017:27017 --name recruitment-mongo mongo:7
    sleep 3
    echo "    ✓ MongoDB 已启动"
fi

# 3. 安装依赖（如果需要）
echo "[3/6] 检查依赖..."
if [ ! -d "backend/node_modules/express" ]; then
    echo "    安装后端依赖..."
    cd backend && npm install && cd ..
fi
if [ ! -d "frontend/node_modules/vue" ]; then
    echo "    安装前端依赖..."
    cd frontend && npm install && cd ..
fi
echo "    ✓ 依赖就绪"

# 4. 初始化数据库
echo "[4/6] 初始化数据库..."
cd backend && node src/seed.js && cd ..
echo "    ✓ 完成"

# 5. 启动后端
echo "[5/6] 启动后端..."
cd backend
nohup node src/index.js > /tmp/recruitment-backend.log 2>&1 &
BEPID=$!
echo "    后端 PID: $BEPID"
cd ..

# 等待后端启动
echo "    等待后端启动..."
for i in 1 2 3 4 5 6 7 8 9 10; do
    sleep 1
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "    ✓ 后端已启动 (localhost:3000)"
        break
    fi
    echo -n "."
done
echo ""

# 6. 启动前端
echo "[6/6] 启动前端..."
cd frontend
nohup npx vite --port 5173 --host > /tmp/recruitment-frontend.log 2>&1 &
FEPID=$!
echo "    前端 PID: $FEPID"
cd ..

# 等待前端启动
echo "    等待前端启动..."
for i in 1 2 3 4 5 6 7 8 9 10; do
    sleep 1
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "    ✓ 前端已启动 (localhost:5173)"
        break
    fi
    echo -n "."
done
echo ""

# 最终检查
echo ""
echo "=========================================="
echo "  最终验证"
echo "=========================================="

if curl -s http://localhost:3000/api/health > /dev/null 2>&1 && curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo ""
    echo "  ✅ 招聘管理系统启动成功！"
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
    echo "  ⚠️  AI功能配置:"
    echo "     编辑 backend/.env 填入 ANTHROPIC_API_KEY"
    echo ""
    echo "  停止服务: pkill -f 'node.*recruitment' && pkill -f vite"
    echo ""
else
    echo ""
    echo "  ⚠️  部分服务未启动，请查看日志"
    echo ""
    echo "  后端日志:"
    cat /tmp/recruitment-backend.log 2>/dev/null | tail -20
    echo ""
    echo "  前端日志:"
    cat /tmp/recruitment-frontend.log 2>/dev/null | tail -20
    echo ""
fi
