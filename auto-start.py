#!/usr/bin/env python3
"""招聘管理系统 - 一键安装启动脚本"""
import subprocess
import os
import time
import socket
import sys

PROJECT = "/Users/me/Projects/recruitment-system"
BACKEND = os.path.join(PROJECT, "backend")
FRONTEND = os.path.join(PROJECT, "frontend")

def run(cmd, cwd=None, timeout=300, silent=False):
    """执行命令"""
    if not silent:
        print(f"  执行: {' '.join(cmd)}")
    try:
        result = subprocess.run(
            cmd, cwd=cwd,
            capture_output=not silent,
            text=True, timeout=timeout
        )
        if not silent:
            if result.stdout:
                print(result.stdout[-300:])
            if result.stderr and result.returncode != 0:
                print(f"  错误: {result.stderr[-200:]}")
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        print(f"  超时 ({timeout}s)")
        return False
    except Exception as e:
        print(f"  异常: {e}")
        return False

def check_port(port):
    """检查端口是否监听"""
    try:
        s = socket.socket()
        s.settimeout(3)
        result = s.connect_ex(('localhost', port))
        s.close()
        return result == 0
    except:
        return False

def check_mongo():
    """检查 MongoDB"""
    r = subprocess.run(
        ["docker", "ps", "--format", "{{.Names}}"],
        capture_output=True, text=True
    )
    return "recruitment-mongo" in r.stdout

def main():
    print("=" * 55)
    print("  招聘管理系统 - 安装启动脚本")
    print("=" * 55)
    print()

    # 1. MongoDB
    print("[1/5] 检查 MongoDB...")
    if check_mongo():
        print("    ✓ MongoDB 运行中")
    else:
        print("    启动 MongoDB...")
        subprocess.run(
            ["docker", "run", "-d", "-p", "27017:27017",
             "--name", "recruitment-mongo", "mongo:7"],
            capture_output=True
        )
        time.sleep(4)
        if check_mongo():
            print("    ✓ MongoDB 已启动")
        else:
            print("    ✗ MongoDB 启动失败")
            return
    print()

    # 2. 后端依赖
    print("[2/5] 安装后端依赖...")
    nm = os.path.join(BACKEND, "node_modules")
    if os.path.exists(nm):
        count = len([f for f in os.listdir(nm) if not f.startswith('.')])
        if count > 50:
            print(f"    ✓ 后端依赖已安装 ({count} 个包)")
        else:
            print(f"    依赖不足 ({count} 个)，重新安装...")
            run(["npm", "install"], cwd=BACKEND, timeout=300)
    else:
        print("    安装后端依赖 (首次安装，需要几分钟)...")
        run(["npm", "install"], cwd=BACKEND, timeout=300)

    if not os.path.exists(nm) or len([f for f in os.listdir(nm) if not f.startswith('.')]) < 50:
        print("    ✗ 后端依赖安装失败")
        return
    print("    ✓ 后端依赖安装完成")
    print()

    # 3. 初始化数据库
    print("[3/5] 初始化数据库...")
    run(["node", "src/seed.js"], cwd=BACKEND, timeout=30, silent=False)
    print("    ✓ 数据库初始化完成")
    print()

    # 4. 前端依赖
    print("[4/5] 检查前端依赖...")
    nm = os.path.join(FRONTEND, "node_modules")
    if os.path.exists(nm):
        count = len([f for f in os.listdir(nm) if not f.startswith('.')])
        if count > 50:
            print(f"    ✓ 前端依赖已安装 ({count} 个包)")
        else:
            print(f"    依赖不足 ({count} 个)，重新安装...")
            run(["npm", "install"], cwd=FRONTEND, timeout=300)
    else:
        print("    安装前端依赖...")
        run(["npm", "install"], cwd=FRONTEND, timeout=300)
    print()

    # 5. 启动服务
    print("[5/5] 启动服务...")

    # 杀掉旧进程
    subprocess.run(["pkill", "-f", "vite"], capture_output=True)
    subprocess.run(["pkill", "-f", "nodemon"], capture_output=True)
    time.sleep(2)

    # 启动后端
    print("    启动后端服务...")
    backend_log = open("/tmp/recruitment-backend.log", "w")
    backend_proc = subprocess.Popen(
        ["npm", "run", "dev"], cwd=BACKEND,
        stdout=backend_log, stderr=subprocess.STDOUT
    )
    print(f"    后端 PID: {backend_proc.pid}")

    # 启动前端
    print("    启动前端服务...")
    frontend_log = open("/tmp/recruitment-frontend.log", "w")
    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev"], cwd=FRONTEND,
        stdout=frontend_log, stderr=subprocess.STDOUT
    )
    print(f"    前端 PID: {frontend_proc.pid}")

    # 等待服务就绪
    print()
    print("    等待服务启动...")
    for i in range(15):
        time.sleep(1)
        be_ok = check_port(3000)
        fe_ok = check_port(5173)
        if be_ok and fe_ok:
            print(f"    ✓ 全部就绪 (等待 {i+1}s)")
            break
        elif i % 3 == 2:
            print(f"    等待... ({i+1}s)")
    else:
        print("    ⚠ 等待超时，请查看日志")

    # 最终检查
    print()
    ok = True
    for port, name in [(3000, "后端"), (5173, "前端")]:
        if check_port(port):
            print(f"    ✓ {name} (localhost:{port}) 运行中")
        else:
            print(f"    ✗ {name} (localhost:{port}) 未启动")
            ok = False
    print()

    if ok:
        print("=" * 55)
        print("  ✅ 启动成功！")
        print("=" * 55)
        print()
        print("  📍 访问地址: http://localhost:5173")
        print()
        print("  👤 默认账号:")
        print("     管理员: admin / admin123")
        print("     HR专员: hr01 / hr123456")
        print("     面试官: mgr01 / interview123")
        print()
        print("  📝 日志文件:")
        print("     后端: /tmp/recruitment-backend.log")
        print("     前端: /tmp/recruitment-frontend.log")
        print()
        print("  🔍 查看日志:")
        print("     tail -f /tmp/recruitment-backend.log")
        print("     tail -f /tmp/recruitment-frontend.log")
        print()
        print("  ⚠️  AI功能:")
        print("     编辑 /Users/me/Projects/recruitment-system/backend/.env")
        print("     填入: ANTHROPIC_API_KEY=sk-ant-xxx")
        print()
        print("  停止服务: pkill -f 'node.*recruitment'")
        print()
    else:
        print("=" * 55)
        print("  ⚠️  服务启动有问题，请查看日志")
        print("=" * 55)
        print()
        print("  查看后端日志:")
        print("    tail -20 /tmp/recruitment-backend.log")
        print()
        print("  查看前端日志:")
        print("    tail -20 /tmp/recruitment-frontend.log")
        print()

if __name__ == "__main__":
    main()
