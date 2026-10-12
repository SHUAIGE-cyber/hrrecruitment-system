#!/usr/bin/env python3
"""测试Agnes API是否可用"""
import urllib.request
import json
import ssl
import sys

def test_agnes_api():
    print("=== 测试 Agnes API ===\n")

    api_key = "sk-1ncNDb9ThP2djApo7vsIXl4VIy0EDigCVYM2l9d79KirHR2p"
    base_url = "https://api.agens.ai/v1"
    model = "agnes-2.5-flash"

    # 测试1: 简单聊天
    print("测试1: 简单聊天...")
    try:
        data = json.dumps({
            "model": model,
            "messages": [{"role": "user", "content": "你好，请回复OK"}],
            "max_tokens": 50
        }).encode()

        req = urllib.request.Request(
            f"{base_url}/chat/completions",
            data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            },
            method="POST"
        )

        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        res = urllib.request.urlopen(req, context=ctx, timeout=15)
        result = json.loads(res.read().decode())

        if "choices" in result and len(result["choices"]) > 0:
            print(f"✅ API正常响应: {result['choices'][0]['message']['content']}")
            return True
        else:
            print(f"❌ 响应格式异常: {result}")
            return False

    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"❌ HTTP错误: {e.code}")
        print(f"   错误详情: {error_body}")
        return False
    except urllib.error.URLError as e:
        print(f"❌ 网络错误: {e.reason}")
        return False
    except Exception as e:
        print(f"❌ 错误: {e}")
        return False

def test_backend_upload():
    print("\n=== 测试后端上传接口 ===\n")

    try:
        # 先登录获取token
        login_data = json.dumps({
            "username": "admin",
            "password": "admin123"
        }).encode()

        req = urllib.request.Request(
            "http://localhost:3000/api/auth/login",
            data=login_data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        res = urllib.request.urlopen(req, context=ctx, timeout=10)
        login_result = json.loads(res.read().decode())

        if not login_result.get("success"):
            print(f"❌ 登录失败: {login_result.get('message')}")
            return False

        token = login_result["data"]["token"]
        print(f"✅ 登录成功")

        # 测试上传（用一个空文件）
        import tempfile
        import os

        # 创建一个临时的package.json作为测试文件
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write('{"test": true}')
            temp_file = f.name

        try:
            # 读取文件
            with open(temp_file, 'rb') as f:
                file_content = f.read()

            # 构建multipart请求
            boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
            body = (
                f'--{boundary}\r\n'
                f'Content-Disposition: form-data; name="resume"; filename="test.json"\r\n'
                f'Content-Type: application/json\r\n\r\n'
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
                print(f"✅ 上传成功: {upload_result.get('message', 'OK')}")
                return True
            else:
                print(f"❌ 上传失败: {upload_result.get('message')}")
                return False

        finally:
            os.unlink(temp_file)

    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"❌ HTTP错误: {e.code}")
        print(f"   错误详情: {error_body[:500]}")
        return False
    except urllib.error.URLError as e:
        print(f"❌ 网络错误: {e.reason}")
        return False
    except Exception as e:
        print(f"❌ 错误: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("  Agnes API 和后端上传测试")
    print("=" * 60)
    print()

    # 测试API
    api_ok = test_agnes_api()

    # 测试后端
    backend_ok = test_backend_upload()

    print()
    print("=" * 60)
    if api_ok and backend_ok:
        print("  ✅ 所有测试通过!")
    elif api_ok:
        print("  ⚠️  API正常，但上传有问题")
    elif backend_ok:
        print("  ⚠️  上传正常，但API有问题")
    else:
        print("  ❌ 测试失败，请检查配置")
    print("=" * 60)
