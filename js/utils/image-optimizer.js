/**
 * 图片优化工具
 * 支持懒加载、WebP格式、预加载等功能
 */
class ImageOptimizer {
  constructor() {
    this.supportsWebP = this.checkWebPSupport();
    this.loadedImages = new Set();
    this.observerOptions = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    };
    this.init();
  }

  init() {
    // 初始化懒加载观察器
    this.initLazyLoading();

    // 预加载关键图片
    this.preloadCriticalImages();

    // 监听图片错误
    this.setupImageErrorHandling();
  }

  /**
   * 检查WebP支持
   */
  checkWebPSupport() {
    return Promise.resolve(false);
  }

  /**
   * 获取优化后的图片URL
   */
  async getOptimizedImageUrl(originalUrl, options = {}) {
    if (!originalUrl || originalUrl.startsWith('#')) {
      return originalUrl;
    }

    const {
      width,
      height,
      quality = 80,
      format = 'auto'
    } = options;

    // 如果是外部URL，直接返回
    if (originalUrl.startsWith('http')) {
      return originalUrl;
    }

    // 构建优化的URL
    let optimizedUrl = originalUrl;

    // 检查WebP支持
    if (format === 'auto') {
      const webPSupported = await this.supportsWebP;
      if (webPSupported && this.canConvertToWebP(originalUrl)) {
        optimizedUrl = originalUrl.replace(/\.(png|jpg|jpeg)$/i, '.webp');
      }
    } else if (format === 'webp') {
      optimizedUrl = originalUrl.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    }

    // 添加尺寸参数（如果支持）
    if ((width || height) && this.supportsImageParams(optimizedUrl)) {
      const params = new URLSearchParams();
      if (width) params.append('w', width);
      if (height) params.append('h', height);
      if (quality !== 80) params.append('q', quality);

      const separator = optimizedUrl.includes('?') ? '&' : '?';
      optimizedUrl += separator + params.toString();
    }

    return optimizedUrl;
  }

  /**
   * 检查是否可以转换为WebP
   */
  canConvertToWebP(url) {
    const webpExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
    return webpExtensions.some(ext => url.toLowerCase().endsWith(ext));
  }

  /**
   * 检查URL是否支持图片参数
   */
  supportsImageParams(url) {
    // 这里可以根据实际情况判断是否支持参数化URL
    // 例如：CDN服务、图片处理服务等
    return false;
  }

  /**
   * 初始化懒加载
   */
  initLazyLoading() {
    if (!('IntersectionObserver' in window)) {
      // 回退到立即加载
      this.loadAllImages();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, this.observerOptions);

    // 观察所有图片
    DOM.findAll('img[data-src]').forEach(img => {
      observer.observe(img);
    });
  }

  /**
   * 加载单个图片
   */
  async loadImage(img) {
    const src = img.dataset.src;
    if (!src || this.loadedImages.has(src)) {
      return;
    }

    try {
      // 添加加载状态
      img.classList.add('image-loading');

      // 获取优化后的URL
      const optimizedUrl = await this.getOptimizedImageUrl(src, {
        width: img.dataset.width,
        height: img.dataset.height
      });

      // 创建新图片进行预加载
      const newImg = new Image();

      newImg.onload = () => {
        img.src = optimizedUrl;
        img.classList.remove('image-loading');
        img.classList.add('image-loaded');
        this.loadedImages.add(src);

        // 淡入效果
        Animation.fadeIn(img, 300);
      };

      newImg.onerror = () => {
        // 回退到原始URL
        if (optimizedUrl !== src) {
          img.src = src;
          img.classList.remove('image-loading');
          img.classList.add('image-loaded');
          this.loadedImages.add(src);
        } else {
          img.classList.remove('image-loading');
          img.classList.add('image-error');
          this.handleImageError(img);
        }
      };

      newImg.src = optimizedUrl;

    } catch (error) {
      console.error('Failed to load image:', src, error);
      img.classList.remove('image-loading');
      img.classList.add('image-error');
      this.handleImageError(img);
    }
  }

  /**
   * 加载所有图片（不支持IntersectionObserver时的回退）
   */
  async loadAllImages() {
    const images = DOM.findAll('img[data-src]');

    for (const img of images) {
      await this.loadImage(img);
    }
  }

  /**
   * 预加载关键图片
   */
  async preloadCriticalImages() {
    const criticalImages = [
      'img/google-official.svg',
      'img/Bing.svg',
      'img/baidu.svg'
    ];

    for (const src of criticalImages) {
      try {
        const optimizedUrl = await this.getOptimizedImageUrl(src);
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = optimizedUrl;
        document.head.appendChild(link);
      } catch (error) {
        console.warn('Failed to preload critical image:', src);
      }
    }
  }

  /**
   * 处理图片错误
   */
  handleImageError(img) {
    // 设置默认图标
    if (!img.classList.contains('fallback-applied')) {
      img.src = 'img/png/favicon.svg';
      img.classList.add('fallback-applied');
      img.alt = '图标加载失败';
    }
  }

  /**
   * 设置图片错误处理
   */
  setupImageErrorHandling() {
    DOM.on(document, 'error', (e) => {
      if (e.target.tagName === 'IMG') {
        this.handleImageError(e.target);
      }
    }, true);
  }

  /**
   * 创建响应式图片元素
   */
  createResponsiveImage(src, alt, options = {}) {
    const {
      sizes = '100vw',
      breakpoints = [480, 768, 1024],
      lazy = true
    } = options;

    const picture = DOM.create('picture');

    // 为不同断点创建源
    if (breakpoints.length > 0) {
      for (let i = 0; i < breakpoints.length; i++) {
        const breakpoint = breakpoints[i];
        const width = breakpoint;

        const source = DOM.create('source', {
          'media': `(min-width: ${breakpoint}px)`,
          'sizes': sizes,
          'type': 'image/webp',
          'data-srcset': `${src}?w=${width}&format=webp ${width}w`
        });

        picture.appendChild(source);
      }
    }

    // 默认img元素
    const img = DOM.create('img', {
      'data-src': lazy ? src : src,
      'alt': alt,
      'loading': lazy ? 'lazy' : 'eager',
      'decoding': 'async'
    });

    if (lazy) {
      img.classList.add('lazy-image');
    }

    picture.appendChild(img);
    return picture;
  }

  /**
   * 批量优化应用图标
   */
  async optimizeAppIcons() {
    const appImages = DOM.findAll('.app-item img');

    for (const img of appImages) {
      if (img.src && !img.dataset.processed) {
        try {
          const optimizedUrl = await this.getOptimizedImageUrl(img.src, {
            width: 64,
            height: 64,
            quality: 75
          });

          if (optimizedUrl !== img.src) {
            // 创建新图片进行测试
            const testImg = new Image();
            testImg.onload = () => {
              img.src = optimizedUrl;
              img.dataset.processed = 'true';
            };
            testImg.src = optimizedUrl;
          } else {
            img.dataset.processed = 'true';
          }
        } catch (error) {
          console.warn('Failed to optimize app icon:', img.src);
          img.dataset.processed = 'true';
        }
      }
    }
  }

  /**
   * 图片缓存管理
   */
  clearImageCache() {
    this.loadedImages.clear();

    // 清除Service Worker缓存（如果有）
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.filter(name => name.includes('image')).map(name => caches.delete(name))
        );
      });
    }
  }

  /**
   * 获取图片统计信息
   */
  getImageStats() {
    const totalImages = DOM.findAll('img').length;
    const loadedImages = DOM.findAll('img.image-loaded').length;
    const errorImages = DOM.findAll('img.image-error').length;
    const loadingImages = DOM.findAll('img.image-loading').length;

    return {
      total: totalImages,
      loaded: loadedImages,
      error: errorImages,
      loading: loadingImages,
      successRate: totalImages > 0 ? ((loadedImages / totalImages) * 100).toFixed(1) : 0
    };
  }
}

// 创建全局实例
window.ImageOptimizer = new ImageOptimizer();
