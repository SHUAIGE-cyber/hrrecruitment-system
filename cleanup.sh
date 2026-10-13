#!/bin/bash
# 一键清理并提交到 GitHub
cd /Users/me/Projects/recruitment-system

echo "=== 1. 清理临时文件 ==="
rm -f diagnose.py diagnose_and_fix.py test_api.py 2>/dev/null
rm -f 启动.sh 安装并启动.sh START.md 启动指南.md 启动步骤.md 2>/dev/null
rm -f quick-start.sh 2>/dev/null
rm -f backend/.env.bak backend.log frontend.log test_resume.txt 2>/dev/null
echo "✓ 清理完成"

echo ""
echo "=== 2. 从git移除敏感文件 ==="
git rm --cached backend/.env.bak 2>/dev/null && echo "✓ 已移除 .env.bak" || echo "（无 .env.bak）"

echo ""
echo "=== 3. 更新 .gitignore ==="
cat > .gitignore << 'EOF'
# 依赖
node_modules/
frontend/node_modules/
backend/node_modules/

# 环境变量（含API Key，绝不能提交）
.env
.env.*
!.env.example
backend/.env
backend/.env.bak

# 日志
*.log
logs/

# 上传的文件（用户数据）
uploads/
backend/uploads/

# 编译产物
backend/scripts/ocr
dist/

# IDE
.vscode/
.idea/
*.swp

# macOS
.DS_Store

# 临时文件
*.tmp
*.temp
EOF
echo "✓ .gitignore 已更新"

echo ""
echo "=== 4. 更新 backend/.env.example ==="
cat > backend/.env.example << 'EOF'
# ==================== 服务配置 ====================
PORT=3000
MONGODB_URI=mongodb://localhost:27017/recruitment
JWT_SECRET=change_this_to_a_random_string_in_production
JWT_EXPIRE=7d

# ==================== AI 配置 ====================
# 可选: anthropic | openai | deepseek
AI_PROVIDER=deepseek

# AI API Key（填你自己的）
# DeepSeek 获取: https://platform.deepseek.com
# 便宜好用，推荐
AI_API_KEY=YOUR_API_KEY_HERE

# 模型名称
# DeepSeek:  deepseek-chat
# OpenAI:    gpt-4o-mini / gpt-4o
# Anthropic: claude-sonnet-4-20250514
AI_MODEL=deepseek-chat

# API 地址
# DeepSeek:  https://api.deepseek.com/v1
# OpenAI:    https://api.openai.com/v1
# Anthropic: （留空）
AI_BASE_URL=https://api.deepseek.com/v1

# ==================== 文件上传 ====================
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
EOF
echo "✓ .env.example 已更新"

echo ""
echo "=== 完成，检查git状态 ==="
git status --short | head -30
