/**
 * Service Worker 注册器
 * 负责注册、更新和管理Service Worker
 */
class ServiceWorkerManager {
  constructor() {
    this.swUrl = '/sw.js';
    this.isSupported = 'serviceWorker' in navigator;
    this.controller = null;
    this.updateAvailable = false;
    this.init();
  }

  init() {
    if (!this.isSupported) {
      console.warn('Service Worker not supported');
      return;
    }

    // 注册Service Worker
    this.registerServiceWorker();

    // 监听Service Worker消息
    this.setupMessageListener();

    // 检查更新
    this.checkForUpdates();
  }

  /**
   * 注册Service Worker
   */
  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register(this.swUrl, {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', registration);

      // 监听更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 有新版本可用
            this.updateAvailable = true;
            this.showUpdateNotification();
          }
        });
      });

      // 获取当前控制的Service Worker
      if (navigator.serviceWorker.controller) {
        this.controller = navigator.serviceWorker.controller;
      }

      // 监听控制器变化
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.controller = navigator.serviceWorker.controller;
        window.location.reload(); // 重新加载页面以应用新版本
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  /**
   * 设置消息监听器
   */
  setupMessageListener() {
    const channel = new MessageChannel();

    // 监听来自Service Worker的消息
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, data } = event.data;

      switch (type) {
        case 'CACHE_UPDATED':
          console.log('Cache updated:', data);
          break;

        case 'SYNC_COMPLETED':
          console.log('Background sync completed');
          break;

        default:
          console.log('Service Worker message:', type, data);
      }
    });
  }

  /**
   * 检查更新
   */
  async checkForUpdates() {
    if (!navigator.serviceWorker.controller) {
      return;
    }

    try {
      // 向Service Worker发送获取版本的消息
      const channel = new MessageChannel();

      channel.port1.onmessage = (event) => {
        const { version } = event.data;
        console.log('Service Worker version:', version);
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_VERSION' },
        [channel.port2]
      );

    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }

  /**
   * 显示更新通知
   */
  showUpdateNotification() {
    NotificationUtils.showSuccess('发现新版本，点击刷新按钮更新', 8000);

    // 添加更新按钮到页面
    this.addUpdateButton();
  }

  /**
   * 添加更新按钮
   */
  addUpdateButton() {
    // 检查是否已存在更新按钮
    if (DOM.find('#update-button')) {
      return;
    }

    const updateBtn = DOM.create('button', {
      id: 'update-button',
      className: 'update-button',
      innerHTML: '🔄 更新',
      onclick: () => this.applyUpdate()
    });

    // 添加到页面
    const container = DOM.find('#kg-btn') || DOM.find('#wrap');
    if (container) {
      container.appendChild(updateBtn);
    }

    // 添加样式
    this.addUpdateButtonStyles();
  }

  /**
   * 应用更新
   */
  async applyUpdate() {
    if (!this.updateAvailable) {
      return;
    }

    try {
      // 通知Service Worker跳过等待
      const channel = new MessageChannel();

      navigator.serviceWorker.controller.postMessage(
        { type: 'SKIP_WAITING' },
        [channel.port2]
      );

      NotificationUtils.showSuccess('正在更新应用...');

      // 显示加载指示器
      this.showLoadingOverlay();

    } catch (error) {
      console.error('Failed to apply update:', error);
      NotificationUtils.showError('更新失败，请手动刷新页面');
    }
  }

  /**
   * 显示加载遮罩
   */
  showLoadingOverlay() {
    const overlay = DOM.create('div', {
      id: 'update-loading-overlay',
      className: 'update-loading-overlay'
    }, [
      DOM.create('div', {
        className: 'update-loading-content'
      }, [
        DOM.create('div', { className: 'update-loading-spinner' }),
        DOM.create('p', {}, ['正在更新应用...'])
      ])
    ]);

    document.body.appendChild(overlay);
  }

  /**
   * 添加更新按钮样式
   */
  addUpdateButtonStyles() {
    if (document.getElementById('update-button-styles')) {
      return;
    }

    const styles = DOM.create('style', {
      id: 'update-button-styles'
    });

    styles.textContent = `
      .update-button {
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        cursor: pointer;
        margin-left: 10px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
      }

      .update-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
      }

      .update-loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        backdrop-filter: blur(5px);
      }

      .update-loading-content {
        text-align: center;
        color: white;
      }

      .update-loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: update-spin 1s ease-in-out infinite;
        margin: 0 auto 20px;
      }

      @keyframes update-spin {
        to { transform: rotate(360deg); }
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * 清除缓存
   */
  async clearCache() {
    if (!navigator.serviceWorker.controller) {
      NotificationUtils.showError('Service Worker未激活');
      return;
    }

    try {
      const channel = new MessageChannel();

      channel.port1.onmessage = (event) => {
        const { success } = event.data;
        if (success) {
          NotificationUtils.showSuccess('缓存已清除');
        } else {
          NotificationUtils.showError('清除缓存失败');
        }
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_CACHE' },
        [channel.port2]
      );

    } catch (error) {
      console.error('Failed to clear cache:', error);
      NotificationUtils.showError('清除缓存失败');
    }
  }

  /**
   * 获取缓存统计
   */
  async getCacheStats() {
    if (!navigator.serviceWorker.controller) {
      return null;
    }

    try {
      const channel = new MessageChannel();

      return new Promise((resolve) => {
        channel.port1.onmessage = (event) => {
          resolve(event.data.stats);
        };

        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_CACHE_STATS' },
          [channel.port2]
        );
      });

    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return null;
    }
  }

  /**
   * 预加载图片
   */
  async preloadImages(urls) {
    if (!navigator.serviceWorker.controller || !urls.length) {
      return;
    }

    try {
      const channel = new MessageChannel();

      channel.port1.onmessage = (event) => {
        const { success } = event.data;
        if (success) {
          console.log('Images preloaded successfully');
        }
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'PRELOAD_IMAGES', data: { urls } },
        [channel.port2]
      );

    } catch (error) {
      console.error('Failed to preload images:', error);
    }
  }
}

// 创建全局实例
window.ServiceWorkerManager = new ServiceWorkerManager();