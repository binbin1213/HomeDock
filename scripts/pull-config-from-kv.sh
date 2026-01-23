#!/bin/bash
# 从 Vercel KV 拉取配置到本地 apps-config.json

set -e

CONFIG_FILE="apps-config.json"
KV_KEY="homedock-config"
BACKUP_FILE="apps-config.json.backup"

echo "📥 正在从 Vercel KV 拉取配置..."
echo ""

# 备份现有配置
if [ -f "$CONFIG_FILE" ]; then
  cp "$CONFIG_FILE" "$BACKUP_FILE"
  echo "📦 已备份当前配置到: $BACKUP_FILE"
fi

# 从 KV 读取配置
echo "⏳ 正在读取..."
vercel kv get "$KV_KEY" --type json > "$CONFIG_FILE.tmp"

if [ $? -eq 0 ]; then
  mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"

  # 显示拉取的配置信息
  APP_COUNT=$(node -e "const data = require('./$CONFIG_FILE'); console.log(data.applications.length);")
  echo ""
  echo "✅ 配置已成功拉取！"
  echo "   应用数量: $APP_COUNT"
  echo "   保存位置: $CONFIG_FILE"
  echo ""
  echo "📝 后续步骤:"
  echo "   1. 运行 'npm run build' 重新构建"
  echo "   2. 提交代码: git add . && git commit -m 'sync: update config from KV'"
else
  rm -f "$CONFIG_FILE.tmp"
  echo ""
  echo "❌ 拉取失败"
  echo "💡 如果 KV 中没有配置，可以先运行 ./scripts/sync-config-to-kv.sh"
  exit 1
fi
