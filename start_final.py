#!/usr/bin/env python3
"""招聘管理系统 - 完整启动脚本"""
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
    """执行命令"""
    try:
        r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout)
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
        ok = s.connect_ex(('127.0.0.1', port)) == 0
        s.close()
        return ok
    except:
        return False

def kill_proc(cmd_pattern):
    """杀掉匹配进程"""
    try:
        r = subprocess.run(['pgrep', '-f', cmd_pattern], capture_output=True, text=True)
        for pid in r.stdout.strip().split('\n'):
            if pid and pid.isdigit():
                try:
                    os.kill(int(pid), signal.SIGTERM)
                except:
                    pass
        time.sleep(1)
        # 强制杀掉
        r = subprocess.run(['pgrep', '-f', cmd_pattern], capture_output=True, text=True)
        for pid in r.stdout.strip().split('\n'):
            if pid and pid.isdigit():
                try:
                    os.kill(int(pid), signal.SIGKILL)
                except:
                    pass
    except:
        pass

def main():
    print("=" * 60)
    print("  招聘管理系统 - 启动")
    print("=" * 60)
    print()

    # 1. 清理旧进程
    print("[1/6] 清理旧进程...")
    kill_proc("recruitment")
    kill_proc("vite")
    kill_proc("nodemon")
    time.sleep(2)
    print("    ✓ 清理完成")
    print()

    # 2. 检查 MongoDB
    print("[2/6] 检查 MongoDB...")
    r = run(["docker", "ps", "--format", "{{.Names}}"])
    if "recruitment-mongo" in r.stdout:
        print("    ✓ MongoDB 运行中")
    else:
        print("    启动 MongoDB...")
        subprocess.run(["docker", "run", "-d", "-p", "27017:27017", "--name", "recruitment-mongo", "mongo:7"], capture_output=True)
        time.sleep(4)
        print("    ✓ MongoDB 已启动")
    print()

    # 3. 后端依赖
    print("[3/6] 检查后端依赖...")
    nm = f"{BACKEND}/node_modules"
    if os.path.exists(nm) and os.path.exists(f"{nm}/express/package.json"):
        count = len([x for x in os.listdir(nm) if not x.startswith('.')])
        print(f"    ✓ 后端依赖已安装 ({count} 个)")
    else:
        print("    安装后端依赖...")
        r = run(["npm", "install"], cwd=BACKEND, timeout=300)
        if os.path.exists(f"{nm}/express/package.json"):
            print("    ✓ 后端依赖安装完成")
        else:
            print("    ✗ 安装失败")
            print(f"    stderr: {r.stderr[-200:]}")
            return
    print()

    # 4. 前端依赖
    print("[4/6] 检查前端依赖...")
    nm = f"{FRONTEND}/node_modules"
    if os.path.exists(nm):
        count = len([x for x in os.listdir(nm) if not x.startswith('.')])
        print(f"    ✓ 前端依赖已安装 ({count} 个)")
    else:
        print("    安装前端依赖...")
        r = run(["npm", "install"], cwd=FRONTEND, timeout=300)
        print("    ✓ 前端依赖安装完成")
    print()

    # 5. 启动后端
    print("[5/6] 启动后端...")
    blog = open(f"{PROJECT}/backend.log", "w")
    bproc = subprocess.Popen(
        ["node", "src/index.js"],
        cwd=BACKEND,
        stdout=blog,
        stderr=subprocess.STDOUT
    )
    print(f"    后端 PID: {bproc.pid}")

    # 等待后端启动
    print("    等待后端启动...")
    for i in range(10):
        time.sleep(1)
        if check_port(3000):
            print("    ✓ 后端启动成功 (localhost:3000)")
            break
        elif i % 3 == 2:
            print(f"    等待... {i+1}s")
    else:
        print("    ✗ 后端启动超时")
        blog.seek(0)
        print("    日志:", blog.read()[-500:])
        blog.close()
        return
    blog.close()
    print()

    # 6. 启动前端
    print("[6/6] 启动前端...")
    flog = open(f"{PROJECT}/frontend.log", "w")
    fproc = subprocess.Popen(
        ["node", "node_modules/.bin/vite", "--port", "5173", "--host"],
        cwd=FRONTEND,
        stdout=flog,
        stderr=subprocess.STDOUT
    )
    print(f"    前端 PID: {fproc.pid}")

    # 等待前端启动
    print("    等待前端启动...")
    for i in range(10):
        time.sleep(1)
        if check_port(5173):
            print("    ✓ 前端启动成功 (localhost:5173)")
            break
        elif i % 3 == 2:
            print(f"    等待... {i+1}s")
    else:
        print("    ⚠ 前端启动超时，但进程可能在运行")
    flog.close()
    print()

    # 最终验证
    print("=" * 60)
    print("  最终验证")
    print("=" * 60)
    time.sleep(2)

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
        print(f"     后端: {PROJECT}/backend.log")
        print(f"     前端: {PROJECT}/frontend.log")
        print()
        print("  ⚠️  AI功能配置:")
        print("     编辑 backend/.env 填入 ANTHROPIC_API_KEY")
        print()
        print("  停止服务: pkill -f 'node.*recruitment' && pkill -f vite")
        print()
    else:
        print()
        print("=" * 60)
        print("  ⚠️  服务未完全启动，请查看日志")
        print("=" * 60)
        if not be_ok:
            print("  后端未启动，日志:", f"{PROJECT}/backend.log")
            with open(f"{PROJECT}/backend.log") as f:
                print("  ", f.read()[-300:])
        if not fe_ok:
            print("  前端未启动，日志:", f"{PROJECT}/frontend.log")
            with open(f"{PROJECT}/frontend.log") as f:
                print("  ", f.read()[-300:])
        print()

if __name__ == "__main__":
    main()
