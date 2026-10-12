#!/bin/bash
# 快速启动脚本（MongoDB 已安装时使用）
set -e

PROJECT_DIR="/Users/me/Projects/recruitment-system"

echo "=========================================="
echo "  招聘管理系统 - 快速启动"
echo "=========================================="

# 确保 MongoDB 运行
if ! pgrep -x mongod > /dev/null; then
    echo "[1/4] 启动 MongoDB..."
    brew services start mongodb-community
    sleep 2
fi
echo "      MongoDB 已运行"

# 确保 .env 存在
if [ ! -f "$PROJECT_DIR/backend/.env" ]; then
    echo "[2/4] 配置后端..."
    cp "$PROJECT_DIR/backend/.env.example" "$PROJECT_DIR/backend/.env"
    echo "      已创建 .env，请编辑 backend/.env 填入 Anthropic API Key"
fi

# 安装依赖
echo "[3/4] 检查依赖..."
[ -d "$PROJECT_DIR/backend/node_modules" ] || cd "$PROJECT_DIR/backend" && npm install
[ -d "$PROJECT_DIR/frontend/node_modules" ] || cd "$PROJECT_DIR/frontend" && npm install

# 初始化数据库
echo "[4/4] 初始化数据库..."
cd "$PROJECT_DIR/backend" && node src/seed.js

echo ""
echo "=========================================="
echo "  系统就绪！启动服务："
echo "=========================================="
echo ""
echo "终端1 - 启动后端:"
echo "  cd $PROJECT_DIR/backend && npm run dev"
echo ""
echo "终端2 - 启动前端:"
echo "  cd $PROJECT_DIR/frontend && npm run dev"
echo ""
echo "访问: http://localhost:5173"
echo ""
