import http.server
import socketserver
import urllib.request
import json
import random


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/bing-wallpaper"):
            try:
                api_url = (
                    "https://www.bing.com/HPImageArchive.aspx"
                    "?format=js&idx=0&n=8&mkt=zh-CN"
                )
                with urllib.request.urlopen(api_url, timeout=5) as resp:
                    data = json.load(resp)

                images = data.get("images") or []
                if not images:
                    raise ValueError("no images in Bing response")

                choice = random.choice(images)
                image_url = "https://www.bing.com" + choice["url"]

                self.send_response(302)
                self.send_header("Location", image_url)
                self.send_header(
                    "Cache-Control",
                    "no-store, no-cache, must-revalidate, max-age=0",
                )
                self.send_header("Pragma", "no-cache")
                self.send_header("Expires", "0")
                self.end_headers()
            except Exception as exc:
                self.send_response(500)
                self.send_header("Content-Type", "text/plain; charset=utf-8")
                self.end_headers()
                message = f"Failed to fetch Bing wallpaper: {exc}"
                self.wfile.write(message.encode("utf-8"))
            return

        return super().do_GET()


if __name__ == "__main__":
    port = 8000
    with socketserver.TCPServer(("", port), Handler) as httpd:
        print(f"Serving at http://localhost:{port}")
        httpd.serve_forever()
