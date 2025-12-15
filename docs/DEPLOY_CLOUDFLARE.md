# HomeDock 部署到 Cloudflare 详细说明

本文档说明如何把当前项目部署到 Cloudflare，做到：

- 静态页面（`index.html`, `admin.html`, `css`, `img` 等）托管在 Cloudflare Pages 或任意静态空间；
- 配置（应用列表、图标、背景设置）统一保存在 Cloudflare KV 中，多设备共享；
- 使用 Cloudflare Worker 提供：
  - `GET /api/config` / `POST /api/config` 配置读写接口；
  - `GET /bing-wallpaper` 代理必应每日壁纸。

> 约定：下面把你最终访问站点的域名写成 `home.example.com`，请根据实际域名替换。

---

## 一、项目结构说明

关键文件：

- `index.html`：首页（外网 / 内网应用、搜索框等），通过 `/api/config` 读取配置。
- `admin.html`：后台管理页面，通过 `/api/config` 读取和写入配置。
- `apps-config.json`：默认配置模板，仅在远端 KV 还没有数据时用来初始化。
- `cloudflare-worker.js`：Cloudflare Worker 逻辑（配置接口 + 必应壁纸）。
- `wrangler.toml`：Worker 的部署配置文件。

> 注意：本地开发时仍可以用 `server.py` 起一个简单的 HTTP 服务器；线上部署到 Cloudflare 后不再需要 `server.py`。

---

## 二、准备 Cloudflare 账号与工具

1. 注册 / 登录 Cloudflare
   - 访问 https://dash.cloudflare.com/，注册或登录。

2. 安装 Wrangler CLI（本地只需装一次）
   - 需要本机有 Node.js（建议 18+）。
   - 在终端执行：

     ```bash
     npm install -g wrangler
     ```

3. 在终端登录 Cloudflare

   ```bash
   wrangler login
   ```

   浏览器会弹出授权页面，确认后 Wrangler 就可以操作你的账号资源了。

---

## 三、创建 KV 命名空间

1. 在项目根目录（当前是 `web`）执行：

   ```bash
   wrangler kv:namespace create HOMEDOCK_CONFIG
   ```

2. 记下命令输出中的 `id`，类似：

   ```text
   [[kv_namespaces]]
   binding = "NASHOMECLOUD_CONFIG"
   id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

3. 打开项目中的 `wrangler.toml`，修改 KV 配置：

   文件：`wrangler.toml:12-14`

   ```toml
   [[kv_namespaces]]
   binding = "HOMEDOCK_CONFIG"
   id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # 用上一步输出的 id 替换
   ```

---

## 四、配置 Worker 路由与域名

`wrangler.toml` 当前内容（简化）：

```toml
name = "homedock-home"
main = "cloudflare-worker.js"
compatibility_date = "2025-01-15"

workers_dev = true

routes = [
  "https://example.com/api/*",
  "https://example.com/bing-wallpaper*"
]
```

### 4.1 选择域名

假设你希望最终站点访问地址是：

- `https://home.example.com/index.html`
- `https://home.example.com/admin.html`

那么需要：

1. 在 Cloudflare 的「网站」中添加 `example.com` 域；  
2. 在该域下创建一个子域名 `home.example.com`，用于绑定 Pages 站点。

### 4.2 修改 Worker 路由

把 `routes` 改成你的真实域名，例如：

```toml
routes = [
  "https://home.example.com/api/*",
  "https://home.example.com/bing-wallpaper*"
]
```

解释：

- 所有到 `https://home.example.com/api/...` 的请求都会交给这个 Worker；
- 所有到 `https://home.example.com/bing-wallpaper...` 的请求也会交给这个 Worker；
- 前端代码中使用的是相对路径 `/api/config` 和 `/bing-wallpaper`，所以只要页面本身也跑在 `home.example.com` 下即可。

你也可以先不配置 `routes`，而只用 `workers_dev = true` 生成一个 `*.workers.dev` 的测试域名，调试通过后再绑定正式域名。

---

## 五、部署 Cloudflare Worker

在 `web` 目录执行：

```bash
wrangler deploy
```

Wrangler 会根据 `wrangler.toml`：

