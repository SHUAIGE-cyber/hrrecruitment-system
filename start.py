#!/usr/bin/env python3
"""招聘系统 - 一键启动脚本"""
import subprocess
import time
import os
import socket
import sys

PROJECT = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.join(PROJECT, "backend")
FRONTEND = os.path.join(PROJECT, "frontend")

def run(cmd, timeout=30):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout, cwd=PROJECT)
        return r
    except Exception as e:
        return type('obj', (object,), {'returncode': 1, 'stdout': '', 'stderr': str(e)})()

def check_port(port):
    try:
        s = socket.socket()
        s.settimeout(2)
        result = s.connect_ex(('127.0.0.1', port))
        s.close()
        return result == 0
    except:
        return False

def main():
    print("=" * 60)
    print("  招聘管理系统 - 一键启动")
    print("=" * 60)
    print()

    # 1. 清理旧进程
    print("[1/5] 清理进程...")
    run("pkill -f 'node.*index.js' 2>/dev/null || true")
    run("pkill -f 'vite' 2>/dev/null || true")
    time.sleep(2)
    print("    ✓ 完成")

    # 2. 启动MongoDB
    print("[2/5] 检查 MongoDB...")
    if not run("docker ps | grep recruitment-mongo").stdout.strip():
        print("    启动 MongoDB...")
        run("docker run -d -p 27017:27017 --name recruitment-mongo mongo:7")
        time.sleep(3)
    print("    ✓ MongoDB 运行中")

    # 3. 启动后端
    print("[3/5] 启动后端...")
    backend_log = open(os.path.join(PROJECT, "backend.log"), "w")
    backend_proc = subprocess.Popen(
        ["node", "src/index.js"],
        cwd=BACKEND,
        stdout=backend_log,
        stderr=subprocess.STDOUT
    )
    print(f"    后端 PID: {backend_proc.pid}")

    print("    等待启动...")
    for i in range(15):
        time.sleep(1)
        if check_port(3000):
            print("    ✓ 后端启动成功 (localhost:3000)")
            break
        elif i % 5 == 4:
            print(f"    等待... {i+1}s")
    else:
        print("    ✗ 后端启动超时")
        backend_log.close()
        return
    backend_log.close()

    # 4. 启动前端
    print("[4/5] 启动前端...")
    frontend_log = open(os.path.join(PROJECT, "frontend.log"), "w")
    frontend_proc = subprocess.Popen(
        ["npx", "vite", "--port", "5173", "--host"],
        cwd=FRONTEND,
        stdout=frontend_log,
        stderr=subprocess.STDOUT
    )
    print(f"    前端 PID: {frontend_proc.pid}")

    print("    等待启动...")
    for i in range(15):
        time.sleep(1)
        if check_port(5173):
            print("    ✓ 前端启动成功 (localhost:5173)")
            break
        elif i % 5 == 4:
            print(f"    等待... {i+1}s")
    frontend_log.close()

    # 5. 完成
    print("[5/5] 启动完成！")
    print()
    print("=" * 60)
    print("  ✅ 系统已启动")
    print("=" * 60)
    print()
    print("  📍 访问地址: http://localhost:5173")
    print()
    print("  👤 默认账号:")
    print("     管理员: admin / admin123")
    print("     HR专员: hr01 / hr123456")
    print("     面试官: mgr01 / interview123")
    print()
    print("  📝 日志文件:")
    print(f"     后端: {PROJECT}/backend.log")
    print(f"     前端: {PROJECT}/frontend.log")
    print()
    print("  🛑 停止服务:")
    print("    pkill -f 'node.*index.js' && pkill -f vite")
    print()

if __name__ == "__main__":
    main()
