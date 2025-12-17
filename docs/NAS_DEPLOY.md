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

在 NAS / 家庭服务器上，推荐两种模式：
        
1. 纯静态部署（入门，功能最少、最简单）  
2. Docker 一键部署（推荐，一条脚本命令完成部署）
        
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

## 三、Docker 一键部署（推荐，有共享配置）
        
适合场景：
        
- NAS 或家庭服务器上可以安装 Docker（大部分群晖 / Linux 服务器均支持）；
- 希望所有设备共享同一份应用配置，并尽量减少手动配置步骤；
- 希望后续升级、迁移时尽量简单。
        
核心思路：
        
- 使用官方镜像 `binbin1213/homedock` 运行一个容器；
- 通过挂载卷 `/data` 将配置持久化到 NAS 目录；
- 通过一条安装脚本自动完成 Docker 安装、镜像拉取与容器启动。
        
### 3.1 准备环境
        
1. 确保 NAS / 服务器可以访问公网（用于下载 Docker 与镜像）；  
2. 在 NAS / 服务器上开启 SSH，并以具有 sudo 权限的用户登陆；  
3. 建议准备一个用于存放配置的数据目录，例如：`/volume1/docker/homedock-data`。
        
### 3.2 下载一键部署脚本
        
在目标服务器上执行：
        
```bash
cd ~
curl -fsSL https://raw.githubusercontent.com/binbin1213/HomeDock/main/web/install-homedock.sh -o install-homedock.sh
chmod +x install-homedock.sh
```
        
### 3.3 运行脚本并完成部署
        
执行：
        
```bash
./install-homedock.sh
```
        
脚本会依次完成：
        
1. 检测当前系统（Ubuntu、Debian 等）并输出系统名称；  
2. 检查是否已安装 Docker：  
   - 未安装：自动通过官方脚本 `get.docker.com` 安装；  
   - 已安装：跳过安装步骤；  
3. 如 Docker 服务未启动，会尝试通过 `systemctl start docker` 启动；  
4. 交互式询问：
   - 数据目录（默认：`/opt/homedock-data`，可填例如 `/volume1/docker/homedock-data`）；  
   - 映射端口（默认：`8000`）；  
   - 镜像版本标签（默认：`latest`，也可以手动输入 `v1.0.0` 等固定版本）；  
5. 创建数据目录并拉取镜像：
   - 镜像：`binbin1213/homedock:<你选择的标签>`；  
6. 如存在旧的 `homedock` 容器，会先停止并删除；  
7. 启动新容器：
        
   ```bash
   docker run -d \
     --name homedock \
     -p 映射端口:8000 \
     -v 数据目录:/data \
     --restart unless-stopped \
     binbin1213/homedock:<镜像标签>
   ```
        
脚本结束时会自动输出可访问地址，例如：
        
```text
首页:  http://192.168.1.100:8000/index.html
后台:  http://192.168.1.100:8000/admin.html
```
        
你只需要在浏览器中访问对应地址即可使用。
        
### 3.4 配置持久化与升级
        
- 持久化位置：  
  - 所有后台更改（应用列表、图标、背景设置）最终都会写入容器内 `/data/apps-config.json`；  
  - 该路径被映射到你在脚本中选择的数据目录（如 `/volume1/docker/homedock-data/apps-config.json`），容器删除或重建后配置仍然存在。
        
- 升级镜像：  
  1. 在服务器上执行：
     
     ```bash
     docker pull binbin1213/homedock:latest
     docker stop homedock
     docker rm homedock
     ```
     
  2. 重新运行 `./install-homedock.sh`，选择同一个数据目录和端口，镜像标签可以继续用 `latest` 或指定新版本。  
     
  这样可以在保留配置的前提下平滑升级。
        
---
        
## 四、推荐部署方案总结
        
结合 NAS / 家庭服务器的特点，建议优先考虑：
        
- 单人 / 单设备使用：  
  - 使用「纯静态部署」最快跑起来，部署简单；  
  - 配置只保存在当前浏览器的 `localStorage` 中。
- 家庭多设备、局域网甚至公网访问：  
  - 推荐使用「Docker 一键部署」，通过容器 + 数据卷方式实现统一配置与持久化；  
  - 升级、迁移、备份都更方便。
        
无论采用哪种方式，只要确保：
        
- 前端始终能访问 `index.html` 和 `admin.html`；  
- 如使用 Docker，一定要为 `/data` 挂载宿主机目录以持久化 `apps-config.json`；  
        
就可以在 NAS / 家庭服务器上稳定地长期运行 HomeDock，作为整个家庭或小型工作室的统一入口。
