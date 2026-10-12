#!/usr/bin/env python3
"""招聘管理系统 - 完整修复启动脚本"""
import subprocess
import time
import os
import signal
import socket
import sys
import shutil

PROJECT = "/Users/me/Projects/recruitment-system"
BACKEND = f"{PROJECT}/backend"
FRONTEND = f"{PROJECT}/frontend"

def run_cmd(cmd, cwd=None, timeout=300, capture=True):
    """执行命令"""
    try:
        result = subprocess.run(
            cmd, cwd=cwd,
            capture_output=capture,
            text=True,
            timeout=timeout
        )
        return result
    except subprocess.TimeoutExpired:
        return type('obj', (object,), {
            'returncode': 1, 'stdout': '', 'stderr': 'TIMEOUT'
        })()
    except Exception as e:
        return type('obj', (object,), {
            'returncode': 1, 'stdout': '', 'stderr': str(e)
        })()

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

def kill_proc_tree(sig=signal.SIGTERM):
    """杀掉所有相关进程"""
    patterns = ['recruitment', 'vite', 'nodemon', 'esbuild']
    for pattern in patterns:
        try:
            r = subprocess.run(
                ['pkill', '-f', pattern],
                capture_output=True
            )
        except:
            pass
    time.sleep(2)
    # 强制杀掉
    for pattern in patterns:
        try:
            r = subprocess.run(
                ['pkill', '-9', '-f', pattern],
                capture_output=True
            )
        except:
            pass
    time.sleep(1)

def main():
    print("=" * 60)
    print("  招聘管理系统 - 完整修复启动")
    print("=" * 60)
    print()

    # 0. 清理环境
    print("[0/7] 清理环境...")
    kill_proc_tree()
    # 创建必要目录
    os.makedirs(f"{BACKEND}/uploads/resumes", exist_ok=True)
    os.makedirs(f"{BACKEND}/uploads/offers", exist_ok=True)
    os.makedirs(f"{BACKEND}/uploads/certificates", exist_ok=True)
    os.makedirs(f"{PROJECT}/uploads", exist_ok=True)
    print("    ✓ 清理完成")
    print()

    # 1. 检查 MongoDB
    print("[1/7] 检查 MongoDB...")
    r = run_cmd(["docker", "ps", "--format", "{{.Names}}"])
    if "recruitment-mongo" in r.stdout:
        print("    ✓ MongoDB 运行中")
    else:
        print("    启动 MongoDB...")
        subprocess.run(
            ["docker", "run", "-d", "-p", "27017:27017",
             "--name", "recruitment-mongo", "mongo:7"],
            capture_output=True
        )
        time.sleep(4)
        r = run_cmd(["docker", "ps", "--format", "{{.Names}}"])
        if "recruitment-mongo" in r.stdout:
            print("    ✓ MongoDB 已启动")
        else:
            print("    ✗ MongoDB 启动失败")
            return
    print()

    # 2. 安装后端依赖
    print("[2/7] 检查后端依赖...")
    nm = f"{BACKEND}/node_modules"
    need_install = True
    if os.path.exists(nm):
        files = [f for f in os.listdir(nm) if not f.startswith('.')]
        if len(files) > 50 and os.path.exists(f"{nm}/express/package.json"):
            print(f"    ✓ 后端依赖已安装 ({len(files)} 个)")
            need_install = False
    if need_install:
        print("    安装后端依赖 (首次需要几分钟)...")
        r = run_cmd(["npm", "install"], cwd=BACKEND, timeout=300)
        if os.path.exists(f"{nm}/express/package.json"):
            print("    ✓ 后端依赖安装完成")
        else:
            print("    ✗ 安装失败")
            print(f"    错误: {r.stderr[-300:]}")
            return
    print()

    # 3. 安装前端依赖
    print("[3/7] 检查前端依赖...")
    nm = f"{FRONTEND}/node_modules"
    need_install = True
    if os.path.exists(nm):
        files = [f for f in os.listdir(nm) if not f.startswith('.')]
        if len(files) > 50:
            print(f"    ✓ 前端依赖已安装 ({len(files)} 个)")
            need_install = False
    if need_install:
        print("    安装前端依赖...")
        r = run_cmd(["npm", "install"], cwd=FRONTEND, timeout=300)
        if r.returncode == 0:
            print("    ✓ 前端依赖安装完成")
        else:
            print("    ⚠ 安装可能有警告")
    print()

    # 4. 初始化数据库
    print("[4/7] 初始化数据库...")
    r = run_cmd(["node", "src/seed.js"], cwd=BACKEND, timeout=30)
    if r.returncode == 0:
        print("    ✓ 数据库初始化完成")
    else:
        print(f"    ⚠ 警告: {r.stderr[-100:]}")
    print()

    # 5. 启动后端
    print("[5/7] 启动后端...")
    backend_log = open(f"{PROJECT}/backend.log", "w")
    backend_proc = subprocess.Popen(
        ["node", "src/index.js"],
        cwd=BACKEND,
        stdout=backend_log,
        stderr=subprocess.STDOUT
    )
    print(f"    后端 PID: {backend_proc.pid}")

    # 等待后端启动
    print("    等待后端启动...")
    be_started = False
    for i in range(15):
        time.sleep(1)
        if check_port(3000):
            print("    ✓ 后端启动成功 (localhost:3000)")
            be_started = True
            break
        elif i % 3 == 2:
            print(f"    等待... {i+1}s")
    if not be_started:
        print("    ✗ 后端启动超时")
        backend_log.seek(0)
        print("    日志:", backend_log.read()[-500:])
        backend_log.close()
        return
    backend_log.close()
    print()

    # 6. 启动前端
    print("[6/7] 启动前端...")
    frontend_log = open(f"{PROJECT}/frontend.log", "w")
    frontend_proc = subprocess.Popen(
        ["node", "node_modules/.bin/vite", "--port", "5173", "--host", "--no-open"],
        cwd=FRONTEND,
        stdout=frontend_log,
        stderr=subprocess.STDOUT
    )
    print(f"    前端 PID: {frontend_proc.pid}")

    # 等待前端启动
    print("    等待前端启动...")
    fe_started = False
    for i in range(15):
        time.sleep(1)
        if check_port(5173):
            print("    ✓ 前端启动成功 (localhost:5173)")
            fe_started = True
            break
        elif i % 3 == 2:
            print(f"    等待... {i+1}s")
    if not fe_started:
        print("    ⚠ 前端启动超时")
    frontend_log.close()
    print()

    # 7. 最终验证
    print("[7/7] 最终验证...")
    time.sleep(2)

    be_ok = check_port(3000)
    fe_ok = check_port(5173)

    print()
    print("=" * 60)
    if be_ok and fe_ok:
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
        print("  📊 查看日志:")
        print(f"     tail -f {PROJECT}/backend.log")
        print(f"     tail -f {PROJECT}/frontend.log")
        print()
        print("  ⚠️  AI功能配置:")
        print("     编辑 backend/.env 填入你的 ANTHROPIC_API_KEY")
        print()
        print("  停止服务:")
        print("     pkill -f 'node.*index.js' && pkill -f vite")
        print()
    else:
        print("  ⚠️  服务启动有问题")
        print("=" * 60)
        if not be_ok:
            print("  后端未启动，查看日志:")
            with open(f"{PROJECT}/backend.log") as f:
                print("  ", f.read()[-400:])
        if not fe_ok:
            print("  前端未启动，查看日志:")
            with open(f"{PROJECT}/frontend.log") as f:
                print("  ", f.read()[-400:])
        print()

if __name__ == "__main__":
    main()
