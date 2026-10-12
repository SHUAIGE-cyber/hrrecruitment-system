#!/usr/bin/env python3
"""招聘管理系统 - 完整修复启动脚本"""
import subprocess
import os
import time
import socket
import signal
import sys

PROJECT = "/Users/me/Projects/recruitment-system"
BACKEND = os.path.join(PROJECT, "backend")
FRONTEND = os.path.join(PROJECT, "frontend")

# 存储进程
backend_proc = None
frontend_proc = None

def run(cmd, cwd=None, timeout=300, capture=True):
    """执行命令"""
    try:
        r = subprocess.run(cmd, cwd=cwd, capture_output=capture, text=True, timeout=timeout)
        return r
    except subprocess.TimeoutExpired:
        return type('obj', (object,), {'returncode': 1, 'stdout': '', 'stderr': 'TIMEOUT'})()
    except Exception as e:
        return type('obj', (object,), {'returncode': 1, 'stdout': '', 'stderr': str(e)})()

def check_port(port, timeout=2):
    """检查端口是否监听"""
    try:
        s = socket.socket()
        s.settimeout(timeout)
        result = s.connect_ex(('127.0.0.1', port))
        s.close()
        return result == 0
    except:
        return False

def kill_process_by_port(port):
    """杀掉占用端口的进程"""
    try:
        # macOS
        r = subprocess.run(['lsof', '-ti', f':{port}'], capture_output=True, text=True)
        pids = r.stdout.strip().split('\n')
        for pid in pids:
            if pid and pid.isdigit():
                os.kill(int(pid), signal.SIGTERM)
                time.sleep(0.5)
    except:
        pass

def main():
    global backend_proc, frontend_proc

    print("=" * 60)
    print("  招聘管理系统 - 修复启动")
    print("=" * 60)
    print()

    # 0. 清理旧进程
    print("[0/6] 清理旧进程...")
    kill_process_by_port(3000)
    kill_process_by_port(5173)
    time.sleep(2)
    print("    ✓ 清理完成")
    print()

    # 1. MongoDB
    print("[1/6] 检查 MongoDB...")
    r = subprocess.run(["docker", "ps", "--format", "{{.Names}}"], capture_output=True, text=True)
    if "recruitment-mongo" in r.stdout:
        print("    ✓ MongoDB 运行中")
    else:
        print("    启动 MongoDB...")
        subprocess.run(["docker", "run", "-d", "-p", "27017:27017", "--name", "recruitment-mongo", "mongo:7"], capture_output=True)
        time.sleep(4)
        if "recruitment-mongo" in subprocess.run(["docker", "ps", "--format", "{{.Names}}"], capture_output=True, text=True).stdout:
            print("    ✓ MongoDB 已启动")
        else:
            print("    ✗ MongoDB 启动失败")
            return
    print()

    # 2. 后端依赖
    print("[2/6] 检查后端依赖...")
    nm = os.path.join(BACKEND, "node_modules")
    need_install = True
    if os.path.exists(nm):
        count = len([f for f in os.listdir(nm) if not f.startswith('.')])
        if count > 50 and os.path.exists(os.path.join(nm, 'express', 'package.json')):
            print(f"    ✓ 后端依赖就绪 ({count} 个包)")
            need_install = False
    if need_install:
        print("    安装中...")
        r = run(["npm", "install"], cwd=BACKEND, timeout=300)
        if r.returncode == 0 and os.path.exists(os.path.join(nm, 'express', 'package.json')):
            print("    ✓ 后端依赖安装完成")
        else:
            print("    ✗ 后端依赖安装失败")
            print(f"    stdout: {r.stdout[-200:]}")
            print(f"    stderr: {r.stderr[-200:]}")
            return
    print()

    # 3. 初始化数据库
    print("[3/6] 初始化数据库...")
    r = run(["node", "src/seed.js"], cwd=BACKEND, timeout=30)
    if r.returncode == 0:
        print("    ✓ 数据库初始化完成")
    else:
        print(f"    ⚠ 初始化警告: {r.stderr[-100:]}")
    print()

    # 4. 前端依赖
    print("[4/6] 检查前端依赖...")
    nm = os.path.join(FRONTEND, "node_modules")
    need_install = True
    if os.path.exists(nm):
        count = len([f for f in os.listdir(nm) if not f.startswith('.')])
        if count > 50:
            print(f"    ✓ 前端依赖就绪 ({count} 个包)")
            need_install = False
    if need_install:
        print("    安装中...")
        r = run(["npm", "install"], cwd=FRONTEND, timeout=300)
        if r.returncode == 0:
            print("    ✓ 前端依赖安装完成")
        else:
            print("    ✗ 前端依赖安装失败")
    print()

    # 5. 启动后端
    print("[5/6] 启动后端...")
    log_file = open(os.path.join(PROJECT, "backend.log"), "w")
    backend_proc = subprocess.Popen(
        ["node", "src/index.js"],
        cwd=BACKEND,
        stdout=log_file,
        stderr=subprocess.STDOUT
    )
    print(f"    后端 PID: {backend_proc.pid}")
    time.sleep(5)

    if check_port(3000):
        print("    ✓ 后端启动成功 (localhost:3000)")
    else:
        print("    ✗ 后端启动失败")
        log_file.seek(0)
        print("    日志:", log_file.read()[-500:])
        log_file.close()
        return
    print()

    # 6. 启动前端
    print("[6/6] 启动前端...")
    log_file = open(os.path.join(PROJECT, "frontend.log"), "w")
    frontend_proc = subprocess.Popen(
        ["node", "node_modules/.bin/vite", "--port", "5173"],
        cwd=FRONTEND,
        stdout=log_file,
        stderr=subprocess.STDOUT
    )
    print(f"    前端 PID: {frontend_proc.pid}")
    time.sleep(5)

    if check_port(5173):
        print("    ✓ 前端启动成功 (localhost:5173)")
    else:
        print("    ✗ 前端启动失败")
        log_file.seek(0)
        print("    日志:", log_file.read()[-500:])
        log_file.close()
        return
    print()

    # 最终验证
    print("=" * 60)
    print("  最终验证...")
    print("=" * 60)
    time.sleep(3)

    be_ok = check_port(3000)
    fe_ok = check_port(5173)

    if be_ok and fe_ok:
        print()
        print("=" * 60)
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
        print("  📝 日志文件:")
        print(f"     后端: {os.path.join(PROJECT, 'backend.log')}")
        print(f"     前端: {os.path.join(PROJECT, 'frontend.log')}")
        print()
        print("  ⚠️  AI功能配置:")
        print("     编辑 /Users/me/Projects/recruitment-system/backend/.env")
        print("     填入: ANTHROPIC_API_KEY=sk-ant-xxx")
        print()
        print("  停止服务: pkill -f 'node.*index.js' && pkill -f vite")
        print()
    else:
        print()
        print("=" * 60)
        print("  ⚠️  部分服务未就绪")
        print("=" * 60)
        if not be_ok:
            print("  后端未启动，查看日志:", os.path.join(PROJECT, "backend.log"))
        if not fe_ok:
            print("  前端未启动，查看日志:", os.path.join(PROJECT, "frontend.log"))
        print()

if __name__ == "__main__":
    main()
