/**
 * 模块加载器
 * 确保所有模块按正确顺序加载
 */

class ModuleLoader {
  constructor() {
    this.modules = {
      // 工具模块 - 无依赖
      'helpers': { loaded: false, file: 'js/utils/helpers.js', deps: [] },
      'notification': { loaded: false, file: 'js/utils/notification.js', deps: ['helpers'] },
      'service-worker': { loaded: false, file: 'js/utils/service-worker.js', deps: ['helpers'] },
      'image-optimizer': { loaded: false, file: 'js/utils/image-optimizer.js', deps: ['helpers', 'notification'] },

      // 核心模块 - 依赖工具模块
      'config-manager': { loaded: false, file: 'js/modules/config-manager.js', deps: ['helpers', 'notification'] },
      'app-renderer': { loaded: false, file: 'js/modules/app-renderer.js', deps: ['helpers', 'notification', 'config-manager'] },
      'ui-controller': { loaded: false, file: 'js/modules/ui-controller.js', deps: ['helpers', 'notification', 'config-manager', 'app-renderer'] },
      'search-engine': { loaded: false, file: 'js/modules/search-engine.js', deps: ['helpers', 'notification', 'config-manager', 'image-optimizer'] }
    };

    this.globalNames = {
      'helpers': 'Helpers',
      'notification': 'NotificationUtils',
      'service-worker': 'ServiceWorkerManager',
      'image-optimizer': 'ImageOptimizer',
      'config-manager': 'ConfigManager',
      'app-renderer': 'AppRenderer',
      'ui-controller': 'UIManager',
      'search-engine': 'SearchEngine'
    };

    this.loadedModules = new Set();
    this.loadPromises = new Map();
    this.init();
  }

  init() {
    // 标记已通过script标签加载的模块
    this.checkLoadedModules();
  }

  checkLoadedModules() {
    Object.keys(this.globalNames).forEach(moduleKey => {
      const globalName = this.globalNames[moduleKey];
      if (typeof window[globalName] !== 'undefined') {
        this.modules[moduleKey].loaded = true;
        this.loadedModules.add(moduleKey);
        console.log(`✅ 模块已加载: ${moduleKey} (${globalName})`);
      }
    });
  }

  async loadModule(moduleKey) {
    if (this.loadedModules.has(moduleKey)) {
      return true;
    }

    if (this.loadPromises.has(moduleKey)) {
      return await this.loadPromises.get(moduleKey);
    }

    const module = this.modules[moduleKey];
    if (!module) {
      throw new Error(`未知模块: ${moduleKey}`);
    }

    const loadPromise = this._loadModuleDependencies(moduleKey);
    this.loadPromises.set(moduleKey, loadPromise);

    try {
      const result = await loadPromise;
      console.log(`📦 模块加载完成: ${moduleKey}`);
      return result;
    } catch (error) {
      console.error(`❌ 模块加载失败: ${moduleKey}`, error);
      throw error;
    } finally {
      this.loadPromises.delete(moduleKey);
    }
  }

  async _loadModuleDependencies(moduleKey) {
    const module = this.modules[moduleKey];

    // 先加载依赖
    for (const depKey of module.deps) {
      await this.loadModule(depKey);
    }

    // 检查模块是否已加载
    this.checkLoadedModules();
    if (this.loadedModules.has(moduleKey)) {
      return true;
    }

    // 动态加载模块
    return await this._loadScript(moduleKey, module.file);
  }

  _loadScript(moduleKey, url) {
    return new Promise((resolve, reject) => {
      // 检查是否已经在加载中
      if (document.querySelector(`script[data-module="${moduleKey}"]`)) {
        reject(new Error(`模块 ${moduleKey} 已在加载中`));
        return;
      }

      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.dataset.module = moduleKey;

      script.onload = () => {
        // 等待一小段时间确保模块初始化完成
        setTimeout(() => {
          const globalName = this.globalNames[moduleKey];
          if (typeof window[globalName] !== 'undefined') {
            this.modules[moduleKey].loaded = true;
            this.loadedModules.add(moduleKey);
            console.log(`✅ 模块加载成功: ${moduleKey} -> ${globalName}`);
            resolve(true);
          } else {
            reject(new Error(`模块 ${moduleKey} 加载后未找到全局对象 ${globalName}`));
          }
        }, 100);
      };

      script.onerror = () => {
        reject(new Error(`模块 ${moduleKey} 加载失败: ${url}`));
      };

      document.head.appendChild(script);
    });
  }

  async loadAllModules() {
    console.log('🚀 开始加载所有模块...');

    try {
      for (const moduleKey of Object.keys(this.modules)) {
        await this.loadModule(moduleKey);
      }

      console.log('🎉 所有模块加载完成！');
      return true;
    } catch (error) {
      console.error('❌ 模块加载失败:', error);
      throw error;
    }
  }

  async waitForModules(moduleKeys, timeout = 10000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      this.checkLoadedModules();

      const allLoaded = moduleKeys.every(key => this.loadedModules.has(key));
      if (allLoaded) {
        return true;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const missing = moduleKeys.filter(key => !this.loadedModules.has(key));
    throw new Error(`等待模块超时: ${missing.join(', ')}`);
  }

  getLoadedModules() {
    this.checkLoadedModules();
    return Array.from(this.loadedModules);
  }

  getMissingModules() {
    this.checkLoadedModules();
    return Object.keys(this.modules).filter(key => !this.loadedModules.has(key));
  }

  getModuleInfo() {
    this.checkLoadedModules();
    const info = {};

    Object.keys(this.modules).forEach(key => {
      const module = this.modules[key];
      const globalName = this.globalNames[key];

      info[key] = {
        loaded: this.loadedModules.has(key),
        globalAvailable: typeof window[globalName] !== 'undefined',
        file: module.file,
        deps: module.deps
      };
    });

    return info;
  }
}

// 创建全局模块加载器实例
window.ModuleLoader = new ModuleLoader();