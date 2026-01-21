[![zread](https://img.shields.io/badge/Ask_Zread-_.svg?style=flat&color=00b0aa&labelColor=000000&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQuOTYxNTYgMS42MDAxSDIuMjQxNTZDMS44ODgxIDEuNjAwMSAxLjYwMTU2IDEuODg2NjQgMS42MDE1NiAyLjI0MDFWNC45NjAxQzEuNjAxNTYgNS4zMTM1NiAxLjg4ODEgNS42MDAxIDIuMjQxNTYgNS42MDAxSDQuOTYxNTZDNS4zMTUwMiA1LjYwMDEgNS42MDE1NiA1LjMxMzU2IDUuNjAxNTYgNC45NjAxVjIuMjQwMUM1LjYwMTU2IDEuODg2NjQgNS4zMTUwMiAxLjYwMDEgNC45NjE1NiAxLjYwMDFaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00Ljk2MTU2IDEwLjM5OTlIMi4yNDE1NkMxLjg4ODEgMTAuMzk5OSAxLjYwMTU2IDEwLjY4NjQgMS42MDE1NiAxMS4wMzk5VjEzLjc1OTlDMS42MDE1NiAxNC4xMTM0IDEuODg4MSAxNC4zOTk5IDIuMjQxNTYgMTQuMzk5OUg0Ljk2MTU2QzUuMzE1MDIgMTQuMzk5OSA1LjYwMTU2IDE0LjExMzQgNS42MDE1NiAxMy43NTk5VjExLjAzOTlDNS42MDE1NiAxMC42ODY0IDUuMzE1MDIgMTAuMzk5OSA0Ljk2MTU2IDEwLjM5OTlaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik0xMy43NTg0IDEuNjAwMUgxMS4wMzg0QzEwLjY4NSAxLjYwMDEgMTAuMzk4NCAxLjg4NjY0IDEwLjM5ODQgMi4yNDAxVjQuOTYwMUMxMC4zOTg0IDUuMzEzNTYgMTAuNjg1IDUuNjAwMSAxMS4wMzg0IDUuNjAwMUgxMy43NTg0QzE0LjExMTkgNS42MDAxIDE0LjM5ODQgNS4zMTM1NiAxNC4zOTg0IDQuOTYwMVYyLjI0MDFDMTQuMzk4NCAxLjg4NjY0IDE0LjExMTkgMS42MDAxIDEzLjc1ODQgMS42MDAxWiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNNCAxMkwxMiA0TDQgMTJaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00IDEyTDEyIDQiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K&logoColor=ffffff)](https://zread.ai/binbin1213/HomeDock)
# HomeDock

> 🏠 NAS / 家庭服务器起始页 + 应用导航面板

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/binbin1213/HomeDock?style=social)](https://github.com/binbin1213/HomeDock)

---

## ✨ 功能特性

- 🎯 **统一应用入口** - 集中管理家庭/团队服务，支持内外网地址切换
- 🎨 **美观界面设计** - 支持必应壁纸、纯色、渐变三种背景模式
- 🚀 **多种部署方式** - Vercel / Cloudflare / Docker / 纯静态，灵活选择
- 💾 **配置云同步** - KV 存储支持，多设备配置实时同步
- 📱 **响应式设计** - 完美适配桌面、平板、手机
- 🔍 **多引擎搜索** - 内置 Google / Bing / 百度搜索
- 🔄 **离线可用** - Service Worker 缓存，无网络也能访问

---

## 🚀 快速开始

### Vercel 部署（推荐）

```bash
# 1. 安装依赖
npm install

# 2. 本地预览
vercel dev

# 3. 一键部署
vercel --prod
```

> **提示**：部署完成后需在 Vercel 控制台启用 KV Storage（Settings → Storage → Create Database）

### Cloudflare 部署

详见 [Cloudflare 部署指南](docs/DEPLOY_CLOUDFLARE.md)

### Docker 部署（NAS）

```bash
curl -sL https://raw.githubusercontent.com/binbin1213/HomeDock/main/install-homedock.sh | bash
```

详见 [NAS 部署指南](docs/NAS_DEPLOY.md)

### 纯静态试用

直接双击 `index.html` 即可体验基础功能（不支持云端配置和必应壁纸）

---

## 📸 界面预览

### 首页

![HomeDock 首页](img/Screenshot.png)

### 后台管理

![HomeDock 后台管理](img/Screenshot1.png)

---

## 📦 部署方案对比

| 特性 | Vercel | Cloudflare | Docker | 纯静态 |
|:---|:---:|:---:|:---:|:---:|
| **部署难度** | ⭐ 简单 | ⭐⭐ 进阶 | ⭐ 简单 | ⭐ 最简单 |
| **全球 CDN** | ✅ | ✅ | ❌ | ❌ |
| **自动 HTTPS** | ✅ | ✅ | 需配置 | 需配置 |
| **配置云同步** | ✅ (KV) | ✅ (KV) | ✅ (文件) | ❌ |
| **必应壁纸** | ✅ | ✅ | ✅ | ❌ |
| **适合场景** | 公网访问 | 公网访问 | NAS/内网 | 快速试用 |

---

## 💻 本地开发

### 直接打开文件

双击 `index.html` 或 `admin.html` 即可预览 UI

> **限制**：无法使用云端配置和必应壁纸，功能受限

### 使用开发服务器（推荐）

```bash
python dev-server.py
```

访问地址：
- 首页：`http://localhost:8000/index.html`
- 后台：`http://localhost:8000/admin.html`

**功能说明**：
- ✅ 完整 API 支持（配置读写、必应壁纸）
- ✅ 配置自动保存到 `apps-config.json`
- ✅ 支持 localStorage 缓存加速

---

## 📁 项目结构

```
HomeDock/
├── 核心文件
│   ├── index.html          # 首页
│   ├── admin.html          # 后台管理
│   ├── apps-config.json    # 默认配置
│   └── sw.js               # Service Worker
│
├── js/                     # 前端脚本
│   ├── modules/            # 功能模块
│   └── preset-icons.js     # 预设图标
│
├── css/                    # 样式文件
├── img/                    # 图片资源
│
├── api/                    # Vercel API
├── dev-server.py           # 开发服务器
├── cloudflare-worker.js    # Cloudflare Worker
│
└── docs/                   # 文档
    ├── PROJECT_ANALYSIS.md # 项目分析
    └── NAS_DEPLOY.md       # NAS 部署
```

---

## 🔧 配置说明

### 数据结构

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
    "mode": "wallpaper",  // wallpaper | solid | gradient
    "solidColor": "#202124",
    "gradientFrom": "#141e30",
    "gradientTo": "#243b55"
  }
}
```

### 存储优先级

1. **云端配置**（推荐）- Vercel KV / Cloudflare KV
2. **浏览器缓存** - `localStorage['homedock-config']`
3. **默认文件** - `apps-config.json`

---

## 🎨 功能详解

### 首页功能

- **内外网切换** - 右上角 `OFFICE / HOME` 按钮切换访问地址
- **搜索引擎** - 支持 Google / Bing / 百度，顶部图标显示当前引擎
- **背景模式**：
  - `wallpaper` - 必应每日壁纸
  - `solid` - 纯色背景
  - `gradient` - 渐变背景

### 后台管理

访问 `admin.html` 进行以下操作：

1. **应用管理** - 编辑、删除、添加应用
2. **表格导入** - 批量导入应用配置
3. **图标选择** - 浏览预设图标或上传自定义图标
4. **背景设置** - 实时预览并调整背景

---

## 🎯 使用场景

### 家庭 NAS / 家用服务器

```bash
# Docker 部署在 NAS 上
curl -sL https://raw.githubusercontent.com/binbin1213/HomeDock/main/install-homedock.sh | bash
```

- 家庭成员通过局域网访问
- 集中管理所有家庭服务（Jellyfin、Plex、下载器等）

### 个人公网主页

```bash
# Vercel 部署，全球加速
vercel --prod
```

- 统一展示个人服务、博客、网盘入口
- 多设备配置实时同步

### 团队服务导航

- 小团队内部系统统一入口
- 内外网地址一键切换

---

## ❓ 常见问题

### Q: 配置会丢失吗？

**A:** 不会。云端部署使用 KV 存储，Docker 部署使用文件持久化，配置安全保存。

### Q: 必应壁纸不显示？

**A:** 检查以下几点：
- 纯静态部署不支持，请使用纯色/渐变背景
- 确认 API 路由配置正确
- 部分地区可能需要代理

### Q: 如何备份配置？

**A:** 根据部署方式选择：
- **Vercel/Cloudflare**: 在 KV 控制台导出
- **Docker**: 备份挂载目录的 `apps-config.json`
- **浏览器**: 控制台执行 `copy(localStorage.getItem('homedock-config'))`

### Q: 支持自定义域名吗？

**A:** 支持。Vercel 和 Cloudflare 原生支持，Docker 需自行配置反向代理。

### Q: 可以离线使用吗？

**A:** 可以。首次加载后 Service Worker 会缓存静态文件，支持离线访问（配置同步功能除外）。

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源许可协议。

---

## 🤝 贡献指南

欢迎通过 Pull Request 贡献代码或资源！

### 贡献类型

- 🎨 **预设图标** - SVG/PNG 格式，扁平风格
- ⚙️ **配置示例** - 优化 `apps-config.json`
- 📝 **文档改进** - 完善 README 和文档

### 提交流程

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📞 联系方式

- **Issues**: [GitHub Issues](https://github.com/binbin1213/HomeDock/issues)
- **Discussions**: [GitHub Discussions](https://github.com/binbin1213/HomeDock/discussions)

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐️ Star**

Made with ❤️ by [binbin1213](https://github.com/binbin1213)

</div>
