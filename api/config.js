/**
 * Vercel API Route: /api/config
 * 用于读取和保存 HomeDock 的应用配置
 *
 * 依赖: @vercel/kv (Vercel KV 存储)
 */

import { kv } from '@vercel/kv';

// 默认配置模板
const defaultConfig = {
  applications: [
    {
      name: '示例应用',
      external_url: 'https://example.com',
      internal_url: 'http://192.168.1.100:8080',
      icon: 'img/png/Edge.svg'
    }
  ],
  background: {
    mode: 'wallpaper',
    solidColor: '#202124',
    gradientFrom: '#141e30',
    gradientTo: '#243b55',
    blur: 0,
    opacity: 1
  }
};

/**
 * 从 KV 读取配置
 */
async function getConfig() {
  try {
    const config = await kv.get('homedock-config');
    if (config) {
      return typeof config === 'string' ? JSON.parse(config) : config;
    }
    return null;
  } catch (error) {
    console.error('Failed to get config from KV:', error);
    return null;
  }
}

/**
 * 保存配置到 KV
 */
async function saveConfig(config) {
  try {
    await kv.set('homedock-config', JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Failed to save config to KV:', error);
    return false;
  }
}

export default async function handler(req, res) {
  // CORS 配置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    // GET: 读取配置
    if (req.method === 'GET') {
      const config = await getConfig();
      if (config) {
        return res.status(200).json(config);
      }
      // 无配置时返回默认配置（不保存，让前端决定是否回写）
      return res.status(200).json(defaultConfig);
    }

    // POST/PUT: 保存配置
    if (req.method === 'POST' || req.method === 'PUT') {
      const config = req.body;

      // 验证配置结构
      if (!config || typeof config !== 'object') {
        return res.status(400).json({ error: 'Invalid config format' });
      }

      // 确保 background 字段存在
      if (!config.background) {
        config.background = defaultConfig.background;
      }

      const success = await saveConfig(config);
      if (success) {
        return res.status(200).json({ status: 'success', message: 'Config saved' });
      }
      return res.status(500).json({ error: 'Failed to save config' });
    }

    // DELETE: 删除配置（恢复默认值）
    if (req.method === 'DELETE') {
      const success = await saveConfig(defaultConfig);
      if (success) {
        return res.status(200).json({ status: 'success', message: 'Config reset to default' });
      }
      return res.status(500).json({ error: 'Failed to reset config' });
    }

    // 其他方法不支持
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
