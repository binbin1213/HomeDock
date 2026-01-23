/**
 * Vercel API Route: /api/config
 * 用于读取 HomeDock 的应用配置
 *
 * 直接从项目根目录读取 apps-config.json
 */

import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 读取配置文件
 */
function getConfig() {
  try {
    const configPath = join(process.cwd(), 'apps-config.json');
    const configContent = readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('Failed to read config file:', error);
    // 返回默认配置
    return {
      applications: [],
      background: {
        mode: 'wallpaper',
        solidColor: '#202124',
        gradientFrom: '#141e30',
        gradientTo: '#243b55',
        blur: 'light'
      }
    };
  }
}

export default async function handler(req, res) {
  // CORS 配置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    // 只支持 GET 请求
    if (req.method === 'GET') {
      const config = getConfig();
      return res.status(200).json(config);
    }

    // 其他方法不支持
    return res.status(405).json({
      error: 'Method not allowed',
      message: '只支持 GET 请求',
      hint: '请通过编辑 apps-config.json 文件来修改配置'
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
