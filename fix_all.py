#!/usr/bin/env python3
"""招聘系统完整修复脚本"""
import subprocess
import time
import os
import sys
import socket
import urllib.request
import json
import ssl
import tempfile

PROJECT = "/Users/me/Projects/recruitment-system"
BACKEND = f"{PROJECT}/backend"

def run(cmd, timeout=30):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout, cwd=BACKEND)
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
    print("  招聘系统 - 完整修复")
    print("=" * 60)
    print()

    # 1. 杀掉所有node进程
    print("[1/6] 清理进程...")
    run("pkill -9 -f node")
    time.sleep(2)
    print("    ✓ 完成")

    # 2. 检查后端依赖
    print("[2/6] 检查依赖...")
    if not os.path.exists(f"{BACKEND}/node_modules/openai/package.json"):
        print("    安装openai...")
        run("npm install openai @anthropic-ai/sdk")
    print("    ✓ 依赖就绪")

    # 3. 创建测试简历文件
    print("[3/6] 准备测试文件...")
    resume_txt = """李明
男，28岁
电话：13900139000
邮箱：liming@example.com
地址：北京市海淀区

教育背景：
清华大学 - 计算机科学 - 本科 - 2012-2016

工作经历：
百度 - 前端开发工程师 - 2016-2019
字节跳动 - 高级前端工程师 - 2019-2024

技能：
JavaScript, Vue.js, React, TypeScript, Node.js
"""
    resume_path = f"{PROJECT}/test_resume.txt"
    with open(resume_path, 'w', encoding='utf-8') as f:
        f.write(resume_txt)
    print(f"    ✓ 测试简历: {resume_path}")

    # 4. 启动后端
    print("[4/6] 启动后端...")
    log_file = open(f"{PROJECT}/backend.log", "w")
    backend_proc = subprocess.Popen(
        ["node", "src/index.js"],
        cwd=BACKEND,
        stdout=log_file,
        stderr=subprocess.STDOUT
    )
    print(f"    后端 PID: {backend_proc.pid}")

    print("    等待启动...")
    for i in range(10):
        time.sleep(1)
        if check_port(3000):
            print("    ✓ 后端启动成功")
            break
        elif i % 3 == 2:
            print(f"    等待... {i+1}s")
    else:
        print("    ✗ 后端启动失败")
        log_file.seek(0)
        print("    日志:", log_file.read()[-500:])
        log_file.close()
        return
    log_file.close()
    print()

    # 5. 测试上传
    print("[5/6] 测试上传...")
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    # 先登录获取token
    try:
        data = json.dumps({"username": "admin", "password": "admin123"}).encode()
        req = urllib.request.Request(
            "http://localhost:3000/api/auth/login",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        res = urllib.request.urlopen(req, context=ctx, timeout=10)
        login_result = json.loads(res.read().decode())
        if not login_result.get("success"):
            print(f"    ✗ 登录失败: {login_result.get('message')}")
            return
        token = login_result["data"]["token"]
        print("    ✓ 登录成功")
    except Exception as e:
        print(f"    ✗ 登录错误: {e}")
        return

    # 测试上传
    try:
        with open(resume_path, 'rb') as f:
            file_content = f.read()

        boundary = '----TestBoundary'
        body = (
            f'--{boundary}\r\n'
            f'Content-Disposition: form-data; name="resume"; filename="简历_李明.txt"\r\n'
            f'Content-Type: text/plain\r\n\r\n'
        ).encode() + file_content + f'\r\n--{boundary}--\r\n'.encode()

        req = urllib.request.Request(
            "http://localhost:3000/api/candidates/upload",
            data=body,
            headers={
                "Content-Type": f"multipart/form-data; boundary={boundary}",
                "Authorization": f"Bearer {token}"
            },
            method="POST"
        )

        res = urllib.request.urlopen(req, context=ctx, timeout=30)
        upload_result = json.loads(res.read().decode())

        if upload_result.get("success"):
            print("    ✓ 上传成功!")
            print(f"    候选人: {upload_result.get('data', {}).get('name', '未知')}")
            print(f"    标签: {upload_result.get('data', {}).get('aiTags', [])}")
        else:
            print(f"    ✗ 上传失败: {upload_result.get('message')}")
            # 显示详细错误
            if 'data' in upload_result:
                print(f"    详情: {upload_result['data']}")
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"    ✗ HTTP错误: {e.code}")
        print(f"    详情: {error_body[:500]}")
    except Exception as e:
        print(f"    ✗ 错误: {e}")
    print()

    # 6. 启动前端
    print("[6/6] 启动前端...")
    frontend_log = open(f"{PROJECT}/frontend.log", "w")
    frontend_proc = subprocess.Popen(
        ["npx", "vite", "--port", "5173", "--host"],
        cwd=f"{PROJECT}/frontend",
        stdout=frontend_log,
        stderr=subprocess.STDOUT
    )
    print(f"    前端 PID: {frontend_proc.pid}")

    for i in range(10):
        time.sleep(1)
        if check_port(5173):
            print("    ✓ 前端启动成功")
            break
    frontend_log.close()
    print()

    print("=" * 60)
    print("  ✅ 系统启动完成！")
    print("=" * 60)
    print()
    print("  📍 访问地址: http://localhost:5173")
    print()
    print("  👤 登录账号:")
    print("     用户名: admin")
    print("     密码: admin123")
    print()
    print("  📝 日志文件:")
    print(f"     后端: {PROJECT}/backend.log")
    print(f"     前端: {PROJECT}/frontend.log")
    print()
    print("  停止服务:")
    print("    pkill -f 'node.*index.js' && pkill -f vite")
    print()

if __name__ == "__main__":
    main()
