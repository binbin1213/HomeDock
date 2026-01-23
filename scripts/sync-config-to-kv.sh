#!/bin/bash
# 将本地 apps-config.json 同步到 Vercel KV

set -e

CONFIG_FILE="apps-config.json"
KV_KEY="homedock-config"

echo "📤 正在同步本地配置到 Vercel KV..."
echo ""

# 检查配置文件是否存在
if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ 错误: 找不到 $CONFIG_FILE"
  exit 1
fi

# 显示将要同步的配置
APP_COUNT=$(node -e "const data = require('./$CONFIG_FILE'); console.log(data.applications.length);")
echo "📋 配置信息:"
echo "   应用数量: $APP_COUNT"
echo "   配置文件: $CONFIG_FILE"
echo "   KV Key: $KV_KEY"
echo ""

# 询问确认
read -p "确认要覆盖 Vercel KV 中的配置吗？(y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ 已取消"
  exit 0
fi

# 使用 Vercel CLI 写入 KV
echo "⏳ 正在写入..."
vercel kv put "$KV_KEY" --file "$CONFIG_FILE" --type json

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ 配置已成功同步到 Vercel KV！"
  echo ""
  echo "📝 后续步骤:"
  echo "   1. 等待 Vercel 部署完成（约1分钟）"
  echo "   2. 刷新 HomeDock 网页"
  echo "   3. 现在可以通过管理界面在线修改配置了"
else
  echo ""
  echo "❌ 同步失败，请检查:"
  echo "  1. 是否已安装 Vercel CLI: npm i -g vercel"
  echo "  2. 是否已登录: vercel login"
  echo "  3. 是否在正确的项目目录"
  echo "  4. 项目是否已启用 KV 存储"
  exit 1
fi
