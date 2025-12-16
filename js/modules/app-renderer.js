/**
 * 应用渲染器模块
 * 负责应用的渲染和交互
 */
class AppRenderer {
  constructor() {
    this.APPS_PER_PAGE = 12;
    this.externalPageIndex = 0;
    this.internalPageIndex = 0;
    this.editMode = false;
    this.configManager = window.ConfigManager;
    this.init();
  }

  init() {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
    } else {
      this.setupEventListeners();
    }
  }

  setupEventListeners() {
    // 编辑切换按钮
    const editToggleBtn = DOM.find('#edit-toggle-btn');
    if (editToggleBtn) {
      DOM.on(editToggleBtn, 'click', (e) => {
        e.stopPropagation();
        this.toggleEditMode();
      });
    }

    // 分页控制
    this.setupPagingControls();

    // 点击空白区域退出编辑模式
    DOM.on(document, 'click', (e) => {
      if (this.editMode &&
          !e.target.closest('.app-item') &&
          !e.target.closest('.edit-modal') &&
          !e.target.closest('#edit-toggle-btn')) {
        this.exitEditMode();
      }
    });

    // 键盘快捷键
    DOM.on(document, 'keydown', (e) => {
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        this.toggleEditMode();
      }
    });
  }

  /**
   * 渲染外部应用
   */
  renderExternalApps() {
    const appsList = DOM.find('#external-apps');
    const nextBtn = DOM.find('#external-next-btn');

    if (!appsList) {
      console.warn('⚠️ #external-apps container not found');
      return;
    }

    appsList.innerHTML = '';

    let config = this.configManager.getCurrentConfig();
    if (!config || typeof config.then === 'function' || !Array.isArray(config.applications)) {
      console.warn('⚠️ No valid config found, reloading config...');
      this.configManager.loadConfigWithRetry().then(() => {
        this.renderExternalApps();
        this.renderInternalApps();
      }).catch((error) => {
        console.error('❌ Failed to reload config:', error);
      });
      return;
    }

    // 过滤外部应用 - 只显示有有效URL的应用
    const appsWithIndex = config.applications
      .map((app, index) => ({ app, index }))
      .filter(item => item.app.external_url && item.app.external_url.trim() && item.app.external_url !== '#');

    
    this.renderApps(appsList, appsWithIndex, 'external', this.externalPageIndex);

    // 更新分页按钮状态
    if (nextBtn) {
      const total = appsWithIndex.length;
      nextBtn.classList.toggle('page-arrow-hidden', total <= this.APPS_PER_PAGE);
    }
  }

  /**
   * 渲染内部应用
   */
  renderInternalApps() {
    const appsList = DOM.find('#internal-apps');
    const nextBtn = DOM.find('#internal-next-btn');

    if (!appsList) {
      console.warn('⚠️ #internal-apps container not found');
      return;
    }

    appsList.innerHTML = '';

    let config = this.configManager.getCurrentConfig();
    if (!config || typeof config.then === 'function' || !Array.isArray(config.applications)) {
      console.warn('⚠️ No valid config found for internal apps, reloading config...');
      this.configManager.loadConfigWithRetry().then(() => {
        this.renderInternalApps();
      }).catch((error) => {
        console.error('❌ Failed to reload config for internal apps:', error);
      });
      return;
    }

    // 过滤内部应用 - 只显示有有效URL的应用
    const appsWithIndex = config.applications
      .map((app, index) => ({ app, index }))
      .filter(item => item.app.internal_url && item.app.internal_url.trim() && item.app.internal_url !== '#');

    
    this.renderApps(appsList, appsWithIndex, 'internal', this.internalPageIndex);

    // 更新分页按钮状态
    if (nextBtn) {
      const total = appsWithIndex.length;
      nextBtn.classList.toggle('page-arrow-hidden', total <= this.APPS_PER_PAGE);
    }
  }

  /**
   * 通用应用渲染方法
   */
  renderApps(container, appsWithIndex, type, pageIndex) {
    const total = appsWithIndex.length;
    const maxPage = Math.max(0, Math.ceil(total / this.APPS_PER_PAGE) - 1);

    // 调整页面索引
    if (pageIndex > maxPage) {
      pageIndex = 0;
      if (type === 'external') {
        this.externalPageIndex = 0;
      } else {
        this.internalPageIndex = 0;
      }
    }

    const start = pageIndex * this.APPS_PER_PAGE;
    const pageItems = appsWithIndex.slice(start, start + this.APPS_PER_PAGE);

    // 渲染应用项
    pageItems.forEach(({ app, index }) => {
      const li = this.createAppItem(app, index, type);
      container.appendChild(li);
    });

    // 添加"添加应用"按钮
    const addLi = this.createAddAppItem(type);
    container.appendChild(addLi);

    // 添加拖拽支持
    this.enableDragAndDrop(container, type);
  }

  /**
   * 创建应用项
   */
  createAppItem(app, index, type) {
    const li = DOM.create('li', {
      className: 'app-page-item',
      draggable: true,
      'data-app-index': index,
      'data-app-type': type
    });

    const url = type === 'external' ? app.external_url : app.internal_url;
    const iconSrc = app.icon && app.icon.trim() ? app.icon : 'img/png/favicon.svg';
    const target = url && url.startsWith('#') ? '_self' : '_blank';

    const appItemContent = DOM.create('div', {
      className: 'app-item',
      'data-app-index': index
    }, [
      DOM.create('a', {
        href: Helpers.escapeUrl(url),
        target: target,
        rel: 'noopener noreferrer'
      }, [
        DOM.create('img', {
          className: 'shake',
          src: iconSrc,
          alt: Helpers.escapeHtml(app.name),
          onerror: 'this.onerror=null;this.src=\'img/png/favicon.svg\''
        }),
        DOM.create('strong', {}, [Helpers.escapeHtml(app.name)])
      ]),
      this.createEditButtons(index)
    ]);

    // 添加右键菜单事件
    DOM.on(appItemContent, 'contextmenu', (e) => {
      e.preventDefault();
      this.enterEditMode();
    });

    li.appendChild(appItemContent);
    return li;
  }

  /**
   * 创建编辑按钮
   */
  createEditButtons(index) {
    const editBtn = DOM.create('button', {
      className: 'edit-btn icon-btn',
      style: 'display: none;'
    }, ['✏']);

    const deleteBtn = DOM.create('button', {
      className: 'icon-btn delete-btn',
      style: 'display: none;'
    }, ['×']);

    // 添加事件监听器而不是使用onclick属性
    DOM.on(editBtn, 'click', (e) => {
      e.stopPropagation();
      window.UIManager.editApp(index);
    });

    DOM.on(deleteBtn, 'click', (e) => {
      e.stopPropagation();
      window.UIManager.deleteApp(index);
    });

    return [editBtn, deleteBtn];
  }

  /**
   * 创建添加应用项
   */
  createAddAppItem(type) {
    const li = DOM.create('li', { className: 'app-page-item add-app-item' });

    const addItem = DOM.create('div', {
      className: 'app-item add-app-item-inner'
    }, [
      DOM.create('strong', {}, ['+ 添加应用'])
    ]);

    DOM.on(addItem, 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.UIManager && typeof window.UIManager.openAddApp === 'function') {
        window.UIManager.openAddApp(type);
      }
    });

    li.appendChild(addItem);
    return li;
  }

  /**
   * 启用拖拽排序
   */
  enableDragAndDrop(container, type) {
    let draggedElement = null;
    let draggedIndex = null;
    let currentOverElement = null;

    const resetDragState = () => {
      if (draggedElement) {
        draggedElement.classList.remove('dragging');
      }
      if (currentOverElement) {
        currentOverElement.classList.remove('drag-over');
      }
      draggedElement = null;
      draggedIndex = null;
      currentOverElement = null;
    };

    DOM.on(container, 'dragstart', (e) => {
      const item = e.target.closest('.app-page-item');
      if (!item || item.classList.contains('add-app-item')) return;

      draggedElement = item;
      draggedIndex = parseInt(draggedElement.dataset.appIndex);
      draggedElement.classList.add('dragging');

      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', '');
      }
    });

    DOM.on(container, 'dragover', (e) => {
      e.preventDefault();
      if (!draggedElement) return;
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }

      const target = e.target.closest('.app-page-item');
      if (!target || target === draggedElement || target.classList.contains('add-app-item')) {
        return;
      }

      if (currentOverElement && currentOverElement !== target) {
        currentOverElement.classList.remove('drag-over');
      }
      target.classList.add('drag-over');
      currentOverElement = target;

      const rect = target.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const shouldInsertBefore = offsetY < rect.height / 2;

      if (shouldInsertBefore) {
        container.insertBefore(draggedElement, target);
      } else {
        container.insertBefore(draggedElement, target.nextSibling);
      }
    });

    DOM.on(container, 'drop', async (e) => {
      e.preventDefault();
      if (draggedElement) {
        draggedElement.classList.remove('dragging');
        if (currentOverElement) {
          currentOverElement.classList.remove('drag-over');
        }

        // 获取新的顺序
        const items = Array.from(container.querySelectorAll('.app-page-item:not(.add-app-item)'));
        const newIndex = items.indexOf(draggedElement);

        if (newIndex !== draggedIndex) {
          try {
            await this.configManager.reorderApplications(draggedIndex, newIndex);
            NotificationUtils.showSuccess('应用顺序已更新');

            // 重新渲染
            if (type === 'external') {
              this.renderExternalApps();
            } else {
              this.renderInternalApps();
            }
          } catch (error) {
            NotificationUtils.showError('更新顺序失败: ' + error.message);
          }
        }
      }
    });

    DOM.on(container, 'dragend', () => {
      resetDragState();
    });

    DOM.on(container, 'dragleave', (e) => {
      const item = e.target.closest('.app-page-item');
      if (item) {
        item.classList.remove('drag-over');
      }
    });

    DOM.on(window, 'mouseup', () => {
      if (draggedElement) {
        resetDragState();
      }
    });
  }

  /**
   * 获取拖拽后的位置
   */
  getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.app-page-item:not(.dragging):not(.add-app-item)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  /**
   * 设置分页控制
   */
  setupPagingControls() {
    const externalNext = DOM.find('#external-next-btn');
    const internalNext = DOM.find('#internal-next-btn');

    if (externalNext) {
      DOM.on(externalNext, 'click', () => {
        this.nextPage('external');
      });
    }

    if (internalNext) {
      DOM.on(internalNext, 'click', () => {
        this.nextPage('internal');
      });
    }
  }

  /**
   * 下一页
   */
  nextPage(type) {
    const config = this.configManager.getCurrentConfig();
    if (!config || !Array.isArray(config.applications)) return;

    const apps = config.applications.filter(app =>
      type === 'external' ? app.external_url : app.internal_url
    );

    const maxPage = Math.max(0, Math.ceil(apps.length / this.APPS_PER_PAGE) - 1);

    if (type === 'external') {
      this.externalPageIndex = this.externalPageIndex >= maxPage ? 0 : this.externalPageIndex + 1;
      this.renderExternalApps();
    } else {
      this.internalPageIndex = this.internalPageIndex >= maxPage ? 0 : this.internalPageIndex + 1;
      this.renderInternalApps();
    }

    if (this.editMode) {
      this.addRightClickEdit();
    }
  }

  /**
   * 切换编辑模式
   */
  toggleEditMode() {
    if (this.editMode) {
      this.exitEditMode();
    } else {
      this.enterEditMode();
    }
  }

  /**
   * 进入编辑模式
   */
  enterEditMode() {
    this.editMode = true;
    document.body.classList.add('edit-mode');

    // 显示编辑按钮
    DOM.findAll('.icon-btn').forEach(btn => {
      btn.style.display = 'flex';
    });

    // 移除原有动画，添加编辑模式动画
    DOM.findAll('.shake, .edit-shake').forEach(element => {
      element.classList.remove('shake', 'edit-shake');
    });

    DOM.findAll('.app-item img').forEach(img => {
      img.classList.add('edit-shake');
    });

    DOM.findAll('.edit-btn').forEach(btn => {
      btn.classList.add('edit-shake');
    });

    // 更新按钮状态
    const toggleBtn = DOM.find('#edit-toggle-btn');
    const editIcon = DOM.find('.edit-icon');
    const editText = DOM.find('.edit-text');
    if (toggleBtn && editIcon && editText) {
      toggleBtn.classList.add('editing');
      editIcon.textContent = '✓';
      editText.textContent = '完成';
    }

    // 添加右键编辑支持
    this.addRightClickEdit();
  }

  /**
   * 退出编辑模式
   */
  exitEditMode() {
    this.editMode = false;
    document.body.classList.remove('edit-mode');

    // 隐藏编辑按钮
    DOM.findAll('.icon-btn').forEach(btn => {
      btn.style.display = 'none';
    });

    // 恢复默认动画
    DOM.findAll('.edit-shake').forEach(element => {
      element.classList.remove('edit-shake');
    });

    DOM.findAll('.app-item img').forEach(img => {
      img.classList.add('shake');
    });

    // 更新按钮状态
    const toggleBtn = DOM.find('#edit-toggle-btn');
    const editIcon = DOM.find('.edit-icon');
    const editText = DOM.find('.edit-text');
    if (toggleBtn && editIcon && editText) {
      toggleBtn.classList.remove('editing');
      editIcon.textContent = '✏️';
      editText.textContent = '编辑';
    }
  }

  /**
   * 添加右键编辑支持
   */
  addRightClickEdit() {
    DOM.findAll('.app-item a').forEach(link => {
      DOM.on(link, 'contextmenu', (e) => {
        e.preventDefault();

        if (!this.editMode) {
          this.enterEditMode();
        }
      });
    });
  }

  /**
   * 刷新所有应用
   */
  refresh() {
    this.externalPageIndex = 0;
    this.internalPageIndex = 0;
    this.renderExternalApps();
    this.renderInternalApps();

    if (this.editMode) {
      this.addRightClickEdit();
    }
  }
}

// 创建全局实例
window.AppRenderer = new AppRenderer();
