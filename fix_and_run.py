#!/usr/bin/env python3
"""招聘管理系统 - 最终启动脚本"""
import subprocess
import time
import os
import signal
import socket
import sys

PROJECT = "/Users/me/Projects/recruitment-system"
BACKEND = f"{PROJECT}/backend"
FRONTEND = f"{PROJECT}/frontend"

def run(cmd, cwd=None, timeout=300):
    try:
        r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout)
        return r
    except subprocess.TimeoutExpired:
        return type('obj', (object,), {'returncode': 1, 'stdout': '', 'stderr': 'TIMEOUT'})()
    except Exception as e:
        return type('obj', (object,), {'returncode': 1, 'stdout': '', 'stderr': str(e)})()

def check_port(port):
    try:
        s = socket.socket()
        s.settimeout(2)
        ok = s.connect_ex(('127.0.0.1', port)) == 0
        s.close()
        return ok
    except:
        return False

def kill_all():
    subprocess.run(['pkill', '-9', '-f', 'recruitment'], capture_output=True)
    subprocess.run(['pkill', '-9', '-f', 'vite'], capture_output=True)
    subprocess.run(['pkill', '-9', '-f', 'nodemon'], capture_output=True)
    time.sleep(2)

def main():
    print("=" * 60)
    print("  招聘管理系统 - 最终启动")
    print("=" * 60)
    print()

    # 清理
    print("[1/5] 清理环境...")
    kill_all()
    print("    ✓ 完成")

    # 检查 MongoDB
    print("[2/5] 检查 MongoDB...")
    r = run(["docker", "ps", "--format", "{{.Names}}"])
    if "recruitment-mongo" in r.stdout:
        print("    ✓ MongoDB 运行中")
    else:
        print("    ✗ MongoDB 未运行，请先启动: docker run -d -p 27017:27017 --name recruitment-mongo mongo:7")
        return
    print()

    # 测试 SDK
    print("[3/5] 测试 Anthropic SDK...")
    r = run(["node", "-e", "require('@anthropic-ai/sdk'); console.log('OK')"], cwd=BACKEND)
    if r.returncode == 0:
        print("    ✓ SDK 正常")
    else:
        print(f"    ⚠ SDK 问题: {r.stderr[-100:]}")
    print()

    # 启动后端
    print("[4/5] 启动后端...")
    blog = open(f"{PROJECT}/backend.log", "w")
    bproc = subprocess.Popen(
        ["node", "src/index.js"],
        cwd=BACKEND,
        stdout=blog,
        stderr=subprocess.STDOUT
    )
    print(f"    后端 PID: {bproc.pid}")

    print("    等待后端启动...")
    be_ok = False
    for i in range(10):
        time.sleep(1)
        if check_port(3000):
            print("    ✓ 后端启动成功 (localhost:3000)")
            be_ok = True
            break
        elif i % 3 == 2:
            print(f"    等待... {i+1}s")
    if not be_ok:
        print("    ✗ 后端启动失败")
        blog.seek(0)
        print("    错误:", blog.read()[-500:])
        blog.close()
        return
    blog.close()
    print()

    # 启动前端
    print("[5/5] 启动前端...")
    flog = open(f"{PROJECT}/frontend.log", "w")
    fproc = subprocess.Popen(
        ["node", "node_modules/.bin/vite", "--port", "5173", "--host", "--no-open"],
        cwd=FRONTEND,
        stdout=flog,
        stderr=subprocess.STDOUT
    )
    print(f"    前端 PID: {fproc.pid}")

    print("    等待前端启动...")
    fe_ok = False
    for i in range(10):
        time.sleep(1)
        if check_port(5173):
            print("    ✓ 前端启动成功 (localhost:5173)")
            fe_ok = True
            break
        elif i % 3 == 2:
            print(f"    等待... {i+1}s")
    if not fe_ok:
        print("    ⚠ 前端可能启动失败")
    flog.close()
    print()

    # 最终验证
    print("=" * 60)
    if check_port(3000) and check_port(5173):
        print("  ✅ 招聘管理系统启动成功！")
        print("=" * 60)
        print()
        print("  📍 访问地址: http://localhost:5173")
        print()
        print("  👤 默认账号:")
        print("     管理员: admin / admin123")
        print("     HR专员: hr01 / hr123456")
        print("     面试官: mgr01 / interview123")
        print()
        print("  📝 日志:")
        print(f"     后端: {PROJECT}/backend.log")
        print(f"     前端: {PROJECT}/frontend.log")
        print()
        print("  ⚠️  AI功能配置:")
        print("     编辑 backend/.env")
        print("     填入: ANTHROPIC_API_KEY=sk-ant-xxx")
        print()
        print("  停止服务:")
        print("     pkill -f 'node.*index.js' && pkill -f vite")
        print()
    else:
        print("  ⚠️  服务未完全启动")
        print("=" * 60)
        if not check_port(3000):
            print("  后端未启动，查看日志:")
            try:
                with open(f"{PROJECT}/backend.log") as f:
                    print("  ", f.read()[-400:])
            except: pass
        if not check_port(5173):
            print("  前端未启动，查看日志:")
            try:
                with open(f"{PROJECT}/frontend.log") as f:
                    print("  ", f.read()[-400:])
            except: pass
        print()

if __name__ == "__main__":
    main()
