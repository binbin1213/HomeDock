#!/bin/bash
# 将本地 apps-config.json 同步到 Vercel KV

set -e

CONFIG_FILE="apps-config.json"
API_ENDPOINT="api/config"

echo "📤 正在同步本地配置到 Vercel..."
echo ""

# 检查配置文件是否存在
if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ 错误: 找不到 $CONFIG_FILE"
  exit 1
fi

# 检查是否已登录 Vercel
if ! vercel whoami > /dev/null 2>&1; then
  echo "❌ 错误: 未登录 Vercel"
  echo "   请先运行: vercel login"
  exit 1
fi

# 显示将要同步的配置
APP_COUNT=$(node -e "const data = require('./$CONFIG_FILE'); console.log(data.applications.length);")
echo "📋 配置信息:"
echo "   应用数量: $APP_COUNT"
echo "   配置文件: $CONFIG_FILE"
echo ""

# 询问确认
read -p "确认要上传配置吗？(y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ 已取消"
  exit 0
fi

# 获取部署 URL
echo "⏳ 正在获取部署 URL..."
PROD_URL=$(vercel ls --prod 2>/dev/null | grep -E 'homedock|HomeDock' | head -1 | awk '{print $2}')

if [ -z "$PROD_URL" ]; then
  echo "⚠️  无法获取生产环境 URL"
  echo "🔍 请在 Vercel Dashboard 复制你的生产环境 URL"
  read -p "输入 URL (如: https://homedock-xxx.vercel.app): " PROD_URL
fi

if [ -z "$PROD_URL" ]; then
  echo "❌ URL 不能为空"
  exit 1
fi

# 去除末尾斜杠
PROD_URL=$(echo "$PROD_URL" | sed 's:/*$::')

echo "📍 目标: $PROD_URL"
echo ""

# 使用 curl 上传配置
echo "⏳ 正在上传..."
HTTP_CODE=$(curl -X POST \
  -H "Content-Type: application/json" \
  -d @"$CONFIG_FILE" \
  -s -o /dev/null \
  -w "%{http_code}" \
  "$PROD_URL/$API_ENDPOINT")

if [ "$HTTP_CODE" = "200" ]; then
  echo ""
  echo "✅ 配置已成功上传到 Vercel KV！"
  echo ""
  echo "📝 后续步骤:"
  echo "   1. 刷新 HomeDock 网页: $PROD_URL"
  echo "   2. 现在可以通过管理界面在线修改配置了"
else
  echo ""
  echo "❌ 上传失败 (HTTP $HTTP_CODE)"
  echo ""
  echo "💡 手动操作方法:"
  echo "   1. 打开 Vercel Dashboard"
  echo "   2. 进入 Storage → KV"
  echo "   3. 添加 key: homedock-config"
  echo "   4. 复制 $CONFIG_FILE 的内容作为 value"
  exit 1
fi
