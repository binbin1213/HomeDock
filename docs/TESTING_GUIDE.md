# HomeDock 本地测试指南

## 🚀 快速启动

### 方法 1: 使用启动脚本（推荐）
```bash
./start-dev.sh
```

### 方法 2: 直接运行 Python 脚本
```bash
python3 dev-server.py --port 8000
```

## 🌐 访问地址

- **首页**: http://localhost:8000/index.html
- **管理页面**: http://localhost:8000/admin.html
- **健康检查**: http://localhost:8000/health
- **API 配置**: http://localhost:8000/api/config
- **必应壁纸**: http://localhost:8000/bing-wallpaper

## 🧪 功能测试

### 1. 基础功能测试

#### ✅ 页面加载测试
1. 打开 http://localhost:8000/index.html
2. 检查所有模块是否正确加载
3. 查看浏览器控制台是否有错误

#### ✅ 配置系统测试
1. 检查应用是否正确显示
2. 测试外部/内部应用切换
3. 验证配置是否正确加载（包括从 `/api/config` 和本地缓存回退的情况）
4. 在 `admin.html` 中上传一个自定义图标（或填写 Data URL / 远程 HTTPS 图标 URL），保存后返回首页确认图标是否正常显示

### 2. 交互功能测试

#### 🎯 编辑模式测试
1. 点击右上角"编辑"按钮
2. 观察应用图标是否出现编辑按钮
3. 测试拖拽排序功能
4. 测试添加/编辑/删除应用

#### 🔍 搜索功能测试
1. 在搜索框输入内容
2. 测试不同搜索引擎切换
3. 验证回车搜索功能
4. 测试搜索历史功能

#### 🖼️ 背景管理测试
1. 点击"换一张"按钮更换壁纸
2. 测试背景模式切换（需要配合 admin.html）

### 3. 响应式设计测试

#### 📱 移动端测试（< 768px）
1. 调整浏览器窗口到手机尺寸
2. 检查应用网格是否重新排列
3. 测试触摸交互
4. 验证搜索框移动端样式

#### 📱 平板端测试（768px - 1024px）
1. 调整浏览器窗口到平板尺寸
2. 检查图标大小和间距
3. 验证布局是否合理

### 4. 性能优化测试

#### ⚡ 图片优化测试
1. 打开开发者工具 → Network 标签
2. 刷新页面观察图片加载
3. 验证懒加载是否工作
4. 检查是否支持 WebP 格式

#### 🔄 Service Worker 测试
1. 打开开发者工具 → Application → Service Workers
2. 检查 SW 是否正常注册
3. 测试离线访问（断网后刷新页面）
4. 验证缓存功能

### 5. 安全功能测试

#### 🔒 XSS 防护测试
```javascript
// 在控制台运行
console.log(window.Helpers.escapeHtml('<script>alert("xss")</script>'));
// 应该输出转义后的字符串
```

#### 🛡️ CSP 策略测试
1. 打开开发者工具 → Console
2. 检查是否有 CSP 违反警告
3. 验证内联脚本是否被正确处理

## 🎯 自动化测试

### 演示功能
```javascript
// 在控制台运行以下命令

// 演示通知系统
demoNotifications()

// 演示拖拽功能
demoDragDrop()

// 演示响应式设计
demoResponsive()

// 演示配置管理
demoConfig()
```

## 🔧 开发工具

### 浏览器开发者工具使用

#### 1. 控制台 (Console)
- 查看 JavaScript 错误
- 运行测试脚本
- 调试功能

#### 2. 网络 (Network)
- 监控资源加载
- 检查 API 请求
- 验证缓存策略

#### 3. 应用 (Application)
- 检查 LocalStorage
- 调试 Service Worker
- 查看缓存状态

#### 4. 响应式设计测试
- 切换设备模拟
- 测试不同屏幕尺寸
- 检查触摸事件

### 常用调试命令

```javascript
// 检查配置
console.log('当前配置:', window.ConfigManager.getCurrentConfig());

// 检查通知系统
window.NotificationUtils.showInfo('测试通知', 2000);

// 检查图片优化
console.log('图片统计:', window.ImageOptimizer.getImageStats());

// 检查服务工作者
navigator.serviceWorker.getRegistrations().then(console.log);

// 清除缓存测试
window.ServiceWorkerManager.clearCache();
```

## 🐛 常见问题排查

### 1. 页面无法加载
- 检查服务器是否正常启动
- 确认端口号是否正确
- 查看浏览器控制台错误信息

### 2. 模块加载失败
- 检查文件路径是否正确
- 确认 JavaScript 文件是否存在
- 检查 HTTP 状态码

### 3. 功能不工作
- 打开浏览器控制台查看错误
- 运行自动化测试脚本
- 检查网络请求状态

### 4. 样式显示异常
- 检查 CSS 文件是否正确加载
- 验证响应式断点
- 测试不同浏览器兼容性

## 📊 性能测试

### 使用 Chrome DevTools

#### 1. 性能 (Performance) 面板
- 记录页面加载性能
- 分析 JavaScript 执行时间
- 检查渲染性能

#### 2. 内存 (Memory) 面板
- 监控内存使用
- 检查内存泄漏
- 优化垃圾回收

#### 3. Lighthouse 测试
- 运行性能审计
- 检查可访问性
- 验证最佳实践

### 性能指标
- **首次内容绘制 (FCP)**: 应 < 1.5s
- **最大内容绘制 (LCP)**: 应 < 2.5s
- **首次输入延迟 (FID)**: 应 < 100ms
- **累积布局偏移 (CLS)**: 应 < 0.1

## 🎉 测试完成清单

- [ ] 页面正常加载，无 JavaScript 错误
- [ ] 所有模块正确加载
- [ ] 编辑模式功能正常
- [ ] 拖拽排序功能正常
- [ ] 响应式设计在各设备上正常
- [ ] 搜索功能正常
- [ ] 通知系统正常
- [ ] 配置管理正常
- [ ] 图片懒加载正常
- [ ] Service Worker 正常注册
- [ ] 离线访问正常
- [ ] 安全功能正常
- [ ] 性能指标达标

测试完成后，你应该能看到一个功能完整、性能优秀、体验流畅的 HomeDock 应用！
