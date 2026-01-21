/**
 * Vercel API Route: /bing-wallpaper
 * 代理请求必应每日壁纸，实现跨域访问
 */

export default async function handler(req, res) {
  // CORS 配置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 只支持 GET 方法
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 从 URL 参数获取市场（默认中文）
    const url = new URL(req.url);
    const market = url.searchParams.get('mkt') || 'zh-CN';
    const idx = url.searchParams.get('idx') || '0';
    const n = url.searchParams.get('n') || '8';

    // 请求必应 API
    const bingApiUrl = `https://www.bing.com/HPImageArchive.aspx?format=js&idx=${idx}&n=${n}&mkt=${market}`;

    const response = await fetch(bingApiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`Bing API returned ${response.status}`);
    }

    const data = await response.json();
    const images = data.images || [];

    if (images.length === 0) {
      return res.status(502).json({ error: 'No wallpaper available' });
    }

    // 随机选择一张壁纸
    const choice = images[Math.floor(Math.random() * images.length)];
    const imageUrl = 'https://www.bing.com' + choice.url;

    // 重定向到壁纸图片
    return res.redirect(302, imageUrl);
  } catch (error) {
    console.error('Failed to fetch Bing wallpaper:', error);
    return res.status(500).json({
      error: 'Failed to fetch wallpaper',
      message: error.message
    });
  }
}
