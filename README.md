# HomeDock 项目说明文档
[![zread](https://img.shields.io/badge/Ask_Zread-_.svg?style=flat&color=00b0aa&labelColor=000000&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQuOTYxNTYgMS42MDAxSDIuMjQxNTZDMS44ODgxIDEuNjAwMSAxLjYwMTU2IDEuODg2NjQgMS42MDE1NiAyLjI0MDFWNC45NjAxQzEuNjAxNTYgNS4zMTM1NiAxLjg4ODEgNS42MDAxIDIuMjQxNTYgNS42MDAxSDQuOTYxNTZDNS4zMTUwMiA1LjYwMDEgNS42MDE1NiA1LjMxMzU2IDUuNjAxNTYgNC45NjAxVjIuMjQwMUM1LjYwMTU2IDEuODg2NjQgNS4zMTUwMiAxLjYwMDEgNC45NjE1NiAxLjYwMDFaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00Ljk2MTU2IDEwLjM5OTlIMi4yNDE1NkMxLjg4ODEgMTAuMzk5OSAxLjYwMTU2IDEwLjY4NjQgMS42MDE1NiAxMS4wMzk5VjEzLjc1OTlDMS42MDE1NiAxNC4xMTM0IDEuODg4MSAxNC4zOTk5IDIuMjQxNTYgMTQuMzk5OUg0Ljk2MTU2QzUuMzE1MDIgMTQuMzk5OSA1LjYwMTU2IDE0LjExMzQgNS42MDE1NiAxMy43NTk5VjExLjAzOTlDNS42MDE1NiAxMC42ODY0IDUuMzE1MDIgMTAuMzk5OSA0Ljk2MTU2IDEwLjM5OTlaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik0xMy43NTg0IDEuNjAwMUgxMS4wMzg0QzEwLjY4NSAxLjYwMDEgMTAuMzk4NCAxLjg4NjY0IDEwLjM5ODQgMi4yNDAxVjQuOTYwMUMxMC4zOTg0IDUuMzEzNTYgMTAuNjg1IDUuNjAwMSAxMS4wMzg0IDUuNjAwMUgxMy43NTg0QzE0LjExMTkgNS42MDAxIDE0LjM5ODQgNS4zMTM1NiAxNC4zOTg0IDQuOTYwMVYyLjI0MDFDMTQuMzk4NCAxLjg4NjY0IDE0LjExMTkgMS42MDAxIDEzLjc1ODQgMS42MDAxWiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNNCAxMkwxMiA0TDQgMTJaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00IDEyTDEyIDQiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K&logoColor=ffffff)](https://zread.ai/binbin1213/HomeDock)
HomeDock 是一个为 NAS / 家庭服务器 / VPS 设计的「起始页 + 应用导航面板」。  
它提供：

- 在同一页面集中展示常用服务的 **外网 / 内网入口**；
- 一个可切换搜索引擎的搜索框；
- 简洁的主页背景（必应壁纸 / 纯色 / 渐变）；
- 一个独立的后台页面，用于**可视化编辑应用列表与背景设置**；
- 可选的 Cloudflare Worker + KV 云端配置存储，以及 NAS 自托管部署方案。

整个项目以纯静态前端为核心，无需打包构建，直接部署 `web` 目录即可运行；  
如需在本地 / NAS 上实现「多终端共享同一份配置」，可以配合轻量级 Python 后端 `dev-server.py` 使用。

---

## 1. 界面预览

首页预览：

![HomeDock 首页](img/Screenshot.png)

后台管理页面预览：

![HomeDock 后台管理](img/Screenshot1.png)

---

## 2. 目录结构

根目录：`web/`

- `index.html`：主首页  
  - 应用列表（外部 / 内部地址切换）  
  - 搜索框与搜索引擎切换  
  - 背景渲染（必应壁纸 / 纯色 / 渐变）  
- `admin.html`：后台管理页面  
  - 列表方式管理应用  
  - 批量导入表格  
  - 背景模式与颜色配置  
- `apps-config.json`：默认应用配置模板  
- `js/`：前端脚本目录  
  - `js/modules/config-manager.js`：统一管理 `/api/config` / `localStorage` / 默认模板三层配置来源  
  - `js/modules/app-renderer.js`：首页应用网格渲染、拖拽排序、分页等  
  - `js/modules/ui-controller.js`：首页编辑模态框、图标选择器、搜索栏等 UI 行为  
  - `js/preset-icons.js`：预设应用图标列表，以 `window.PRESET_ICONS` 形式在首页和后台共用  
- `css/style.css`：主要页面样式  
- `img/`：通用图片资源  
- `img/png/`：各应用图标资源  
- `homedocker.svg` / `homedocker.ico`：HomeDock 图标与浏览器标签页图标  
- `dev-server.py`：增强版开发 / 自托管服务器，提供静态文件、`/api/config` 与 `/bing-wallpaper`，支持在 NAS 上将配置持久化到 `apps-config.json`  
- `cloudflare-worker.js`：Cloudflare Worker 脚本（配置 API + 壁纸代理）  
- `wrangler.toml`：Cloudflare Worker 部署配置  
- `docs/DEPLOY_CLOUDFLARE.md`：部署到 Cloudflare 的详细说明  
- `docs/PROJECT_ANALYSIS.md`：项目结构与逻辑的深入分析（开发向）  
- `docs/NAS_DEPLOY.md`：在 NAS / 家庭服务器上部署的详细说明（纯静态 / dev-server.py / Docker 三种模式）  

---

## 3. 核心概念

### 3.1 应用配置结构

应用配置的数据结构统一为：

```json
{
  "applications": [
    {
      "name": "示例应用",
      "external_url": "https://example.com",
      "internal_url": "http://192.168.1.100:8080",
      "icon": "img/png/Edge.svg"
    }
  ],
  "background": {
    "mode": "wallpaper | solid | gradient",
    "solidColor": "#202124",
    "gradientFrom": "#141e30",
    "gradientTo": "#243b55"
  }
}
```

> 如果缺少 `background` 字段，前端会自动补全默认值。

### 3.2 配置存储位置

当前实现支持三层存储来源（从上到下优先级递减）：

1. **云端配置（推荐）**  
   - 通过 Cloudflare Worker 提供 `/api/config` 接口；  
   - Worker 使用 KV 命名空间 `HOMEDOCK_CONFIG` 保存 key `config`。  
2. **浏览器本地缓存**  
   - key：`localStorage['homedock-config']`；  
   - 后台保存、首页编辑会同时更新该 key。  
3. **默认配置文件**  
   - `apps-config.json`，仅在前两者都不存在时作为初始模板。

---

## 4. 首页（index.html）行为说明

### 4.1 配置加载流程

首页在加载时，会按以下顺序获取应用和背景配置：

1. 调用 `GET /api/config`：  
   - 若成功、且返回数据结构合法，则使用该配置；  
   - 并写入 `localStorage['homedock-config']`。  
2. 若云端不可用：  
   - 首先尝试从 `localStorage['homedock-config']` 读取配置；  
   - 若本地也没有，读取 `apps-config.json` 作为 fallback；  
   - 自动补全 `background` 字段后写入本地缓存。

首页使用的本地 key：

- 配置：`homedock-config`  
- 外部/内部视图切换记忆：`homedock-app-view`

### 4.2 外部 / 内部应用切换

首页右上角有一个 `OFFICE / HOME` 的切换（`index.html:15-18`）：

- `HOME` 模式：展示外部访问地址 `external_url`；  
- `OFFICE` 模式：展示内部访问地址 `internal_url`；  
- 当前选择会持久化到 `localStorage['homedock-app-view']`，刷新后保持不变。

### 4.3 搜索框与引擎切换

搜索区域（`index.html:27-40`）支持：

- 搜索引擎按钮切换：Google / Bing / 百度；  
- 键入关键字后回车，根据当前选中的引擎跳转；  
- 顶部显示当前引擎图标和名称。

### 4.4 背景模式

背景渲染逻辑依据配置中的 `background.mode`：

- `wallpaper`：使用必应每日壁纸（通过 `/bing-wallpaper` 或 Cloudflare Worker 转发）；  
- `solid`：使用 `background.solidColor` 作为纯色背景；  
- `gradient`：使用 `gradientFrom` 与 `gradientTo` 渐变背景。

背景设置可在后台页面中调整（见下文）。

---

## 5. 后台管理（admin.html）

后台地址：`admin.html`  
主要功能：

1. **应用列表管理**  
   - 列出当前配置中的全部应用；  
   - 支持编辑 / 删除；  
   - 支持添加新应用；  
   - 所有修改自动保存到：
     - `localStorage['homedock-config']`  
     - 如配置了后端，则 `POST /api/config`。

2. **批量导入（表格）**  
   - 在「表格批量导入」区，可通过表格快速录入应用；  
   - 支持新增行、清空表格；  
   - 保存时按应用名称合并更新（同名则覆盖，不存在则新增）。

3. **图标选择器**  
   - 编辑应用时，可以通过「浏览预设图标」打开预置图标网格；  
   - 选择图标后自动填入 `icon` 字段。  

4. **背景设置**  
   - 背景模式切换：必应壁纸 / 纯色 / 渐变；  
   - 纯色模式：可通过颜色选择器或文本框输入十六进制颜色；  
   - 渐变模式：可设置起始 / 结束颜色，并实时预览；  
   - 所有背景设置改动即刻保存并同步配置。

后台加载配置的流程与首页一致，优先云端、退回本地和默认文件。

---

## 6. 部署方式概览

HomeDock 支持三种主要部署方式：

1. **Cloudflare Pages + Worker + KV（推荐生产使用）**  
   - 静态页面部署到 Cloudflare Pages；  
   - Worker 提供 `/api/config` 与 `/bing-wallpaper`；  
   - 配置存储在 KV 命名空间 `HOMEDOCK_CONFIG` 中；  
   - 多浏览器、多设备共享同一份配置。  
   - 详见 `docs/DEPLOY_CLOUDFLARE.md`。

2. **NAS / 家庭服务器部署（自托管，带壁纸，可共享配置）**  
   - 在 NAS / 家庭服务器上运行 Python 3 + `dev-server.py`：  
     - 提供静态文件；  
     - 通过 `/api/config` 读写本地 `apps-config.json`，实现多设备共享同一份配置；  
     - 通过 `/bing-wallpaper` 代理必应每日壁纸；  
   - 可以直接在宿主机上运行 `python3 dev-server.py`，也可以通过 Docker / docker-compose 方式运行（推荐后者，便于备份与迁移）；  
   - 配置同时保存在：
     - 服务器本地：`apps-config.json`（由 `dev-server.py` 负责读写）；  
     - 浏览器本地：`localStorage['homedock-config']`（前端缓存，加快加载速度）；  
   - 详细步骤见 `docs/NAS_DEPLOY.md`：  
     - 模式二：NAS + Python `dev-server.py`；  
     - 模式三：Docker 部署（容器化 NAS / 家庭服务器）。  

3. **NAS 纯静态部署（自托管，无服务端功能）**  
   - 将 `index.html`、`admin.html`、`css/`、`img/`、`apps-config.json`、`js/` 等静态资源上传到 NAS Web 根目录；  
   - 不跑任何后端程序，无法使用 `/bing-wallpaper` 和云端配置 API；  
   - 配置仅保存在各浏览器的 `localStorage['homedock-config']` 中，不会回写 `apps-config.json`；  
   - 建议在后台中选择「纯色」或「渐变」背景模式。  
   - 详细说明见 `docs/NAS_DEPLOY.md` 中的「模式一：纯静态部署」。

---

## 7. 本地开发与调试

### 7.1 直接打开文件

最简单的方式：在文件管理器中双击 `index.html` / `admin.html`。

- 优点：无需任何环境，立刻查看 UI；  
- 限制：
  - `/api/config` 与 `/bing-wallpaper` 请求会失败，前端会自动退回到 `apps-config.json` + `localStorage` 模式；
  - 一些与后端相关的功能无法体验。

### 7.2 使用 Python dev-server（推荐）

在 `web` 目录下执行：

```bash
python dev-server.py
```

然后访问：

- 首页：`http://localhost:8000/index.html`  
- 后台：`http://localhost:8000/admin.html`

此时：

- 静态文件由 `dev-server.py` 提供；  
- `/bing-wallpaper` 可用（本地代理必应壁纸）；  
- `/api/config` 由 `dev-server.py` 直接处理：  
  - `GET /api/config` → 从当前目录的 `apps-config.json` 读取配置；  
  - `POST /api/config` / `PUT /api/config` → 将最新配置写回 `apps-config.json`；  
- 前端仍然会把最近一次成功加载的配置缓存到 `localStorage['homedock-config']` 中，用于加速加载与离线访问。

---

## 8. 图标与品牌

HomeDock 的主图标文件：

- `homedocker.svg`：矢量版房子图标，用于生成各种尺寸资源；  
- `homedocker.ico`：已生成的多尺寸 ICO，适合作为浏览器标签页图标。

在 `index.html` 中，你可以这样引用 favicon：

```html
<link rel="icon" type="image/x-icon" href="homedocker.ico" />
```

如果你希望使用 SVG 作为 favicon：

```html
<link rel="icon" type="image/svg+xml" href="homedocker.svg" />
```

欢迎为 HomeDock 贡献更多预设应用图标（例如常见的 NAS 服务、下载工具、媒体服务等）：

- 建议优先提供 `SVG`，或透明背景的 `PNG`（推荐 256×256 或以上）；  
- 尽量保持与现有图标相似的扁平 / 线条风格；  
- 放在 `img/png/` 目录下，并使用有意义的英文文件名（如 `Jellyfin.svg`）；  
- 可以在提交时简单说明该图标对应的服务或应用名称；
- 推荐通过 Pull Request 的方式提交（见下方「贡献指南」）。

目前首页与后台页面中的图标选择器已经统一，无论是在首页右键编辑弹窗还是在 `admin.html` 中，都支持：

- 浏览预设图标：  
  - 预设列表来源：`js/preset-icons.js` 中的 `window.PRESET_ICONS`；  
  - 该列表在首页和后台共用，不再分别写死在不同页面里。  
- 上传自定义图标：  
  - 通过文件上传将图片读为 Data URL，直接写入配置中的 `icon` 字段；  
  - 不需要把图片手动拷贝到 `img/` 目录；  
  - 适合已经部署到 NAS / 远程服务器之后再做个性化定制。  
- 填写远程图标 URL：  
  - 例如填写 `https://example.com/logo.png`；  
  - 前端会在 CSP 允许的前提下正常加载显示。  

如果你在 `img/png/` 下新增了图标文件，但还没有在 `js/preset-icons.js` 里为它添加映射，它暂时不会自动出现在图标选择器的预设列表中；  
这类图标仍然可以通过在应用编辑表单中手工填入 `img/png/xxx.svg` / `img/png/xxx.png` 路径的方式使用。

---

## 9. 配置备份与迁移建议

在使用 Cloudflare Worker + KV 的模式下：

- 推荐定期导出 KV 中 `config` 的内容作为备份（例如通过 Wrangler 或 API）；  
- 在迁移到新域名 / 新 Worker 时，可以先部署静态站点，再将备份配置写回新的 KV 命名空间。

在纯本地浏览器模式下：

- 配置保存在 `localStorage['homedock-config']`；  
- 如需迁移到新浏览器，可以：
  1. 打开旧浏览器的开发者工具 → Console；  
  2. 执行 `copy(localStorage.getItem('homedock-config'))` 复制配置；  
  3. 在新浏览器 Console 中执行：  
     ```js
     localStorage.setItem('homedock-config', '<粘贴刚才复制的 JSON 字符串>')
     ```
  4. 刷新页面即可应用。

---

## 10. 适合你的使用场景

你可以考虑以下几种典型用法：

- 家庭 NAS / 家用服务器：
  - Docker 部署在 NAS 上，家庭成员通过局域网访问 HomeDock，集中入口访问各种服务；  
  - 不关心公网访问、只在内网使用。  

- 个人公网主页：
  - 使用 Cloudflare Pages + Worker + KV 部署；  
  - 将常用的个人服务、博客、网盘等入口统一展示；  
  - 在不同电脑和手机上访问同一域名，即可获得同一份应用配置和背景设置。  

- 轻量级团队门户：
  - 作为小团队内部的「服务导航」页，统一展示若干内外部系统入口；  
  - 使用 Cloudflare 模式共享配置，简单省心。

如需了解更多实现细节（包括每个函数的职责和调用关系），可以查看 `docs/PROJECT_ANALYSIS.md`，其中对 `index.html` 和 `admin.html` 的逻辑有逐段拆解。***

---

## 11. 许可证

本项目采用 MIT License 开源许可协议。  
完整条款见仓库根目录的 `LICENSE` 文件。

---

## 12. 贡献指南

欢迎通过 Pull Request 为 HomeDock 贡献代码或资源，尤其包括：

- 新的预设应用图标（`img/png/` 下的 `SVG`/`PNG` 文件，以及 `admin.html` 中 `PRESET_ICONS` 的补充）；  
- 默认应用配置示例（`apps-config.json` 的优化或新增示例）；  
- 文档改进（`README.md` 与 `docs/` 下的文档）。  

建议的提交流程：

1. Fork 本仓库；  
2. 在本地创建功能分支并完成修改；  
3. 确认页面在浏览器中正常工作（首页和后台均可访问）；  
4. 提交 Pull Request，简要说明本次改动的内容与目的。  

对于图标类贡献，请在 PR 描述中注明：

- 图标文件名与对应服务名称；  
- 图标是否为原创或来源于何处（如有协议要求请一并说明）。
