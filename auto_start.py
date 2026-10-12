#!/usr/bin/env python3
"""招聘管理系统 - 完整启动脚本"""
import subprocess
import os
import time
import socket

PROJECT = "/Users/me/Projects/recruitment-system"
BACKEND = os.path.join(PROJECT, "backend")
FRONTEND = os.path.join(PROJECT, "frontend")

def run(cmd, cwd=None, timeout=300, quiet=False):
    if not quiet:
        print(f"  $ {' '.join(cmd)}")
    try:
        r = subprocess.run(cmd, cwd=cwd, capture_output=not quiet, text=True, timeout=timeout)
        if quiet or r.returncode != 0:
            out = r.stdout[-300:] if r.stdout else ""
            err = r.stderr[-300:] if r.stderr else ""
            if err:
                print(f"    err: {err}")
            if out:
                print(f"    out: {out}")
        return r.returncode == 0
    except subprocess.TimeoutExpired:
        print(f"    TIMEOUT after {timeout}s")
        return False
    except Exception as e:
        print(f"    ERROR: {e}")
        return False

def check_port(port):
    try:
        s = socket.socket()
        s.settimeout(2)
        ok = s.connect_ex(('localhost', port)) == 0
        s.close()
        return ok
    except:
        return False

def main():
    print("=" * 55)
    print("  招聘管理系统 - 一键启动")
    print("=" * 55)
    print()

    # 1. MongoDB
    print("[1/5] 检查 MongoDB...")
    r = subprocess.run(["docker", "ps", "--format", "{{.Names}}"], capture_output=True, text=True)
    if "recruitment-mongo" in r.stdout:
        print("    ✓ MongoDB 运行中")
    else:
        print("    启动 MongoDB...")
        subprocess.run(["docker", "run", "-d", "-p", "27017:27017", "--name", "recruitment-mongo", "mongo:7"], capture_output=True)
        time.sleep(4)
        print("    ✓ MongoDB 已启动")
    print()

    # 2. 后端依赖
    print("[2/5] 安装后端依赖...")
    nm = os.path.join(BACKEND, "node_modules")
    need_install = True
    if os.path.exists(nm):
        count = len([f for f in os.listdir(nm) if not f.startswith('.')])
        if count > 50:
            print(f"    ✓ 后端依赖已安装 ({count} 个)")
            need_install = False
    if need_install:
        print("    首次安装，需要几分钟...")
        run(["npm", "install"], cwd=BACKEND, timeout=300)
        if not os.path.exists(nm) or len([f for f in os.listdir(nm) if not f.startswith('.')]) < 50:
            print("    ✗ 安装失败")
            return
        print("    ✓ 安装完成")
    print()

    # 3. 初始化数据库
    print("[3/5] 初始化数据库...")
    run(["node", "src/seed.js"], cwd=BACKEND, timeout=30)
    print("    ✓ 完成")
    print()

    # 4. 前端依赖
    print("[4/5] 检查前端依赖...")
    nm = os.path.join(FRONTEND, "node_modules")
    need_install = True
    if os.path.exists(nm):
        count = len([f for f in os.listdir(nm) if not f.startswith('.')])
        if count > 50:
            print(f"    ✓ 前端依赖已安装 ({count} 个)")
            need_install = False
    if need_install:
        print("    安装中...")
        run(["npm", "install"], cwd=FRONTEND, timeout=300)
        print("    ✓ 完成")
    print()

    # 5. 启动服务
    print("[5/5] 启动服务...")
    subprocess.run(["pkill", "-f", "vite"], capture_output=True)
    subprocess.run(["pkill", "-f", "nodemon"], capture_output=True)
    time.sleep(2)

    print("    启动后端...")
    subprocess.Popen(["npm", "run", "dev"], cwd=BACKEND,
        stdout=open("/tmp/recruitment-backend.log", "w"), stderr=subprocess.STDOUT)

    print("    启动前端...")
    subprocess.Popen(["npm", "run", "dev"], cwd=FRONTEND,
        stdout=open("/tmp/recruitment-frontend.log", "w"), stderr=subprocess.STDOUT)

    print("    等待服务就绪...")
    for i in range(20):
        time.sleep(1)
        be = check_port(3000)
        fe = check_port(5173)
        if be and fe:
            print(f"    ✓ 全部就绪 ({i+1}s)")
            break
        elif i % 4 == 3:
            print(f"    等待... {i+1}s")
    else:
        print("    ⚠ 等待超时")

    # 最终检查
    print()
    ok = True
    for port, name in [(3000, "后端"), (5173, "前端")]:
        if check_port(port):
            print(f"    ✓ {name} (localhost:{port}) 运行中")
        else:
            print(f"    ✗ {name} (localhost:{port}) 未就绪")
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
        print("  📝 日志:")
        print("     后端: /tmp/recruitment-backend.log")
        print("     前端: /tmp/recruitment-frontend.log")
        print()
        print("  ⚠️  AI功能配置:")
        print("     编辑 backend/.env 填入 ANTHROPIC_API_KEY")
        print()
    else:
        print("=" * 55)
        print("  ⚠️  请查看日志排查问题")
        print("=" * 55)
        print("  tail -20 /tmp/recruitment-backend.log")
        print("  tail -20 /tmp/recruitment-frontend.log")
        print()

if __name__ == "__main__":
    main()
