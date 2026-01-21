/**
 * 搜索引擎模块
 * 负责搜索功能和背景管理
 */
class SearchEngine {
  constructor() {
    this.configManager = window.ConfigManager;
    this.init();
  }

  init() {
    this.setupBackgroundManager();
    this.setupSearchShortcuts();
  }

  /**
   * 设置背景管理
   */
  setupBackgroundManager() {
    const changeWallpaperBtn = DOM.find('#change-wallpaper-btn');
    if (changeWallpaperBtn) {
      DOM.on(changeWallpaperBtn, 'click', () => {
        this.changeWallpaper();
      });
    }
  }

  /**
   * 应用背景配置
   */
  applyBackgroundFromConfig(forceRefreshWallpaper = false) {
    const config = this.configManager.getCurrentConfig();
    if (!config) {
      this.setupBingBackground();
      this.applyBackgroundBlur('light');
      return;
    }

    const changeWallpaperBtn = DOM.find('#change-wallpaper-btn');
    const bg = config.background;

    if (!bg || !bg.mode) {
      if (changeWallpaperBtn) DOM.show(changeWallpaperBtn);
      this.setupBingBackground();
      this.applyBackgroundBlur('light');
      return;
    }

    // 应用背景模糊度
    this.applyBackgroundBlur(bg.blur || 'light');

    switch (bg.mode) {
      case 'wallpaper':
        if (changeWallpaperBtn) DOM.show(changeWallpaperBtn);
        this.setupBingBackground(forceRefreshWallpaper);
        break;

      case 'solid':
        if (changeWallpaperBtn) DOM.hide(changeWallpaperBtn);
        this.applySolidBackground(bg.solidColor || '#202124');
        break;

      case 'gradient':
        if (changeWallpaperBtn) DOM.hide(changeWallpaperBtn);
        this.applyGradientBackground(
          bg.gradientFrom || '#141e30',
          bg.gradientTo || '#243b55'
        );
        break;

      default:
        if (changeWallpaperBtn) DOM.show(changeWallpaperBtn);
        this.setupBingBackground();
    }
  }

  /**
   * 设置必应壁纸
   */
  setupBingBackground(forceRefresh = false) {
    const timestamp = forceRefresh ? Date.now() : '';
    const imageUrl = this.resolveWallpaperUrl(`ts=${timestamp}`);

    console.log('🖼️ Setting up Bing wallpaper:', imageUrl);

    // 🚀 性能优化：立即设置基础背景色，避免白屏
    document.body.style.backgroundColor = '#202124';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center center';
    document.body.style.backgroundAttachment = 'fixed';

    // 异步加载壁纸图片
    const img = new Image();

    img.onload = () => {
      console.log('✅ Bing wallpaper loaded successfully');
      // 图片加载完成后替换背景
      document.body.style.backgroundImage =
        `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url('${imageUrl}')`;
    };

    img.onerror = (error) => {
      console.warn('❌ Failed to load Bing wallpaper, using fallback:', error);
      this.applyGradientBackground('#141e30', '#243b55');
    };

    // 添加超时处理
    img.addEventListener('error', () => {
      console.warn('⏰ Bing wallpaper load timeout');
      this.applyGradientBackground('#141e30', '#243b55');
    }, { once: true });

    // 设置超时
    setTimeout(() => {
      if (!img.complete) {
        img.src = ''; // 取消加载
        img.onerror(new Error('Timeout'));
      }
    }, 10000); // 10秒超时

    // 开始异步加载
    img.src = imageUrl;
  }

  /**
   * 应用纯色背景
   */
  applySolidBackground(color) {
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = color;
    document.body.style.backgroundRepeat = 'repeat';
    document.body.style.backgroundSize = 'auto';
    document.body.style.backgroundPosition = 'top left';
    document.body.style.backgroundAttachment = 'scroll';
  }

  /**
   * 应用渐变背景
   */
  applyGradientBackground(fromColor, toColor) {
    document.body.style.backgroundImage =
      `linear-gradient(135deg, ${fromColor}, ${toColor})`;
    document.body.style.backgroundColor = '#000000';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center center';
    document.body.style.backgroundAttachment = 'fixed';
  }

  /**
   * 更换壁纸
   */
  async changeWallpaper() {
    try {
      this.applyBackgroundFromConfig(true);
    } catch (error) {
      console.error('Failed to change wallpaper:', error);
    }
  }

