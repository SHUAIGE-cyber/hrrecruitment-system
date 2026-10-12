#!/bin/bash
# 招聘管理系统 - 完整启动脚本
# 请在终端执行: bash /Users/me/Projects/recruitment-system/启动.sh

set -e
PROJECT="/Users/me/Projects/recruitment-system"

echo "=========================================="
echo "  招聘管理系统 - 启动中..."
echo "=========================================="

# 1. 检查 MongoDB
echo ""
echo "[1/5] 检查 MongoDB..."
if docker ps | grep -q recruitment-mongo; then
    echo "      ✓ MongoDB 运行中"
else
    echo "      ⚠ MongoDB 未运行，正在启动..."
    docker run -d -p 27017:27017 --name recruitment-mongo mongo:7
    sleep 3
    echo "      ✓ MongoDB 已启动"
fi

# 2. 安装后端依赖
echo "[2/5] 安装后端依赖..."
cd "$PROJECT/backend"
if [ ! -d "node_modules" ] || [ $(ls node_modules 2>/dev/null | wc -l | tr -d ' ') -lt 50 ]; then
    echo "      正在安装..."
    npm install
else
    echo "      ✓ 已存在"
fi

# 3. 初始化数据库
echo "[3/5] 初始化数据库..."
node src/seed.js

# 4. 安装前端依赖
echo "[4/5] 安装前端依赖..."
cd "$PROJECT/frontend"
if [ ! -d "node_modules" ] || [ $(ls node_modules 2>/dev/null | wc -l | tr -d ' ') -lt 50 ]; then
    echo "      正在安装..."
    npm install
else
    echo "      ✓ 已存在"
fi

# 5. 启动服务
echo "[5/5] 启动完成！"
echo ""
echo "=========================================="
echo "  下一步：启动服务"
echo "=========================================="
echo ""
echo "请在【终端1】执行:"
echo "  cd $PROJECT/backend && npm run dev"
echo ""
echo "请在【终端2】执行:"
echo "  cd $PROJECT/frontend && npm run dev"
echo ""
echo "=========================================="
echo "  访问地址: http://localhost:5173"
echo "=========================================="
echo ""
echo "  👤 默认账号:"
echo "     管理员: admin / admin123"
echo "     HR专员: hr01 / hr123456"
echo "     面试官: mgr01 / interview123"
echo ""
echo "  ⚠ AI功能需配置 API Key:"
echo "     编辑: $PROJECT/backend/.env"
echo "     填入: ANTHROPIC_API_KEY=sk-ant-xxx"
echo ""
