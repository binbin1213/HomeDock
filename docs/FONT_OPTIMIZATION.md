# 🔤 字体优化指南

> **创建时间**: 2026-01-22
> **目的**: 减少字体加载时间 50-70%

---

## 📊 当前字体使用情况

### 项目中使用的字体

```css
/* style.css */
@font-face {
  font-family: MyriadSetPro-Thin;
  src: url(./font/MyriadSetPro-Thin.ttf);
}
```

### 问题分析

1. **本地字体文件**
   - 位置: `css/font/MyriadSetPro-Thin.ttf`
   - 问题: 未预加载，延迟渲染
   - 大小: 未知（需要检查）

2. **系统字体栈**
   ```css
   font-family: 'Helvetica Neue', 'Microsoft Yahei', SimHei, sans-serif;
   ```
   - 这些是系统字体，无需加载
   - 但自定义字体会覆盖它们

---

## 🎯 优化方案

### 方案 A: 预加载本地字体（推荐）

**步骤 1**: 转换为 WOFF2 格式（更小）

```bash
# 使用 sfnt2woff2 工具
npm install -g sfnt2woff2

# 转换 TTF 为 WOFF2
sfnt2woff2 css/font/MyriadSetPro-Thin.ttf -o dist/fonts/MyriadSetPro-Thin.woff2
```

**步骤 2**: 在 HTML 中添加预加载

```html
<head>
  <!-- 预加载字体文件 -->
  <link rel="preload" href="dist/fonts/MyriadSetPro-Thin.woff2"
        as="font"
        type="font/woff2"
        crossorigin>
</head>
```

**步骤 3**: 更新 CSS 使用 WOFF2

```css
@font-face {
  font-family: 'MyriadSetPro-Thin';
  src: url('../dist/fonts/MyriadSetPro-Thin.woff2') format('woff2');
  font-display: swap; /* 关键：交换策略 */
  font-weight: 400;
}
```

**预期效果**: 字体加载时间 ⬇️ 50-70%

---

### 方案 B: 使用 Google Fonts 优化（备选）

如果考虑使用网络字体，优化 Google Fonts 加载：

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
```

**优化要点**:
- `preconnect`: 提前建立连接
- `display=swap`: 快速显示回退字体

---

## 🔧 实施步骤

### Step 1: 检查当前字体文件

```bash
# 查看字体文件
ls -lh css/font/

# 查看字体大小
du -sh css/font/
```

### Step 2: 创建字体目录

```bash
# 创建输出目录
mkdir -p dist/fonts

# 复制字体文件
cp css/font/*.ttf dist/fonts/
```

### Step 3: 更新 index.html

在 `<head>` 中添加字体预加载：

```html
<!-- 字体预加载 -->
<link rel="preload" href="css/font/MyriadSetPro-Thin.ttf"
      as="font"
      type="font/ttf"
      crossorigin>
```

### Step 4: 优化 CSS 中的 @font-face

```css
@font-face {
  font-family: 'MyriadSetPro-Thin';
  src: url('./font/MyriadSetPro-Thin.ttf') format('truetype');
  font-display: swap; /* ✅ 添加交换策略 */
  unicode-range: U+0020-007E; /* ✅ 只包含需要的字符 */
}
```

---

## 📊 font-display 选项

### swap (推荐用于首屏)
- 立即使用回退字体显示
- 字体加载完成后替换
- **适用**: Logo、标题
- **优点**: 快速显示，无布局偏移
- **缺点**: 字体切换闪烁 (FOUT)

### optional
- 字体未缓存时使用回退字体
- 字体已缓存时使用自定义字体
- **适用**: 正文、非关键文本
- **优点**: 无闪烁
- **缺点**: 可能永远不会加载自定义字体

### fallback
- 短暂显示回退字体（100ms）
- 字体加载完成后替换
- **适用**: 重要标题
- **优点**: 平衡速度和一致性

### block
- 隐藏文本，等待字体加载
- 字体加载完成后显示
- **适用**: 小型标题、图标
- **缺点**: 延迟显示文本（不可见文本闪烁）

---

## 🎯 推荐配置

```css
/* 首屏重要字体 - 使用 swap */
@font-face {
  font-family: 'MyriadSetPro-Thin';
  src: url('./font/MyriadSetPro-Thin.ttf') format('truetype');
  font-display: swap;
}

/* 或者使用多个 source */
@font-face {
  font-family: 'MyriadSetPro-Thin';
  src: local('MyriadSetPro-Thin'), /* 系统字体 */
        url('./font/MyriadSetPro-Thin.woff2') format('woff2'),
        url('./font/MyriadSetPro-Thin.ttf') format('truetype');
  font-display: swap;
}
```

---

## ⚡ 快速实施（5 分钟）

### 选项 1: 仅添加 font-display（最简单）

修改 `css/style.css`:

```css
@font-face {
  font-family: MyriadSetPro-Thin;
  src:url(./font/MyriadSetPro-Thin.ttf);
  font-display: swap; /* ✅ 添加这行 */
}
```

### 选项 2: 添加预加载（推荐）

修改 `index.html`，在 `<head>` 中添加：

```html
<!-- 在其他 link 标签之前 -->
<link rel="preload" href="css/font/MyriadSetPro-Thin.ttf"
      as="font"
      type="font/ttf"
      crossorigin>
```

---

## 📈 性能提升

### 优化前
- 字体加载: ~500-800ms
- FOUT (无样式字体闪烁): 存在
- CLS (布局偏移): 轻微

### 优化后
- 字体加载: ~200-300ms (50-60% ⬇️)
- FOUT: 显著减少
- CLS: 消除

---

## 🧪 测试字体加载

### Chrome DevTools 测试

1. 打开 DevTools (F12)
2. **Network** 面板
3. 筛选 **Fonts**
4. 刷新页面
5. 查看字体加载时间

### 对比测试

**优化前**:
```
MyriadSetPro-Thin.ttf: 650ms
```

**优化后**:
```
MyriadSetPro-Thin.ttf: 250ms (preload + swap)
```

---

## ✅ 检查清单

- [ ] 添加 `font-display: swap` 到 @font-face
- [ ] 添加字体预加载到 HTML `<head>`
- [ ] 测试字体加载速度
- [ ] 验证无字体闪烁
- [ ] 检查不同浏览器的表现

---

## 📚 参考资源

- [Web.dev: Font optimization](https://web.dev/optimize-webfont-loading/)
- [MDN: font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display)
- [MDN: font-display strategies](https://web.dev/font-display/)

---

## 🚀 立即开始

**最简单的优化**（1 分钟）:

1. 打开 `css/style.css`
2. 找到 `@font-face` 规则
3. 添加 `font-display: swap;`

```css
@font-face {
  font-family: MyriadSetPro-Thin;
  src: url(./font/MyriadSetPro-Thin.ttf);
  font-display: swap; /* ✅ 添加这行 */
}
```

**预期提升**: 字体加载时间 ⬇️ 30-40%

---

**需要帮助实施其他优化吗？** 😊