- 上传 `cloudflare-worker.js`；
- 绑定 `HOMEDOCK_CONFIG` KV；
- 如果设置了 `routes`，自动把路由接到你的 Worker 上；
- 同时生成一个 `https://homedock-home.yourname.workers.dev` 的测试地址。

### 5.1 验证 Worker 是否正常

1. 在浏览器访问（Workers dev 域名）：

   ```text
   https://homedock-home.<你的 workers 子域>.workers.dev/api/config
   ```

   首次访问时，KV 中还没有数据，Worker 会返回一个带空应用列表的默认配置 JSON。

2. 再访问：

   ```text
   https://homedock-home.<你的 workers 子域>.workers.dev/bing-wallpaper
   ```

   应该会 302 重定向到一张 Bing 壁纸图片地址。

如果这两步正常，说明 Worker 本身工作没问题。

---

## 六、部署静态站点到 Cloudflare Pages

### 6.1 创建 Pages 项目

1. 在 Cloudflare Dashboard 选择 **Pages** → **Create a project**。  
2. 选择：
   - 如果你用 Git 仓库：选择仓库并指定项目根目录为 `web`；
   - 如果本地手动上传：选择「Direct Upload」，上传整个 `web` 目录（不需要 `server.py`）。
3. 构建设置：
   - **Build command**：留空（因为是纯静态文件）；  
   - **Build output directory**：填 `.`（点）。

部署完成后，Pages 会给一个默认域名，例如：

```text
https://homedock-home.pages.dev
```

### 6.2 绑定自定义域名（可选，但推荐）

1. 在 Pages 项目设置中选择「Custom domains」。  
2. 绑定 `home.example.com`。  
3. Cloudflare 会自动为这个子域添加 DNS 记录，并指向 Pages。

这样，静态页面即可通过：

- `https://home.example.com/index.html`
- `https://home.example.com/admin.html`

访问。

### 6.3 把 Pages 和 Worker 统一到同一个域名

关键点是：**Worker 路由和 Pages 使用同一个域名**，这样前端的 `/api/config` 和 `/bing-wallpaper` 就能被 Worker 接住。

步骤：

1. 确保 `wrangler.toml` 中的 `routes` 使用的就是 `home.example.com`：  

   ```toml
   routes = [
     "https://home.example.com/api/*",
     "https://home.example.com/bing-wallpaper*"
   ]
   ```

2. Pages 项目已绑定 `home.example.com`（上一步骤 6.2）。  
3. 确认 Cloudflare 中的路由顺序：  
   - 一般情况下，Worker 路由只匹配 `/api/*` 和 `/bing-wallpaper*`，不会覆盖 `index.html` 和 `admin.html`，所以直接生效即可。  

完成以上后：

- 访问 `https://home.example.com/index.html` → 静态页面由 Pages 提供；  
- 访问 `https://home.example.com/admin.html` → 也是 Pages；  
- 页面中的 `fetch('/api/config')`、`fetch('/bing-wallpaper?...')` → 由 Worker 接手，读写 KV & 代理壁纸。

---

## 七、数据持久化与迁移细节

### 7.1 数据流（最终状态）

- 首页 / 后台加载时：
  - 优先 `GET /api/config`，从 Worker + KV 获取配置；  
- 同时把结果写入本地 `localStorage['homedock-config']` 做缓存；  
  - 如果 Worker 不可用，则退回到本地 localStorage / `apps-config.json`。

- 后台中任何修改（添加应用、删除应用、修改图标、修改背景模式与颜色）：
  - 更新内存中的 `config`；
- 写入 `localStorage['homedock-config']`；
  - 调用 `POST /api/config` 把新配置写进 KV。

### 7.2 首次上线时如何带上默认配置

因为 `apps-config.json` 已经包含了默认应用列表和初始背景设置，所以：

- 第一次访问后台：
  - Worker KV 为空 → 前端从 `apps-config.json` 加载默认配置；  
  - 补全 `background` 字段；  
  - 调用 `POST /api/config` 把这份默认配置写入 KV。  

之后：

- 所有浏览器、所有设备都会从 KV 读取这份配置，然后各自再往上修改。

