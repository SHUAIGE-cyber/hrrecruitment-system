#!/usr/bin/env python3
"""招聘系统诊断脚本 - 修复版"""
import subprocess
import time
import os
import socket
import urllib.request
import json
import ssl
import tempfile

PROJECT = "/Users/me/Projects/recruitment-system"
BACKEND = f"{PROJECT}/backend"

def run(cmd, cwd=None, timeout=30):
    try:
        r = subprocess.run(cmd, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=timeout)
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
    print("  招聘系统诊断")
    print("=" * 60)
    print()

    # 1. 检查后端进程
    print("[1/5] 检查后端进程...")
    r = run(["ps", "aux"])
    if "node src/index.js" in r.stdout:
        print("    ✓ 后端进程存在")
    else:
        print("    ✗ 后端未运行")
        print("    正在启动...")
        backend_log = open(f"{PROJECT}/backend.log", "w")
        backend_proc = subprocess.Popen(
            ["node", "src/index.js"],
            cwd=BACKEND,
            stdout=backend_log,
            stderr=subprocess.STDOUT
        )
        print(f"    后端 PID: {backend_proc.pid}")
        time.sleep(4)
    print()

    # 2. 检查端口
    print("[2/5] 检查端口...")
    if check_port(3000):
        print("    ✓ 后端端口 3000 正常")
    else:
        print("    ✗ 后端端口 3000 未监听")
        print("    查看日志:")
        try:
            with open(f"{PROJECT}/backend.log") as f:
                print(f.read()[-500:])
        except:
            pass
        return
    print()

    # 3. 测试登录
    print("[3/5] 测试登录...")
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    try:
        data = json.dumps({"username": "admin", "password": "admin123"}).encode()
        req = urllib.request.Request(
            "http://localhost:3000/api/auth/login",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        res = urllib.request.urlopen(req, context=ctx, timeout=10)
        result = json.loads(res.read().decode())
        if result.get("success"):
            token = result["data"]["token"]
            print("    ✓ 登录成功")
        else:
            print(f"    ✗ 登录失败: {result.get('message')}")
            return
    except Exception as e:
        print(f"    ✗ 登录错误: {e}")
        return
    print()

    # 4. 测试上传 - 创建TXT文件测试
    print("[4/5] 测试上传...")

    # 创建一个模拟简历的TXT文件
    resume_content = """张伟
男，32岁
电话：13800138000
邮箱：zhangwei@example.com
地址：北京市朝阳区

教育背景：
北京大学 - 计算机科学 - 本科 - 2010-2014

工作经历：
阿里巴巴 - 前端工程师 - 2014-2018
腾讯 - 高级前端工程师 - 2018-2023

技能：
JavaScript, Vue.js, React, Node.js
"""

    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write(resume_content)
        temp_file = f.name

    try:
        with open(temp_file, 'rb') as f:
            file_content = f.read()

        boundary = '----DiagBoundary'
        body = (
            f'--{boundary}\r\n'
            f'Content-Disposition: form-data; name="resume"; filename="简历_张伟.txt"\r\n'
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
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"    ✗ HTTP错误: {e.code}")
        print(f"    详情: {error_body[:500]}")
    except Exception as e:
        print(f"    ✗ 错误: {e}")
    finally:
        os.unlink(temp_file)
    print()

    # 5. 查看后端日志
    print("[5/5] 后端日志...")
    try:
        with open(f"{PROJECT}/backend.log") as f:
            log = f.read()
        if log.strip():
            print("    " + "\n    ".join(log.split('\n')[-10:]))
        else:
            print("    (无日志)")
    except:
        print("    (无法读取日志)")
    print()

    print("=" * 60)
    print("  诊断完成")
    print("=" * 60)
    print()
    print("支持的简历格式:")
    print("  - PDF (.pdf)")
    print("  - 图片 (.jpg, .jpeg, .png)")
    print("  - Word (.doc, .docx)")
    print("  - 文本 (.txt)")

if __name__ == "__main__":
    main()
