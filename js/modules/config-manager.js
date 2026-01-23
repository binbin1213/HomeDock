/**
 * 配置管理模块
 * 负责应用配置的加载、保存和同步
 */
class ConfigManager {
  constructor() {
    this.CONFIG_KEY = 'homedock-config';
    this.API_ENDPOINT = this.resolveApiEndpoint();
    this.cachedConfig = null;
  }

  resolveApiEndpoint() {
    try {
      const { origin, hostname } = window.location || {};

      // 当托管在 Cloudflare Pages（*.pages.dev）时，指向已部署的 workers.dev 域名
      if (hostname && hostname.endsWith('.pages.dev')) {
        return 'https://homedock.piaozhitian.workers.dev/api/config';
      }

      // 默认：相对当前站点的 /api/config（适用于本地 dev-server 和自定义域）
      if (origin && origin.startsWith('http')) {
        return origin.replace(/\/+$/, '') + '/api/config';
      }

      return '/api/config';
    } catch (e) {
      console.warn('API 端点解析失败，回退到默认 /api/config', e);
      return '/api/config';
    }
  }

  /**
   * 带重试机制的配置加载
   */
  async loadConfigWithRetry(maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const config = await this.loadConfigFromServer();
        if (config && this.validateConfig(config)) {
          this.cachedConfig = config;
          localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
          return config;
        }
      } catch (error) {
        console.warn(`配置加载尝试 ${i + 1} 失败:`, error);
        if (i === maxRetries - 1) {
          NotificationUtils.showWarning('配置加载失败，使用本地缓存');
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }

    // 回退到本地配置
    return this.loadLocalConfig();
  }

  /**
   * 从服务器加载配置
   */
  async loadConfigFromServer() {
    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // 服务器返回 null 表示 KV 中没有配置，回退到本地配置
      if (data === null) {
        console.info('服务器返回 null，回退到本地配置');
        return null;
      }

      if (!this.validateConfig(data)) {
        throw new Error('服务器返回的配置格式无效');
      }

      return this.normalizeConfig(data);
    } catch (error) {
      console.error('从服务器加载配置失败:', error);
      return null;
    }
  }

  /**
   * 加载本地配置
   */
  loadLocalConfig() {
    try {
      const localConfig = JSON.parse(localStorage.getItem(this.CONFIG_KEY));

      if (localConfig && this.validateConfig(localConfig)) {
        this.cachedConfig = localConfig;
        return localConfig;
      }

      // 如果本地没有有效配置，加载默认配置
      return this.loadDefaultConfig();
    } catch (error) {
      console.error('加载本地配置失败:', error);
      return this.loadDefaultConfig();
    }
  }

  /**
   * 加载默认配置
   */
  async loadDefaultConfig() {
    try {
      const response = await fetch('apps-config.json');
      const defaultConfig = await response.json();
      const normalizedConfig = this.normalizeConfig(defaultConfig);

      this.cachedConfig = normalizedConfig;
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(normalizedConfig));

      return normalizedConfig;
    } catch (error) {
      console.error('加载默认配置失败:', error);
      NotificationUtils.showError('配置加载失败，请刷新页面重试');
      return null;
    }
  }

  /**
   * 保存配置到本地和服务器
   */
  async saveConfig(config) {
    if (!this.validateConfig(config)) {
      throw new Error('配置格式无效');
    }

    // 保存到本地存储
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
    this.cachedConfig = config;

    // 尝试保存到服务器
    try {
      await this.saveConfigToServer(config);
      NotificationUtils.showSuccess('配置已保存');
    } catch (error) {
      console.warn('保存到服务器失败，仅保存到本地:', error);
      NotificationUtils.showWarning('配置已保存到本地');
    }
  }

  /**
   * 保存配置到服务器
   */
  async saveConfigToServer(config) {
    const response = await fetch(this.API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      throw new Error(`保存失败: ${response.status}`);
    }
  }

  /**
   * 验证配置格式
   */
  validateConfig(config) {
    return config &&
           typeof config === 'object' &&
           Array.isArray(config.applications) &&
           config.applications.every(app =>
             typeof app.name === 'string' &&
             app.name.trim().length > 0
           );
  }

  /**
   * 标准化配置格式
   */
  normalizeConfig(config) {
    if (!config.background) {
      config.background = {
        mode: 'wallpaper',
        solidColor: '#202124',
        gradientFrom: '#141e30',
        gradientTo: '#243b55'
      };
    }

    // 确保所有应用都有必要的字段
    config.applications = config.applications.map(app => ({
      name: app.name || '未命名应用',
      external_url: app.external_url || '',
      internal_url: app.internal_url || '',
      icon: app.icon || 'img/png/favicon.svg',
      ...app
    }));

    return config;
  }

  /**
   * 获取当前配置
   */
  getCurrentConfig() {
    return this.cachedConfig || this.loadLocalConfig();
  }

  /**
   * 添加应用
   */
  addApplication(app) {
    const config = this.getCurrentConfig();
    config.applications.push(app);
    return this.saveConfig(config);
  }

  /**
   * 更新应用
   */
  updateApplication(index, app) {
    const config = this.getCurrentConfig();
    if (config.applications[index]) {
      config.applications[index] = { ...config.applications[index], ...app };
      return this.saveConfig(config);
    }
    throw new Error('应用不存在');
  }

  /**
   * 删除应用
   */
  deleteApplication(index) {
    const config = this.getCurrentConfig();
    if (config.applications[index]) {
      config.applications.splice(index, 1);
      return this.saveConfig(config);
    }
    throw new Error('应用不存在');
  }

  /**
   * 重新排序应用
   */
  reorderApplications(fromIndex, toIndex) {
    const config = this.getCurrentConfig();
    const [movedApp] = config.applications.splice(fromIndex, 1);
    config.applications.splice(toIndex, 0, movedApp);
    return this.saveConfig(config);
  }

  /**
   * 更新背景设置
   */
  updateBackground(background) {
    const config = this.getCurrentConfig();
    config.background = { ...config.background, ...background };
    return this.saveConfig(config);
  }
}

// 导出单例实例
window.ConfigManager = new ConfigManager();