  /**
   * 设置搜索快捷键
   */
  setupSearchShortcuts() {
    DOM.on(document, 'keydown', (e) => {
      // Ctrl/Cmd + K 聚焦搜索框
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = DOM.find('#search-input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }

      // ESC 清空搜索框
      if (e.key === 'Escape') {
        const searchInput = DOM.find('#search-input');
        if (searchInput === document.activeElement) {
          searchInput.value = '';
          searchInput.blur();
          this.hideAutocomplete();
        }
      }
    });

    // 搜索框焦点效果
    const searchInput = DOM.find('#search-input');
    if (searchInput) {
      DOM.on(searchInput, 'focus', () => {
        searchInput.parentElement.classList.add('search-focused');
      });

      DOM.on(searchInput, 'blur', () => {
        searchInput.parentElement.classList.remove('search-focused');
      });
    }
  }

  /**
   * 搜索建议功能
   */
  async getSearchSuggestions(query) {
    if (query.length < 2) return [];

    try {
      // 这里可以集成实际的搜索建议API
      // 例如 Google Suggest API 或其他服务
      const suggestions = await this.fetchGoogleSuggestions(query);
      return suggestions;
    } catch (error) {
      console.warn('Failed to fetch search suggestions:', error);
      return [];
    }
  }

  /**
   * 获取Google搜索建议
   */
  async fetchGoogleSuggestions(query) {
    try {
      const response = await fetch(
        `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`,
        { mode: 'cors' }
      );

      // 由于CORS限制，这里可能需要使用代理或其他方法
      // 暂时返回空数组
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * 隐藏自动完成
   */
  hideAutocomplete() {
    // 由UIController处理
    const autocomplete = DOM.find('.search-autocomplete');
    if (autocomplete) {
      autocomplete.parentNode.removeChild(autocomplete);
    }
  }

  /**
   * 预加载下一张壁纸
   */
  preloadNextWallpaper() {
    try {
      const preloadImg = new Image();
      preloadImg.onload = () => {
        console.log('✅ 壁纸预加载成功');
      };
      preloadImg.onerror = () => {
        console.warn('⚠️ 壁纸预加载失败');
      };
      preloadImg.src = this.resolveWallpaperUrl(
        'preload=true&ts=' + Date.now()
      );
    } catch (error) {
      console.warn('⚠️ 壁纸预加载出错:', error);
    }
  }

  resolveWallpaperUrl(query) {
    try {
      const { origin, hostname } = window.location || {};
      if (hostname && hostname.endsWith('.pages.dev')) {
        return `https://homedock.piaozhitian.workers.dev/bing-wallpaper?${query}`;
      }
      if (origin && origin.startsWith('http')) {
        return origin.replace(/\/+$/, '') + `/bing-wallpaper?${query}`;
      }
      return `/bing-wallpaper?${query}`;
    } catch (e) {
      console.warn('壁纸地址解析失败，回退到相对路径', e);
      return `/bing-wallpaper?${query}`;
    }
  }

  /**
   * 设置壁纸定时切换
   */
  setupWallpaperAutoChange(interval = 3600000) {
    const autoChangeKey = 'homedock-auto-change-wallpaper';
    const enabled = Helpers.Storage.get(autoChangeKey, false);

    if (enabled) {
      setInterval(() => {
        this.changeWallpaper();
      }, interval);
    }
  }

  /**
   * 背景性能优化
   */
  optimizeBackgroundPerformance() {
    document.body.style.willChange = 'background-image';

    const isLowPerformance = this.detectLowPerformanceDevice();

    if (isLowPerformance) {
      const config = this.configManager.getCurrentConfig();
      if (config && config.background && config.background.mode === 'wallpaper') {
        this.applySolidBackground('#202124');
      }
    }
  }

  /**
   * 检测低性能设备
   */
  detectLowPerformanceDevice() {
    const memory = navigator.deviceMemory || 4;
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    return (
      memory < 2 ||
      (connection &&
        connection.effectiveType &&
        ['slow-2g', '2g', '3g'].includes(connection.effectiveType))
    );
  }

  /**
   * 设置背景缓存策略
   */
  setupBackgroundCaching() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('message', (event) => {
          if (event.data.type === 'CACHE_UPDATED') {
            console.log('Background cache updated');
          }
        });
      });
    }
  }

  /**
   * 应用背景模糊效果
   */
  applyBackgroundBlur(blurLevel) {
    const body = document.body;

    body.classList.remove(
      'bg-blur-none',
      'bg-blur-light',
      'bg-blur-medium',
      'bg-blur-heavy'
    );

    switch (blurLevel) {
      case 'none':
        body.classList.add('bg-blur-none');
        break;
      case 'light':
        body.classList.add('bg-blur-light');
        break;
      case 'medium':
        body.classList.add('bg-blur-medium');
        break;
      case 'heavy':
        body.classList.add('bg-blur-heavy');
        break;
      default:
        body.classList.add('bg-blur-light');
        break;
    }

    console.log('🎨 Applied background blur level:', blurLevel);
  }
}

// 创建全局实例
window.SearchEngine = new SearchEngine();
