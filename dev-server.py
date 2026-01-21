#!/usr/bin/env python3
"""
HomeDock 生产服务器
支持 HTTP/HTTPS、gzip 压缩、API 代理和 CORS
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
import gzip
import io
import datetime
import socket
from pathlib import Path

DATA_DIR = Path(os.environ.get("HOMEDOCK_DATA_DIR", "."))
CONFIG_PATH = DATA_DIR / "apps-config.json"

def get_server_ip():
    """获取服务器IP地址"""
    try:
        # 连接到外部地址获取本地IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def format_timestamp():
    """格式化时间戳"""
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

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

    def gzip_compress(self, data):
        """压缩数据"""
        buf = io.BytesIO()
        with gzip.GzipFile(fileobj=buf, mode='wb') as f:
            f.write(data)
        return buf.getvalue()

    def should_gzip(self):
        """检查是否应该使用 gzip 压缩"""
        # 检查客户端是否支持 gzip
        accept_encoding = self.headers.get('Accept-Encoding', '')
        if 'gzip' not in accept_encoding:
            return False

        # 只压缩文本文件
        gzip_types = ['.html', '.css', '.js', '.json', '.svg', '.xml', '.txt']
        return any(self.path.endswith(ext) for ext in gzip_types)

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
            # 处理静态文件，支持 gzip 压缩
            if self.should_gzip():
                try:
                    # 读取文件内容
                    from pathlib import Path
                    file_path = Path('.') / self.path.lstrip('/')
                    if file_path.exists() and file_path.is_file():
                        with open(file_path, 'rb') as f:
                            content = f.read()

                        # 压缩内容
                        compressed = self.gzip_compress(content)
                        compression_ratio = (1 - len(compressed) / len(content)) * 100

                        # 发送响应
                        self.send_response(200)
                        self.send_header('Content-Encoding', 'gzip')
                        self.send_header('Content-Type', self.guess_type(file_path))
                        self.end_headers()
                        self.wfile.write(compressed)

                        # Gzip 压缩日志
                        timestamp = format_timestamp()
                        print(f"[{timestamp}] INFO GZIP {self.path} ({len(content)} → {len(compressed)} bytes, 节省 {compression_ratio:.1f}%)", flush=True)
                        return
                except Exception as e:
                    timestamp = format_timestamp()
                    print(f"[{timestamp}] ERROR GZIP 压缩失败 {self.path}: {e}", flush=True)

            # 回退到默认处理
            timestamp = format_timestamp()
            print(f"[{timestamp}] DEBUG STATIC {self.path}", flush=True)
            super().do_GET()

    def guess_type(self, path):
        """猜测文件 MIME 类型"""
        import mimetypes
        mime_type, _ = mimetypes.guess_type(str(path))
        return mime_type or 'application/octet-stream'

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
            if CONFIG_PATH.exists():
                with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
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
            timestamp = format_timestamp()
            print(f"[{timestamp}] ERROR Config API error: {e}", flush=True)
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
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)

            timestamp = format_timestamp()
            print(f"[{timestamp}] INFO Config saved to {CONFIG_PATH}", flush=True)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status": "success"}')

        except Exception as e:
            timestamp = format_timestamp()
            print(f"[{timestamp}] ERROR Config save error: {e}", flush=True)
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

            timestamp = format_timestamp()
            print(f"[{timestamp}] INFO Fetching Bing wallpaper...", flush=True)

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

            timestamp = format_timestamp()
            print(f"[{timestamp}] INFO Selected wallpaper: {choice['title']}", flush=True)

            self.send_response(302)
            self.send_header('Location', image_url)
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.end_headers()

        except Exception as exc:
            timestamp = format_timestamp()
            print(f"[{timestamp}] ERROR Bing wallpaper error: {exc}", flush=True)
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
        """自定义日志格式 - 带时间戳"""
        # 跳过常见的静态资源日志
        if any(skip in format % args for skip in ['.css', '.js', '.ico', '.png', '.jpg', '.svg']):
            return

        # 获取请求方法和状态码
        method = self.command
        status_code = format.split()[1] if len(format.split()) > 1 else '000'

        # 格式化时间戳
        timestamp = format_timestamp()

        # 根据状态码设置日志级别
        if status_code == '200':
            level = 'INFO'
        elif status_code == '304':
            level = 'INFO'
        elif status_code == '302':
            level = 'INFO'
        elif status_code == '404':
            level = 'WARN'
        elif status_code.startswith('5'):
            level = 'ERROR'
        else:
            level = 'DEBUG'

        # 输出格式化日志
        print(f"[{timestamp}] {level} {method} {format % args}", flush=True)

def start_server(port=8000, ssl_enabled=False):
    """启动生产服务器"""
    handler = DevServerHandler

    try:
        httpd = socketserver.TCPServer(("", port), handler)

        if ssl_enabled:
            # 创建简单的自签名证书
            try:
                httpd.socket = ssl.wrap_socket(
                    httpd.socket,
                    certfile='localhost.pem',
                    keyfile='localhost-key.pem',
                    server_side=True,
                    ssl_version=ssl.PROTOCOL_TLS
                )
                protocol = "https"
                print(f"[{format_timestamp()}] INFO SSL enabled (需要证书文件)", flush=True)
            except FileNotFoundError:
                timestamp = format_timestamp()
                print(f"[{timestamp}] WARN SSL证书文件未找到，回退到 HTTP", flush=True)
                protocol = "http"
        else:
            protocol = "http"

        # 获取服务器IP
        server_ip = get_server_ip()
        server_url = f"{protocol}://{server_ip}:{port}"

        # 服务器启动信息
        print("=" * 60, flush=True)
        print(f"[{format_timestamp()}] INFO HomeDock 生产服务器已启动", flush=True)
        print(f"[{format_timestamp()}] INFO 服务器地址: {server_url}", flush=True)
        print(f"[{format_timestamp()}] INFO 首页: {server_url}/index.html", flush=True)
        print(f"[{format_timestamp()}] INFO 管理页面: {server_url}/admin.html", flush=True)
        print(f"[{format_timestamp()}] INFO 健康检查: {server_url}/health", flush=True)
        print(f"[{format_timestamp()}] INFO 按 Ctrl+C 停止服务器", flush=True)
        print("=" * 60, flush=True)

        httpd.serve_forever()

    except OSError as e:
        if e.errno == 48:  # Address already in use
            timestamp = format_timestamp()
            print(f"[{timestamp}] ERROR 端口 {port} 已被占用，请尝试其他端口", flush=True)
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
    parser = argparse.ArgumentParser(description='HomeDock 生产服务器')
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
