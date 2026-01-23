#!/bin/bash
# 清除 Vercel KV 中的 HomeDock 配置

echo "正在清除 Vercel KV 中的 homedock-config..."
vercel kv delete homedock-config

if [ $? -eq 0 ]; then
  echo "✅ 配置已清除！刷新网页后将使用 apps-config.json 中的配置"
else
  echo "❌ 清除失败，请检查:"
  echo "  1. 是否已安装 Vercel CLI: npm i -g vercel"
  echo "  2. 是否已登录: vercel login"
  echo "  3. 是否在正确的项目目录"
fi
