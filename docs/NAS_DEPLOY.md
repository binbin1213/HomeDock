# HomeDock 在 NAS / 家庭服务器上的部署指南

本文主要面向带 Web 服务能力的 NAS 和家庭服务器，例如：

- 群晖 Synology（带 Web Station / 反向代理）
- 威联通 QNAP
- 自建的 Linux 家庭服务器（Nginx / Apache / Docker 等）

目标是：

- 前端页面全部静态，放在 NAS 的网站目录或容器里；
- 配置持久化到 NAS 磁盘上的 `apps-config.json`；
- 所有设备通过同一个域名访问时，共享同一份应用配置和图标。

---

## 一、部署模式概览

HomeDock 前端是纯静态的，但配置读写有三层：

- 静态默认配置：`apps-config.json`
- 浏览器本地缓存：`localStorage["homedock-config"]`
- 可选服务器持久化：`/api/config` 读写服务器上的配置

在 NAS / 家庭服务器上，推荐三种模式：

1. 纯静态部署（入门）  
2. NAS + Python `dev-server.py`（带 `/api/config` 的共享配置）  
3. Docker 部署（后端和静态文件都容器化）

下面分别说明。

---

## 二、模式一：纯静态部署（入门，用最少功能跑起来）

适合场景：

- 只想先快速跑起来；
- 不急着做多设备共享配置；
- 能接受「每个浏览器一份配置」。

### 2.1 步骤

1. 在 NAS 上新建一个站点目录，例如：
   - 群晖：`/volume1/web/homedock`
   - QNAP：`/share/Web/homedock`
   - 自建服务器：`/var/www/homedock`

2. 把 `web` 目录下所有文件拷贝到该目录：
   - `index.html`
   - `admin.html`
   - `apps-config.json`
   - `css/`
   - `img/`
   - `js/`
   - 以及其它静态资源

3. 在 NAS 的 Web 管理界面中配置虚拟主机或站点：
   - 访问路径设置为 `/homedock` 或直接作为站点根；
   - 确保可以访问：
     - `http(s)://你的域名/index.html`
     - `http(s)://你的域名/admin.html`

### 2.2 数据持久化行为

- 第一次访问时：
  - 前端会从 `apps-config.json` 读取默认配置；
  - 并写入当前浏览器的 `localStorage["homedock-config"]`。

- 之后你在首页 / 后台做的修改：
  - 只会保存在当前浏览器；
  - 不会回写 `apps-config.json`；
  - 其他设备不会看到你的修改。

如果只是个人使用、单设备访问，这种方式已经够用；但如果希望所有终端共享配置，建议看下一节。

---

## 三、模式二：NAS + Python dev-server（推荐，有共享配置）

适合场景：

- NAS 或家庭服务器上可以安装 Python 3；
- 希望所有设备共享同一份应用配置；
- 不介意用一个轻量级 Python 进程作为后端。

核心思路：

- 静态文件仍然从 NAS 对外提供；
- 额外运行 `dev-server.py` 监听 `/api/config` 和 `/bing-wallpaper`；
- 前端通过相对路径 `/api/config` 访问这个服务器；
- 配置统一落在 NAS 上的 `apps-config.json`。

### 3.1 准备目录

假设你把整个项目放在：

```text
/volume1/docker/homedock/web
```

其中 `web` 目录就是当前项目根：

- `index.html`
- `admin.html`
- `apps-config.json`
- `dev-server.py`
- `js/`、`css/` 等

### 3.2 在 NAS 上安装 Python 3

- 群晖：
  - 可以通过套件中心安装 Python3；
  - 或者使用 Docker 映像运行 Python（见下一节）。
- QNAP / 其它 Linux：
  - 一般系统自带或可以通过包管理器安装，例如：
    - `sudo apt-get install python3`
    - `sudo yum install python3`

### 3.3 启动 dev-server.py

在 NAS 上通过 SSH 进入项目根目录：

```bash
cd /volume1/docker/homedock/web
python3 dev-server.py --port 8000
```

看到类似输出：