---

## 八、本地开发与调试建议

### 8.1 本地直接用浏览器打开文件

- 直接双击 `index.html` / `admin.html` 的话，`fetch('/api/config')` 会失败（没有 Worker），然后自动退回到：
- 本地 `localStorage['homedock-config']`；  
  - 或 `apps-config.json` 默认配置。

适合离线调试 UI，不依赖 Cloudflare。

### 8.2 本地起静态服务器

也可以继续使用 `server.py`：

```bash
python server.py
```

访问 `http://localhost:8000/index.html` / `admin.html` 时：

- `/api/config` 仍然会 404 → 前端自动退回 localStorage + `apps-config.json`；  
- `/bing-wallpaper` 则由本地 `server.py` 代理 Bing 壁纸（如果你希望本地体验和线上一致）。

---

## 九、常见问题

### Q1：后台里改了应用 / 背景，刷新首页没变化？

排查顺序：

1. 首页和后台是否访问的是 **同一个域名**（特别注意 `http` / `https`、端口、是否 Pages 默认域名 vs 自定义域名）；  
2. Worker 是否已经部署并且 `routes` 正确指向当前域名；  
3. 在浏览器控制台看网络请求：
   - `/api/config` 是否返回 200；
   - 是否有 CORS 或 404 / 5xx 错误。

### Q2：换浏览器 / 换设备访问后，看不到原来的应用？

- 确认访问的域名和线上一致（不要一个是 `pages.dev`，一个是自定义域名）。  
- 确认 Worker + KV 已经部署，`GET /api/config` 返回的是同一份数据。  
- 如果仍然不一致，可以在后台「稍微改一下配置再保存一次」，让 KV 覆盖旧值。

### Q3：想重置为默认配置怎么做？

简单方式：

1. 在 Cloudflare Dashboard → Workers & KV → 找到 `HOMEDOCK_CONFIG` 命名空间；  
2. 删除 key `config`；  
3. 下次访问后台时，会从 `apps-config.json` 重新加载默认配置并写回 KV。

---

到这里，这个项目就具备了一键在 Cloudflare 上完整跑起来的文档说明：  
- 静态页面 → Pages；  
- 配置与壁纸接口 → Worker + KV；  
- 所有端共用一份云端配置。  

如果你之后更换域名，只需要：

1. 在 `wrangler.toml` 里更新 `routes`；  
2. 在 Pages 项目里更新绑定域名；  
3. 重新 `wrangler deploy` 一次即可。

---

## 十、NAS / 自托管部署方式

如果你希望完全使用自己的设备（NAS 或本地服务器）来部署，而不是依赖 Cloudflare，也可以有两种方式：

1. Docker 部署（推荐，用 NAS 上的 Docker 套件运行 `server.py`）；  
2. 纯静态部署到 NAS 自带 Web 服务器（如 Synology Web Station）。

> 说明：这两种本地部署方式默认都不依赖 Cloudflare Worker 和 KV，配置只存储在浏览器的 `localStorage` 中，不会跨浏览器 / 跨设备同步。

### 10.1 Docker 部署到 NAS

#### 10.1.1 功能说明

- 使用项目自带的 `server.py`：
  - 提供静态文件服务（首页 + 后台）；  
  - 提供 `/bing-wallpaper` 接口，实现每日必应壁纸和「换一张」按钮。  
- 配置（应用列表 + 背景设置）：
- 保存在访问者浏览器的 `localStorage['homedock-config']`；  
  - 即使容器重启，访问同一浏览器时配置依然存在；  
  - 但不同浏览器 / 设备之间不会自动同步。

#### 10.1.2 准备工作

1. NAS 上安装 Docker（以群晖为例：在「套件中心」里安装 Docker 或 Container Manager）。  
2. 把当前项目目录（含 `Dockerfile`, `server.py`, `index.html` 等）放到 NAS 可访问的共享文件夹中，或者使用 Git 拉取本仓库。

#### 10.1.3 构建镜像

在项目根目录（`web`）下执行（在 NAS 自带终端或 SSH 中）：

```bash
docker build -t homedock-local .
```

构建完成后，你会得到一个名为 `homedock-local` 的镜像。

