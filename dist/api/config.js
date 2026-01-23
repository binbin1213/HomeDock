/**
 * Vercel API Route: /api/config
 * 用于读取和保存 HomeDock 的应用配置
 *
 * 使用 Vercel Edge Config 存储配置
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { get, getAll } from '@vercel/edge-config';

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
 * 从 Edge Config 读取配置
 */
async function getConfigFromEdge() {
  try {
    const config = await get('homedock-config');
    return config;
  } catch (error) {
    console.log('Edge Config not ready or missing:', error.message);
    return null;
  }
}

/**
 * 从本地文件读取配置
 */
function getConfigFromFile() {
  try {
    const configPath = join(process.cwd(), 'apps-config.json');
    const configContent = readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('Failed to read config file:', error);
    return null;
  }
}

/**
 * 读取配置（优先 Edge Config，回退到文件）
 */
async function getConfig() {
  // 先尝试从 Edge Config 读取
  const edgeConfig = await getConfigFromEdge();
  if (edgeConfig) {
    return edgeConfig;
  }

  // 回退到本地文件
  const fileConfig = getConfigFromFile();
  if (fileConfig) {
    return fileConfig;
  }

  // 最后回退到默认配置
  return defaultConfig;
}

/**
 * 保存配置（注意：Edge Config 不支持通过 API 动态写入）
 * 返回 false 表示不支持保存
 */
async function saveConfig(config) {
  // Edge Config 需要在 Dashboard 手动更新
  // 返回 false，让前端知道无法保存
  return false;
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
      return res.status(200).json(config);
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
      if (!success) {
        return res.status(501).json({
          error: 'Saving config via API is not supported',
          message: '请使用本地文件编辑方式修改配置',
          hint: '编辑 apps-config.json 文件后重新部署'
        });
      }

      return res.status(200).json({ status: 'success', message: 'Config saved' });
    }

    // 其他方法不支持
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
