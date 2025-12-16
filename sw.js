/**
 * Service Worker for HomeDock
 * 提供缓存、离线支持和性能优化
 */

const CACHE_NAME = 'homedock-v1.0.0';
const STATIC_CACHE = 'homedock-static-v1.0.0';
const IMAGE_CACHE = 'homedock-images-v1.0.0';
const API_CACHE = 'homedock-api-v1.0.0';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/admin.html',
  '/css/style.css',
  '/css/responsive.css',
  '/css/drag-drop.css',
  '/css/image-optimizer.css',
  '/js/utils/helpers.js',
  '/js/utils/notification.js',
  '/js/utils/image-optimizer.js',
  '/js/modules/config-manager.js',
  '/js/modules/app-renderer.js',
  '/js/modules/ui-controller.js',
  '/js/modules/search-engine.js',
  '/apps-config.json',
  '/img/google-official.svg',
  '/img/Bing.svg',
  '/img/baidu.svg',
  '/img/png/favicon.svg',
  '/favicon.ico'
];

// 安装事件
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

// 激活事件
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE &&
                cacheName !== IMAGE_CACHE &&
                cacheName !== API_CACHE &&
                cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Old caches cleared');
        return self.clients.claim();
      })
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非HTTP请求
  if (!request.url.startsWith('http')) {
    return;
  }

  // API请求处理
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // 图片请求处理
  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // 静态资源请求处理
  if (isStaticRequest(request)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // 必应壁纸请求处理
  if (url.pathname === '/bing-wallpaper') {
    event.respondWith(handleBingWallpaperRequest(request));
    return;
  }

  // 其他请求使用网络优先策略
  event.respondWith(
    fetch(request)
      .catch(() => {
        // 网络失败时尝试从缓存获取
        return caches.match(request);
      })
  );
});

/**
 * 处理静态资源请求（缓存优先策略）
 */
async function handleStaticRequest(request) {
  try {
    // 首先从缓存获取
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // 缓存中没有则从网络获取
    const networkResponse = await fetch(request);

    // 只缓存成功的响应
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('Static request failed:', error);

    // 返回离线页面或错误页面
    return new Response('离线状态', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * 处理图片请求（网络优先策略）
 */
async function handleImageRequest(request) {
  try {
    const networkResponse = await fetch(request);

    // 缓存成功的响应
    if (networkResponse.ok) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('Network failed for image, trying cache:', request.url);

    // 网络失败时从缓存获取
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // 返回默认图片
    return new Response('Image not available', {
      status: 404,
      statusText: 'Not Found'
    });
  }
}

/**
 * 处理API请求（网络优先策略，短期缓存）
 */
async function handleApiRequest(request) {
  try {
    const networkResponse = await fetch(request);

    // 缓存成功的GET请求响应，缓存时间较短
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('API request failed, trying cache:', request.url);

    // 网络失败时从缓存获取
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // 返回错误响应
    return new Response(JSON.stringify({ error: 'Network unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 处理必应壁纸请求（网络优先，不缓存）
 */
async function handleBingWallpaperRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.error('Bing wallpaper request failed:', error);

    // 返回默认背景图片URL
    return Response.redirect('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZyIgeDE9IjAiIHkxPSIwIiB4Mj0iMTkyMCIgeTI9IjEwODAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMTQxZTMwO3N0b3Atb3BhY2l0eToxIiAvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6IzI0M2I1NTtzdG9wLW9wYWNpdHk6MSIgLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIiAvPjwvc3ZnPg==', 302);
  }
}

/**
 * 判断是否为图片请求
 */
function isImageRequest(request) {
  const url = new URL(request.url);
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'];

  return imageExtensions.some(ext =>
    url.pathname.toLowerCase().endsWith(ext)
  ) || url.pathname.startsWith('/img/');
}

/**
 * 判断是否为静态资源请求
 */
function isStaticRequest(request) {
  const url = new URL(request.url);
  const staticExtensions = ['.css', '.js', '.html', '.json', '.woff', '.woff2', '.ttf', '.eot'];

  return staticExtensions.some(ext =>
    url.pathname.toLowerCase().endsWith(ext)
  ) || url.pathname.startsWith('/css/') || url.pathname.startsWith('/js/');
}

// 消息处理
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;

    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;

    case 'GET_CACHE_STATS':
      getCacheStats().then(stats => {
        event.ports[0].postMessage({ stats });
      });
      break;

    case 'PRELOAD_IMAGES':
      preloadImages(data.urls).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
  }
});

/**
 * 清除所有缓存
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

/**
 * 获取缓存统计信息
 */
async function getCacheStats() {
  const stats = {};
  const cacheNames = await caches.keys();

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats[cacheName] = keys.length;
  }

  return stats;
}

/**
 * 预加载图片
 */
async function preloadImages(urls) {
  const cache = await caches.open(IMAGE_CACHE);

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.warn('Failed to preload image:', url, error);
    }
  }
}

// 后台同步（如果支持）
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

/**
 * 后台同步操作
 */
async function doBackgroundSync() {
  try {
    // 同步配置数据
    const configResponse = await fetch('/api/config');
    if (configResponse.ok) {
      const cache = await caches.open(API_CACHE);
      await cache.put('/api/config', configResponse);
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// 推送通知（如果需要）
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();

    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: data.tag || 'default'
      })
    );
  }
});

console.log('Service Worker loaded successfully');