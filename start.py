#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
招聘管理系统 - 一键启动脚本
==============================
自动完成：
  1. 检查运行环境（Node.js / Docker / MongoDB）
  2. 安装前后端依赖
  3. 启动 MongoDB
  4. 初始化数据库和默认账号
  5. 启动后端 + 前端
  6. 自动打开浏览器

使用方法:  python3 start.py
"""
import subprocess
import time
import os
import socket
import sys
import webbrowser

PROJECT = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.join(PROJECT, "backend")
FRONTEND = os.path.join(PROJECT, "frontend")


def run(cmd, timeout=30, shell=True):
    """执行命令"""
    try:
        return subprocess.run(
            cmd, shell=shell, capture_output=True, text=True,
            timeout=timeout, cwd=PROJECT
        )
    except Exception as e:
        return type('R', (), {'returncode': 1, 'stdout': '', 'stderr': str(e)})()


def has_command(name):
    """检查命令是否存在"""
    r = run(f"which {name}")
    return r.returncode == 0


def check_port(port):
    """检查端口是否被监听"""
    try:
        s = socket.socket()
        s.settimeout(2)
        result = s.connect_ex(('127.0.0.1', port))
        s.close()
        return result == 0
    except Exception:
        return False


def wait_port(port, timeout=30, name=""):
    """等待端口就绪"""
    for i in range(timeout):
        if check_port(port):
            return True
        time.sleep(1)
        if i % 5 == 4 and name:
            print(f"      等待{name}启动... {i + 1}s")
    return False


def main():
    print("=" * 60)
    print("  招聘管理系统 - 一键启动")
    print("=" * 60)
    print()

    # ========== 0. 环境检查 ==========
    print("[0/6] 检查运行环境...")
    if not has_command("node"):
        print("  ✗ 未找到 Node.js")
        print("    请先安装: https://nodejs.org （推荐 v18+）")
        sys.exit(1)
    r = run("node --version")
    print(f"  ✓ Node.js {r.stdout.strip()}")

    if not has_command("docker"):
        print("  ⚠ 未找到 Docker（需要用它启动MongoDB）")
        print("    请先安装: https://www.docker.com/products/docker-desktop")
        print("    或者自行安装 MongoDB: brew install mongodb-community")
    else:
        print("  ✓ Docker")

    print()

    # ========== 1. 清理旧进程 ==========
    print("[1/6] 清理旧进程...")
    run("pkill -f 'node.*index.js' 2>/dev/null || true")
    run("pkill -f 'vite' 2>/dev/null || true")
    time.sleep(2)
    print("  ✓ 完成")
    print()

    # ========== 2. 启动 MongoDB ==========
    print("[2/6] 检查 MongoDB...")
    r = run("docker ps --format '{{.Names}}' 2>/dev/null")
    if "recruitment-mongo" in r.stdout:
        print("  ✓ MongoDB 运行中")
    else:
        # 检查是否有停止的容器
        r2 = run("docker ps -a --format '{{.Names}}' 2>/dev/null")
        if "recruitment-mongo" in r2.stdout:
            print("  启动已存在的 MongoDB 容器...")
            run("docker start recruitment-mongo")
            time.sleep(3)
        else:
            print("  创建并启动 MongoDB 容器...")
            run("docker run -d -p 27017:27017 --name recruitment-mongo mongo:7")
            time.sleep(5)
        # 验证
        r3 = run("docker ps --format '{{.Names}}'")
        if "recruitment-mongo" in r3.stdout:
            print("  ✓ MongoDB 已启动")
        else:
            print("  ✗ MongoDB 启动失败，请手动检查 Docker")
            sys.exit(1)
    print()

    # ========== 3. 检查 .env 配置 ==========
    print("[3/6] 检查配置...")
    env_path = os.path.join(BACKEND, ".env")
    env_example = os.path.join(BACKEND, ".env.example")
    if not os.path.exists(env_path):
        if os.path.exists(env_example):
            import shutil
            shutil.copy(env_example, env_path)
            print("  ⚠ 已从模板创建 backend/.env")
            print("     → 如需AI功能，请编辑 backend/.env 填入 AI_API_KEY")
        else:
            print("  ⚠ backend/.env 不存在")
    else:
        # 检查Key是否已配置
        with open(env_path, 'r') as f:
            content = f.read()
        if "YOUR_API_KEY_HERE" in content or "AI_API_KEY=\n" in content or "AI_API_KEY= " in content:
            print("  ⚠ backend/.env 中的 AI_API_KEY 未配置（AI功能将不可用）")
            print("     → 编辑 backend/.env 填入你的 Key（DeepSeek等）")
        else:
            print("  ✓ 配置文件就绪")
    print()

    # ========== 4. 安装依赖 ==========
    print("[4/6] 检查依赖...")
    nm_backend = os.path.join(BACKEND, "node_modules")
    nm_frontend = os.path.join(FRONTEND, "node_modules")

    if os.path.exists(os.path.join(nm_backend, "express")):
        print("  ✓ 后端依赖已安装")
    else:
        print("  安装后端依赖（首次需要几分钟）...")
        r = run("npm install --prefix backend", timeout=300)
        if r.returncode == 0:
            print("  ✓ 后端依赖安装完成")
        else:
            print(f"  ✗ 安装失败: {r.stderr[-200:]}")
            sys.exit(1)

    if os.path.exists(os.path.join(nm_frontend, "vite")):
        print("  ✓ 前端依赖已安装")
    else:
        print("  安装前端依赖（首次需要几分钟）...")
        r = run("npm install --prefix frontend", timeout=300)
        if r.returncode == 0:
            print("  ✓ 前端依赖安装完成")
        else:
            print(f"  ✗ 安装失败: {r.stderr[-200:]}")
            sys.exit(1)
    print()

    # ========== 5. 初始化数据库 ==========
    print("[5/6] 初始化数据库...")
    r = subprocess.run(
        ["node", "src/seed.js"], cwd=BACKEND,
        capture_output=True, text=True, timeout=30
    )
    if r.returncode == 0:
        # 提取输出中的用户信息
        for line in r.stdout.split('\n'):
            if '用户' in line or 'admin' in line or '已存在' in line:
                print(f"  {line.strip()}")
        print("  ✓ 数据库就绪")
    else:
        print(f"  ⚠ 初始化警告: {r.stderr[-150:]}")
    print()

    # ========== 6. 启动服务 ==========
    print("[6/6] 启动服务...")

    # 启动后端
    backend_log = open(os.path.join(PROJECT, "backend.log"), "w")
    backend_proc = subprocess.Popen(
        ["node", "src/index.js"], cwd=BACKEND,
        stdout=backend_log, stderr=subprocess.STDOUT
    )
    print(f"  后端 PID: {backend_proc.pid}")

    if wait_port(3000, timeout=20, name="后端"):
        print("  ✓ 后端启动成功 (http://localhost:3000)")
    else:
        print("  ✗ 后端启动失败")
        backend_log.close()
        with open(os.path.join(PROJECT, "backend.log")) as f:
            print("  日志:", f.read()[-500:])
        sys.exit(1)
    backend_log.close()

    # 启动前端
    frontend_log = open(os.path.join(PROJECT, "frontend.log"), "w")
    frontend_proc = subprocess.Popen(
        ["npx", "vite", "--port", "5173", "--host"], cwd=FRONTEND,
        stdout=frontend_log, stderr=subprocess.STDOUT
    )
    print(f"  前端 PID: {frontend_proc.pid}")

    if wait_port(5173, timeout=20, name="前端"):
        print("  ✓ 前端启动成功 (http://localhost:5173)")
    else:
        print("  ⚠ 前端启动较慢，稍等片刻")
    frontend_log.close()
    print()

    # ========== 完成 ==========
    print("=" * 60)
    print("  ✅ 启动完成！")
    print("=" * 60)
    print()
    print("  📍 访问地址: http://localhost:5173")
    print()
    print("  👤 默认账号:")
    print("     ├─ 超级管理员  admin   / admin123")
    print("     ├─ HR专员      hr01    / hr123456")
    print("     ├─ 部门主管    boss01  / manager123")
    print("     └─ 面试官      mgr01   / interview123")
    print()
    print("  📝 日志文件:")
    print("     backend.log  /  frontend.log")
    print()
    print("  🛑 停止服务:")
    print("     pkill -f 'node.*index.js' && pkill -f vite")
    print()

    # 自动打开浏览器
    try:
        time.sleep(2)
        webbrowser.open("http://localhost:5173")
        print("  🌐 已自动打开浏览器")
    except Exception:
        pass
    print()

    # 保持脚本运行，Ctrl+C 时清理
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n正在停止服务...")
        run("pkill -f 'node.*index.js' 2>/dev/null || true")
        run("pkill -f 'vite' 2>/dev/null || true")
        print("已停止 ✓")


if __name__ == "__main__":
    main()
