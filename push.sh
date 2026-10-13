#!/bin/bash
# 提交并推送更新到 GitHub
cd /Users/me/Projects/recruitment-system

git add -A
git commit -m "feat: 增强一键启动脚本+完善README

- start.py: 环境检查/自动启动MongoDB/自动开浏览器/Ctrl+C停止
- README: 一键启动说明、4角色账号表、FAQ"
git push origin main

echo ""
echo "✓ 推送完成！"