#### 10.1.4 运行容器

在 NAS 上运行：

```bash
docker run -d \
  --name homedock \
  -p 8000:8000 \
  homedock-local
```

说明：

- `-p 8000:8000`：把 NAS 的 8000 端口映射到容器内的 8000 端口；  
- `server.py` 默认监听 8000 端口（见 `server.py:47-49`）。

启动成功后，在局域网中访问：

```text
http://<NAS-IP>:8000/index.html
http://<NAS-IP>:8000/admin.html
```

即可使用首页和后台管理：

- 必应每日壁纸 + 「换一张」按钮正常；  
- 应用编辑、图标、背景设置在本浏览器持久化；  
- 刷新 / 重启 NAS / 重启浏览器后（不清除站点数据）仍然有效。

> 可选：你也可以在 Docker 里挂载一个卷，以便替换静态文件，但当前配置逻辑本身不写入服务器文件，所以是否挂载卷不影响配置持久化。

### 10.2 NAS 纯静态部署

如果你不想在 NAS 上运行任何后端程序，只使用其内置 Web 服务器（如 Nginx + Web Station），可以用纯静态方式部署。

#### 10.2.1 功能说明

- 首页 + 后台完整运行：  
  - 应用列表展示；  
  - 后台添加 / 编辑 / 删除应用；  
  - 背景模式切换（壁纸/纯色/渐变）及 UI 都可以操作。  
- 配置持久化：
- 依然只写在浏览器 `localStorage['homedock-config']` 中；  
  - 不依赖任何服务器端存储。  
- 限制：
  - 没有 `server.py` 时，`/bing-wallpaper` 不存在，因此：
    - 自动加载每日壁纸功能会失败；  
    - 「换一张」按钮点击也不会生效。  
  - 推荐在这种部署模式下使用「纯色背景」或「渐变背景」，而不是必应壁纸。

#### 10.2.2 部署步骤（以 Synology Web Station 为例）

1. 启用 Web 服务
   - 在 DSM 中安装并启用 Web Station，按照向导创建一个虚拟主机（例如 `http://nas.local/homedock/`）。  

2. 上传静态文件
   - 将项目目录中的以下文件和目录上传到虚拟主机的根目录：
     - `index.html`  
     - `admin.html`  
     - `css/`  
     - `img/`  
     - `apps-config.json`  
     - 以及其他静态资源（如 `js`、字体等，如果有）。  
   - 不需要上传：`server.py`, `Dockerfile`, `cloudflare-worker.js`, `wrangler.toml`, `DEPLOY_CLOUDFLARE.md`。

3. 访问页面

   - 首页：

     ```text
     http://nas.local/homedock/index.html
     ```

   - 后台：

     ```text
     http://nas.local/homedock/admin.html
     ```

4. 使用建议

   - 背景设置：
     - 在后台的「背景设置」中，将背景模式设置为「纯色背景」或「渐变背景」，避免依赖 `/bing-wallpaper`。  
   - 配置保存：
     - 所有修改都会保存在浏览器 `localStorage` 中；  
     - 在同一个浏览器中，多次访问 NAS 页面时会保持设置；  
     - 更换浏览器或设备时，需要重新配置一次。

---

## 十一、本地部署 vs Cloudflare 部署能力对比

| 部署方式                     | 存储位置               | 必应每日壁纸 | 背景纯色/渐变 | 配置是否跨设备共享 |
|------------------------------|------------------------|--------------|---------------|--------------------|
| Cloudflare Pages + Worker+KV | Cloudflare KV         | 支持         | 支持          | 支持（同一域名）   |
| NAS Docker (`server.py`)     | 浏览器 localStorage    | 支持         | 支持          | 不支持             |
| NAS 纯静态                   | 浏览器 localStorage    | 不推荐/不稳定 | 支持          | 不支持             |

可以根据自己的使用场景选择：

- 如果希望「在哪台设备打开都是同一份配置」→ 用 Cloudflare KV 方案；  
- 如果主要在家里 NAS + 自己几台设备使用，不在意跨设备同步 → 用 NAS Docker 或 NAS 纯静态方案即可。  