```text
🚀 HomeDock 开发服务器已启动!
📍 服务器地址: http://localhost:8000
🏠 首页: http://localhost:8000/index.html
⚙️  管理页面: http://localhost:8000/admin.html
❤️  健康检查: http://localhost:8000/health
```

此时：

- 前端页面直接访问这个 Python 服务器即可：
  - `http://NAS_IP:8000/index.html`
  - `http://NAS_IP:8000/admin.html`
- 前端对 `/api/config` 的请求会交给 `dev-server.py` 处理：
  - `GET /api/config` → 读取当前目录的 `apps-config.json`
  - `POST /api/config` → 把配置写回 `apps-config.json`

### 3.4 持久化效果

- 后台 `admin.html` 上所有操作（添加应用、批量导入、上传图标、调整背景等），最终都会写入：
  - 浏览器本地：`localStorage["homedock-config"]`
  - 服务器本地：`/volume1/docker/homedock/web/apps-config.json`
- 任何设备只要访问同一个地址（例如 `http://nas.local:8000/index.html`）：
  - 打开首页时优先从 `/api/config` 读取这份 JSON；
  - 所有人看到同一份应用列表和图标。

### 3.5 配合 NAS 反向代理

为了避免端口号和 IP 地址直接暴露，可以在 NAS 的反向代理里做一层友好的域名，例如：

- 在 NAS 反向代理管理界面中添加规则：
  - 外部域名：`https://home.yourdomain.com`
  - 目标地址：`http://127.0.0.1:8000`
- 这样用户访问：
  - `https://home.yourdomain.com/index.html`
  - `https://home.yourdomain.com/admin.html`
- 前端的 `/api/config`、`/bing-wallpaper` 也都通过该域名转发到 `dev-server.py`。

---

## 四、模式三：Docker 部署（容器化 NAS / 家庭服务器）

适合场景：

- NAS 上已经大量使用 Docker；
- 希望 HomeDock 和它的配置完全容器化管理；
- 方便备份 / 迁移 / 快速重建。

思路：

- 使用一个容器跑静态文件 + Python dev-server；
- 把 `apps-config.json` 所在目录通过卷挂载到 NAS 上；
- 通过反向代理把外部域名指向这个容器。

### 4.1 简单 docker-compose 示例

在某个目录（例如 `/volume1/docker/homedock`）创建 `docker-compose.yml`：

```yaml
version: "3.8"
services:
  homedock:
    image: python:3.11-slim
    container_name: homedock
    working_dir: /app
    volumes:
      - ./web:/app
    command: ["python", "dev-server.py", "--port", "8000"]
    ports:
      - "8000:8000"
    restart: unless-stopped
```

然后：

```bash
cd /volume1/docker/homedock
docker compose up -d
```

此时：

- 容器内 `/app` 就是你当前的 `web` 目录；
- `dev-server.py` 在容器里监听 `8000` 端口；
- NAS 上的 `./web/apps-config.json` 会随着配置变动自动更新。

如果希望前端静态文件由 Nginx 提供，也可以拆成两个服务（一个 Nginx 静态容器 + 一个 Python API 容器），前端访问 `/api/config` 时再由 Nginx 转发到后者，原理与上面反向代理一致。

---

## 五、推荐部署方案总结

结合 NAS 的特点，建议优先考虑：

- 单人 / 同一浏览器使用：
  - 可以用「模式一：纯静态部署」最快跑起来；
- 家庭多设备、局域网共享配置：
  - 推荐「模式二：NAS + dev-server.py」，实现统一的应用列表和图标；
- 有大量容器化需求、希望可移植：
  - 使用「模式三：Docker 部署」，把整个 HomeDock 当成一个独立服务。

无论采用哪种方式，只要确保：

- 前端始终能访问 `index.html` 和 `admin.html`；
- `/api/config` 在需要共享配置时能正确返回和保存 JSON；
- `apps-config.json` 所在目录挂在 NAS 的持久存储上，

就可以在 NAS / 家庭服务器上稳定地长期运行 HomeDock，作为整个家庭或小型工作室的统一入口。

