#!/usr/bin/env python3
"""招聘管理系统 - 诊断和修复脚本"""
import subprocess
import time
import os
import sys
import urllib.request
import ssl
import json

PROJECT = "/Users/me/Projects/recruitment-system"
BACKEND = f"{PROJECT}/backend"
FRONTEND = f"{PROJECT}/frontend"

def run(cmd, cwd=None, timeout=30):
    """执行命令"""
    try:
        r = subprocess.run(cmd, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=timeout)
        return r
    except subprocess.TimeoutExpired:
        return type('obj', (object,), {'returncode': 1, 'stdout': '', 'stderr': 'TIMEOUT'})()
    except Exception as e:
        return type('obj', (object,), {'returncode': 1, 'stdout': '', 'stderr': str(e)})()

def check_port(port):
    """检查端口"""
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
    print("  招聘管理系统 - 诊断和修复")
    print("=" * 60)
    print()

    # 1. 检查MongoDB
    print("[1/5] 检查 MongoDB...")
    r = run(["docker", "ps", "--format", "{{.Names}}"])
    if "recruitment-mongo" in r.stdout:
        print("    ✓ MongoDB 运行中")
    else:
        print("    ✗ MongoDB 未运行")
        print("    启动 MongoDB...")
        run(["docker", "run", "-d", "-p", "27017:27017", "--name", "recruitment-mongo", "mongo:7"])
        time.sleep(3)
        print("    ✓ MongoDB 已启动")
    print()

    # 2. 检查后端依赖
    print("[2/5] 检查后端依赖...")
    openai_ok = os.path.exists(f"{BACKEND}/node_modules/openai/package.json")
    mongoose_ok = os.path.exists(f"{BACKEND}/node_modules/mongoose/package.json")
    multer_ok = os.path.exists(f"{BACKEND}/node_modules/multer/package.json")

    if openai_ok and mongoose_ok and multer_ok:
        print("    ✓ 后端依赖已安装")
    else:
        print("    ✗ 缺少依赖，正在安装...")
        r = run(["npm", "install"], cwd=BACKEND, timeout=300)
        if r.returncode == 0:
            print("    ✓ 依赖安装完成")
        else:
            print("    ✗ 依赖安装失败")
            return
    print()

    # 3. 检查上传目录
    print("[3/5] 检查上传目录...")
    upload_dirs = [
        f"{BACKEND}/uploads/resumes",
        f"{BACKEND}/uploads/offers",
        f"{BACKEND}/uploads/certificates",
        f"{BACKEND}/uploads/avatars"
    ]
    for d in upload_dirs:
        if not os.path.exists(d):
            os.makedirs(d, exist_ok=True)
            print(f"    创建目录: {d}")
    print("    ✓ 上传目录就绪")
    print()

    # 4. 重启后端
    print("[4/5] 重启后端服务...")
    # 杀掉旧进程
    run(["pkill", "-f", "node.*index.js"], capture_output=True)
    time.sleep(2)

    # 启动新进程
    backend_log = open(f"{PROJECT}/backend.log", "w")
    backend_proc = subprocess.Popen(
        ["node", "src/index.js"],
        cwd=BACKEND,
        stdout=backend_log,
        stderr=subprocess.STDOUT
    )
    print(f"    后端 PID: {backend_proc.pid}")

    # 等待启动
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
        backend_log.seek(0)
        print("    日志:", backend_log.read()[-500:])
        backend_log.close()
        return
    backend_log.close()
    print()

    # 5. 重启前端
    print("[5/5] 重启前端服务...")
    run(["pkill", "-f", "vite"], capture_output=True)
    time.sleep(2)

    frontend_log = open(f"{PROJECT}/frontend.log", "w")
    frontend_proc = subprocess.Popen(
        ["npx", "vite", "--port", "5173", "--host"],
        cwd=FRONTEND,
        stdout=frontend_log,
        stderr=subprocess.STDOUT
    )
    print(f"    前端 PID: {frontend_proc.pid}")

    print("    等待前端启动...")
    for i in range(10):
        time.sleep(1)
        if check_port(5173):
            print("    ✓ 前端启动成功 (localhost:5173)")
            break
        elif i % 3 == 2:
            print(f"    等待... {i+1}s")
    frontend_log.close()
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
        print("  ✅ 系统启动成功！")
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
        print("     编辑 backend/.env 填入你的 API Key")
        print()
    else:
        print()
        print("  ⚠️  部分服务未启动")
        if not be_ok:
            print("  后端未启动，查看日志:", f"{PROJECT}/backend.log")
        if not fe_ok:
            print("  前端未启动，查看日志:", f"{PROJECT}/frontend.log")
        print()

if __name__ == "__main__":
    main()
