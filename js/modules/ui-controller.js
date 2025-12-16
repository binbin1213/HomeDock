/**
 * UI 控制器模块
 * 负责模态框、应用切换和整体UI交互
 */
class UIController {
  constructor() {
    this.configManager = window.ConfigManager;
    this.appRenderer = window.AppRenderer;
    this.init();
  }

  init() {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupAll());
    } else {
      this.setupAll();
    }
  }

  setupAll() {
    try {
      this.setupModalEvents();
      this.setupAppToggle();
      this.setupEngineDisplay();
      this.setupSearchFunction();
      const iconPickerToggle = DOM.find('#iconPickerToggle');
      if (iconPickerToggle) {
        DOM.on(iconPickerToggle, 'click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showIconSelector();
        });
      }
      console.log('✅ UI Controller 初始化完成');
    } catch (error) {
      console.error('❌ UI Controller 初始化失败:', error);
    }
  }

  /**
   * 设置模态框事件
   */
  setupModalEvents() {
    const modal = DOM.find('#editModal');
    if (!modal) return;

    // 关闭按钮
    const closeBtn = DOM.find('.edit-modal-close');
    if (closeBtn) {
      DOM.on(closeBtn, 'click', () => this.hideEditModal());
    }

    // 取消按钮
    const cancelBtn = DOM.find('.btn-cancel');
    if (cancelBtn) {
      DOM.on(cancelBtn, 'click', () => this.hideEditModal());
    }

    // 表单提交
    const form = DOM.find('#editForm');
    if (form) {
      DOM.on(form, 'submit', (e) => {
        e.preventDefault();
        this.saveEditedApp();
      });
    }

    // 点击背景关闭
    DOM.on(modal, 'click', (e) => {
      if (e.target === modal) {
        this.hideEditModal();
      }
    });

    // ESC 键关闭
    DOM.on(document, 'keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        this.hideEditModal();
      }
    });
  }

  /**
   * 设置应用切换
   */
  setupAppToggle() {
    const leftBtn = DOM.find('.switch-btn-left');
    const rightBtn = DOM.find('.switch-btn-right');
    const externalContainer = DOM.find('#app');
    const internalContainer = DOM.find('#app1');

    if (!leftBtn || !rightBtn || !externalContainer || !internalContainer) {
      return;
    }

    // 加载保存的视图状态
    const savedView = Helpers.Storage.get('homedock-app-view', 'external');
    if (savedView === 'internal') {
      leftBtn.classList.remove('active');
      rightBtn.classList.add('active');
    } else {
      leftBtn.classList.add('active');
      rightBtn.classList.remove('active');
    }

    this.updateAppView(savedView === 'internal', externalContainer, internalContainer);

    // 切换事件
    DOM.on(leftBtn, 'click', () => {
      leftBtn.classList.add('active');
      rightBtn.classList.remove('active');
      Helpers.Storage.set('homedock-app-view', 'external');
      this.updateAppView(false, externalContainer, internalContainer);
    });

    DOM.on(rightBtn, 'click', () => {
      rightBtn.classList.add('active');
      leftBtn.classList.remove('active');
      Helpers.Storage.set('homedock-app-view', 'internal');
      this.updateAppView(true, externalContainer, internalContainer);
    });
  }

  /**
   * 更新应用视图
   */
  updateAppView(isInternal, externalContainer, internalContainer) {
    if (isInternal) {
      DOM.hide(externalContainer);
      DOM.show(internalContainer);
    } else {
      DOM.show(externalContainer);
      DOM.hide(internalContainer);
    }
  }

  /**
   * 设置搜索引擎显示
   */
  setupEngineDisplay() {
    const searchEngine = DOM.find('#search-engine');
    const currentEngineLabel = DOM.find('#current-engine-label');
    const searchBox = DOM.find('#search-box');
    const engineSelector = DOM.find('#search-engine-selector');
    const dropdown = DOM.find('#search-engine-dropdown');
    const dropdownItems = DOM.findAll('.dropdown-item');

    if (!searchEngine || !currentEngineLabel || !searchBox || !engineSelector || !dropdown) {
      return;
    }

    // 加载保存的搜索引擎，默认为百度
    const savedEngine = Helpers.Storage.get('homedock-search-engine', 'baidu');
    searchEngine.value = savedEngine;

    // 更新显示
    this.updateEngineDisplay(savedEngine);

    // 引擎选择器点击事件
    DOM.on(engineSelector, 'click', (e) => {
      e.stopPropagation();
      this.toggleEngineDropdown();
    });

    // 下拉项点击事件
    dropdownItems.forEach(item => {
      DOM.on(item, 'click', (e) => {
        e.stopPropagation();
        const engine = item.dataset.engine;
        if (searchEngine.value !== engine) {
          searchEngine.value = engine;
          Helpers.Storage.set('homedock-search-engine', engine);
          this.updateEngineDisplay(engine);
        }
        this.hideEngineDropdown();
      });
    });

    // 点击其他地方关闭下拉菜单
    DOM.on(document, 'click', (e) => {
      if (!e.target.closest('#search-engine-selector') && !e.target.closest('.search-engine-dropdown')) {
        this.hideEngineDropdown();
      }
    });
  }

  toggleEngineDropdown() {
    const engineSelector = DOM.find('#search-engine-selector');
    const dropdown = DOM.find('#search-engine-dropdown');

    if (dropdown.classList.contains('show')) {
      this.hideEngineDropdown();
    } else {
      this.showEngineDropdown();
    }
  }

  showEngineDropdown() {
    const engineSelector = DOM.find('#search-engine-selector');
    const dropdown = DOM.find('#search-engine-dropdown');

    engineSelector.classList.add('open');
    dropdown.classList.add('show');
  }

  hideEngineDropdown() {
    const engineSelector = DOM.find('#search-engine-selector');
    const dropdown = DOM.find('#search-engine-dropdown');

    engineSelector.classList.remove('open');
    dropdown.classList.remove('show');
  }

  /**
   * 更新搜索引擎显示
   */
  updateEngineDisplay(engine) {
    const currentEngineLabel = DOM.find('#current-engine-label');
    const searchEngineLogo = DOM.find('#search-engine-logo');
    const searchBox = DOM.find('#search-box');

    let iconSrc = '';
    let altText = '';
    let labelText = '';

    switch (engine) {
      case 'google':
        iconSrc = 'img/google-official.svg';
        altText = 'Google';
        labelText = 'Google';
        break;
      case 'bing':
        iconSrc = 'img/Bing.svg';
        altText = 'Bing';
        labelText = 'Bing';
        break;
      case 'baidu':
        iconSrc = 'img/baidu.svg';
        altText = 'Baidu';
        labelText = '百度';
        break;
    }

    // 更新搜索框上方的logo图标
    if (searchEngineLogo) {
      searchEngineLogo.src = iconSrc;
      searchEngineLogo.alt = altText;
    }

    if (currentEngineLabel) {
      currentEngineLabel.textContent = labelText;
    }

    // 更新样式
    searchBox.classList.remove('engine-google', 'engine-bing', 'engine-baidu');
    searchBox.classList.add(`engine-${engine}`);
  }

  /**
   * 打开添加应用对话框
   */
  openAddApp(targetType) {
    const modal = DOM.find('#editModal');
    if (!modal) return;

    // 清空表单
    DOM.find('#appName').value = '';
    DOM.find('#externalUrl').value = targetType === 'external' ? '' : '';
    DOM.find('#internalUrl').value = targetType === 'internal' ? '' : '';
    DOM.find('#iconPath').value = '';

    // 设置模式
    modal.dataset.appIndex = targetType === 'external' ? 'new-external' : 'new-internal';

    // 显示模态框
    DOM.show(modal);
    modal.style.display = 'flex';

    // 聚焦到名称输入框
    setTimeout(() => {
      DOM.find('#appName').focus();
    }, 100);
  }

  /**
   * 编辑应用
   */
  async editApp(appIndex) {
    const config = this.configManager.getCurrentConfig();
    const app = config.applications[appIndex];

    if (!app) {
      NotificationUtils.showError('应用不存在');
      return;
    }

    // 填充表单
    DOM.find('#appName').value = app.name || '';
    DOM.find('#externalUrl').value = app.external_url || '';
    DOM.find('#internalUrl').value = app.internal_url || '';
    DOM.find('#iconPath').value = app.icon || '';

    // 显示模态框
    const modal = DOM.find('#editModal');
    modal.dataset.appIndex = appIndex;
    DOM.show(modal);
    modal.style.display = 'flex';

    // 聚焦到名称输入框
    setTimeout(() => {
      DOM.find('#appName').focus();
    }, 100);
  }

  /**
   * 保存编辑的应用
   */
  async saveEditedApp() {
    const modal = DOM.find('#editModal');
    const appIndexValue = modal.dataset.appIndex;

    // 获取表单数据
    const formData = new FormData(DOM.find('#editForm'));
    const appData = {
      name: formData.get('appName')?.trim(),
      external_url: formData.get('externalUrl')?.trim(),
      internal_url: formData.get('internalUrl')?.trim(),
      icon: formData.get('iconPath')?.trim()
    };

    // 验证必填字段
    if (!appData.name) {
      NotificationUtils.showError('请输入应用名称');
      return;
    }

    // 验证至少有一个URL
    if (!appData.external_url && !appData.internal_url) {
      NotificationUtils.showError('请至少输入一个URL地址');
      return;
    }

    // 验证URL格式
    if (appData.external_url && !this.validateUrl(appData.external_url)) {
      NotificationUtils.showError('外部URL格式不正确');
      return;
    }

    if (appData.internal_url && !this.validateUrl(appData.internal_url)) {
      NotificationUtils.showError('内部URL格式不正确');
      return;
    }

    try {
      if (appIndexValue === 'new-external' || appIndexValue === 'new-internal') {
        // 新增应用
        await this.configManager.addApplication(appData);
        NotificationUtils.showSuccess('应用添加成功');
      } else {
        // 更新应用
        const appIndex = parseInt(appIndexValue, 10);
        await this.configManager.updateApplication(appIndex, appData);
        NotificationUtils.showSuccess('应用更新成功');
      }

      this.hideEditModal();
      this.appRenderer.refresh();

    } catch (error) {
      console.error('保存应用失败:', error);
      NotificationUtils.showError('保存失败: ' + error.message);
    }
  }

  /**
   * 删除应用
   */
  async deleteApp(appIndex) {
    if (!confirm('确定要删除这个应用吗？')) {
      return;
    }

    try {
      await this.configManager.deleteApplication(appIndex);
      NotificationUtils.showSuccess('应用已删除');
      this.appRenderer.refresh();
    } catch (error) {
      console.error('删除应用失败:', error);
      NotificationUtils.showError('删除失败: ' + error.message);
    }
  }

  /**
   * 验证URL格式
   */
  validateUrl(url) {
    if (!url || url === '#') {
      return true; // 允许锚链接
    }

    try {
      new URL(url);
      return true;
    } catch {
      // 尝试添加协议
      try {
        new URL('http://' + url);
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * 隐藏编辑模态框
   */
  hideEditModal() {
    const modal = DOM.find('#editModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * 显示图标选择器
   */
  showIconSelector() {
    const picker = DOM.find('#iconPicker');
    const grid = DOM.find('#iconPickerGrid');
    const input = DOM.find('#iconPath');

    if (!picker || !grid || !input) {
      return;
    }

    if (picker.dataset.initialized !== 'true') {
      const presetIcons = window.PRESET_ICONS || [];

      grid.innerHTML = '';

      presetIcons.forEach(icon => {
        const item = DOM.create('div', {
          className: 'icon-picker-item'
        }, [
          DOM.create('img', {
            src: icon.path,
            alt: icon.name
          }),
          DOM.create('span', {}, [icon.name])
        ]);

        DOM.on(item, 'click', () => {
          input.value = icon.path;
          input.focus();
          picker.style.display = 'none';
        });

        grid.appendChild(item);
      });

      picker.dataset.initialized = 'true';
    }

    if (picker.style.display === 'block') {
      picker.style.display = 'none';
    } else {
      picker.style.display = 'block';
    }
  }

  /**
   * 设置搜索功能
   */
  setupSearchFunction() {
    const searchInput = DOM.find('#search-input');
    if (!searchInput) return;

    // 回车搜索
    DOM.on(searchInput, 'keypress', (e) => {
      if (e.key === 'Enter') {
        this.performSearch();
      }
    });

    // 自动完成功能
    this.setupSearchAutocomplete(searchInput);
  }

  /**
   * 设置搜索自动完成
   */
  setupSearchAutocomplete(searchInput) {
    const SEARCH_HISTORY_KEY = 'homedock-search-history';
    let autocompleteTimeout;

    DOM.on(searchInput, 'input', (e) => {
      clearTimeout(autocompleteTimeout);
      const query = e.target.value.trim();

      if (query.length < 2) {
        this.hideAutocomplete();
        return;
      }

      autocompleteTimeout = setTimeout(() => {
        this.showAutocomplete(query, SEARCH_HISTORY_KEY);
      }, 200);
    });

    // 点击其他地方隐藏自动完成
    DOM.on(document, 'click', (e) => {
      if (!e.target.closest('.search-autocomplete') && e.target !== searchInput) {
        this.hideAutocomplete();
      }
    });
  }

  /**
   * 显示自动完成
   */
  showAutocomplete(query, historyKey) {
    const history = Helpers.Storage.get(historyKey, []);
    const filtered = history.filter(item =>
      item.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

    if (filtered.length === 0) {
      this.hideAutocomplete();
      return;
    }

    const searchInput = DOM.find('#search-input');
    const autocomplete = DOM.create('div', {
      className: 'search-autocomplete'
    });

    filtered.forEach(item => {
      const suggestion = DOM.create('div', {
        className: 'search-suggestion',
        onclick: () => {
          searchInput.value = item;
          this.performSearch();
          this.hideAutocomplete();
        }
      }, [Helpers.escapeHtml(item)]);

      autocomplete.appendChild(suggestion);
    });

    // 插入到搜索框后面
    const searchBox = DOM.find('#search-box');
    const existing = DOM.find('.search-autocomplete');
    if (existing) {
      searchBox.removeChild(existing);
    }

    searchBox.appendChild(autocomplete);
  }

  /**
   * 隐藏自动完成
   */
  hideAutocomplete() {
    const autocomplete = DOM.find('.search-autocomplete');
    if (autocomplete) {
      autocomplete.parentNode.removeChild(autocomplete);
    }
  }

  /**
   * 执行搜索
   */
  performSearch() {
    const searchInput = DOM.find('#search-input');
    const searchEngine = DOM.find('#search-engine');
    const query = searchInput.value.trim();

    if (!query) {
      NotificationUtils.showError('请输入搜索内容');
      return;
    }

    // 保存搜索历史
    const SEARCH_HISTORY_KEY = 'homedock-search-history';
    let history = Helpers.Storage.get(SEARCH_HISTORY_KEY, []);
    history = history.filter(item => item !== query);
    history.unshift(query);
    history = history.slice(0, 10);
    Helpers.Storage.set(SEARCH_HISTORY_KEY, history);

    // 执行搜索
    const currentEngine = searchEngine.value;
    let searchUrl;

    switch (currentEngine) {
      case 'google':
        searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        break;
      case 'bing':
        searchUrl = `https://cn.bing.com/search?q=${encodeURIComponent(query)}`;
        break;
      case 'baidu':
        searchUrl = `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`;
        break;
      default:
        searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }

    window.open(searchUrl, '_blank');
  }
}

// 创建全局实例
window.UIManager = new UIController();
