#!/usr/bin/env python3
"""
HomeDock 开发服务器
支持 HTTP/HTTPS、热重载、API 代理和 CORS
"""

import http.server
import socketserver
import urllib.request
import urllib.error
import json
import random
import os
import sys
import argparse
import ssl
import threading
import webbrowser
from pathlib import Path

class DevServerHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=".", **kwargs)

    def end_headers(self):
        # 添加 CORS 头
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Max-Age', '86400')

        # 缓存控制
        if self.path.startswith('/api/'):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        else:
            self.send_header('Cache-Control', 'max-age=3600')

        # 安全头
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('X-XSS-Protection', '1; mode=block')

        super().end_headers()

    def do_OPTIONS(self):
        """处理预检请求"""
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        """处理 GET 请求"""
        if self.path.startswith('/api/config'):
            self.handle_config_api()
        elif self.path.startswith('/bing-wallpaper'):
            self.handle_bing_wallpaper()
        elif self.path == '/health':
            self.handle_health()
        else:
            # 添加调试信息
            print(f" Serving static file: {self.path}")
            super().do_GET()

    def do_POST(self):
        """处理 POST 请求"""
        if self.path.startswith('/api/config'):
            self.handle_config_save()
        else:
            self.send_error(404, "Not Found")

    def do_PUT(self):
        """处理 PUT 请求"""
        if self.path.startswith('/api/config'):
            self.handle_config_save()
        else:
            self.send_error(404, "Not Found")

    def handle_config_api(self):
        """处理配置 API"""
        try:
            # 尝试读取本地配置文件
            config_file = Path('apps-config.json')
            if config_file.exists():
                with open(config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps(config, ensure_ascii=False, indent=2).encode('utf-8'))
            else:
                # 返回默认配置
                default_config = {
                    "applications": [],
                    "background": {
                        "mode": "wallpaper",
                        "solidColor": "#202124",
                        "gradientFrom": "#141e30",
                        "gradientTo": "#243b55"
                    }
                }

                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps(default_config, ensure_ascii=False, indent=2).encode('utf-8'))

        except Exception as e:
            print(f"❌ Config API error: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = {"error": f"Config load failed: {str(e)}"}
            self.wfile.write(json.dumps(error_response).encode('utf-8'))

    def handle_config_save(self):
        """处理配置保存"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            config = json.loads(post_data.decode('utf-8'))

            # 验证配置格式
            if not isinstance(config, dict) or 'applications' not in config:
                raise ValueError("Invalid config format")

            # 保存到文件
            with open('apps-config.json', 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)

            print(f" Config saved to apps-config.json")

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status": "success"}')

        except Exception as e:
            print(f" Config save error: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = {"error": f"Config save failed: {str(e)}"}
            self.wfile.write(json.dumps(error_response).encode('utf-8'))

    def handle_bing_wallpaper(self):
        """处理必应壁纸请求"""
        try:
            api_url = (
                "https://www.bing.com/HPImageArchive.aspx"
                "?format=js&idx=0&n=8&mkt=zh-CN"
            )

            print(" Fetching Bing wallpaper...")

            req = urllib.request.Request(api_url)
            req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.load(resp)

            images = data.get("images") or []
            if not images:
                raise ValueError("No images in Bing response")

            # 随机选择一张图片
            choice = random.choice(images)
            image_url = "https://www.bing.com" + choice["url"]

            print(f"Selected wallpaper: {choice['title']}")

            self.send_response(302)
            self.send_header('Location', image_url)
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.end_headers()

        except Exception as exc:
            print(f"❌ Bing wallpaper error: {exc}")
            self.send_response(500)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.end_headers()
            message = f"Failed to fetch Bing wallpaper: {exc}"
            self.wfile.write(message.encode('utf-8'))

    def handle_health(self):
        """健康检查端点"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        health_data = {
            "status": "ok",
            "server": "HomeDock Dev Server",
            "version": "1.0.0"
        }
        self.wfile.write(json.dumps(health_data).encode('utf-8'))

    def log_message(self, format, *args):
        """自定义日志格式"""
        # 跳过常见的静态资源日志
        if any(skip in format % args for skip in ['.css', '.js', '.ico', '.png', '.jpg', '.svg']):
            return

        # 获取请求方法
        method = getattr(self.command, 'GET', 'Unknown')

        # 彩色日志
        if '200' in format % args:
            color_code = '\033[92m'  # 绿色
        elif '404' in format % args:
            color_code = '\033[91m'  # 红色
        else:
            color_code = '\033[93m'  # 黄色

        reset_code = '\033[0m'
        print(f"{color_code}[{method}] {format % args}{reset_code}")

def start_server(port=8000, ssl_enabled=False):
    """启动开发服务器"""
    handler = DevServerHandler

    try:
        httpd = socketserver.TCPServer(("", port), handler)

        if ssl_enabled:
            # 创建简单的自签名证书（仅用于开发）
            try:
                httpd.socket = ssl.wrap_socket(
                    httpd.socket,
                    certfile='localhost.pem',
                    keyfile='localhost-key.pem',
                    server_side=True,
                    ssl_version=ssl.PROTOCOL_TLS
                )
                protocol = "https"
                print(f"SSL enabled (需要证书文件)")
            except FileNotFoundError:
                print("SSL证书文件未找到，回退到 HTTP")
                protocol = "http"
        else:
            protocol = "http"

        server_url = f"{protocol}://localhost:{port}"

        print(f"HomeDock 开发服务器已启动!")
        print(f"服务器地址: {server_url}")
        print(f"首页: {server_url}/index.html")
        print(f"管理页面: {server_url}/admin.html")
        print(f"健康检查: {server_url}/health")
        print(f"按 Ctrl+C 停止服务器")
        print("-" * 50)

        # 自动打开浏览器
        def open_browser():
            import time
            time.sleep(1)  # 等待服务器启动
            webbrowser.open(f"{server_url}/index.html")

        threading.Thread(target=open_browser, daemon=True).start()

        httpd.serve_forever()

    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ 端口 {port} 已被占用，请尝试其他端口")
            sys.exit(1)
        else:
            raise

def create_dev_script():
    """创建便捷的启动脚本"""
    script_content = """#!/bin/bash
# HomeDock 开发服务器启动脚本

echo "启动 HomeDock 开发服务器..."

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 需要安装 Python 3"
    exit 1
fi

# 启动服务器
python3 dev-server.py --port 8000
"""

    with open('start-dev.sh', 'w') as f:
        f.write(script_content)

    os.chmod('start-dev.sh', 0o755)
    print("创建了 start-dev.sh 启动脚本")

def main():
    parser = argparse.ArgumentParser(description='HomeDock 开发服务器')
    parser.add_argument('--port', type=int, default=8000, help='服务器端口 (默认: 8000)')
    parser.add_argument('--ssl', action='store_true', help='启用 HTTPS')
    parser.add_argument('--create-script', action='store_true', help='创建启动脚本')

    args = parser.parse_args()

    if args.create_script:
        create_dev_script()
        return

    start_server(args.port, args.ssl)

if __name__ == "__main__":
    main()