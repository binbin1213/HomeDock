/**
 * 通知系统模块
 * 提供用户友好的消息提示
 */
class NotificationManager {
  constructor() {
    this.container = null;
    this.notifications = [];
    this.maxNotifications = 5;
    this.defaultDuration = 4000;
    this.activeNotifications = new Set(); // 防止重复
    this.init();
  }

  init() {
    // 创建通知容器
    this.container = document.createElement('div');
    this.container.className = 'notification-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
  }

  show(message, type = 'info', duration = this.defaultDuration) {
    try {
      // 防止空消息
      if (!message || typeof message !== 'string') {
        console.warn('Notification: Invalid message provided');
        return null;
      }

      // 创建唯一ID，避免重复
      const id = `${type}_${message}_${Date.now()}`;
      if (this.activeNotifications.has(id)) {
        console.log('Notification: Duplicate notification skipped:', message);
        return null;
      }

      const notification = this.createNotification(id, message, type);

      // 添加到容器
      this.container.appendChild(notification);
      this.notifications.push({ id, element: notification, type });
      this.activeNotifications.add(id);

      // 限制通知数量
      this.limitNotifications();

      // 显示动画
      requestAnimationFrame(() => {
        notification.classList.add('notification-show');
      });

      // 自动隐藏
      if (duration > 0) {
        setTimeout(() => {
          this.hide(id);
        }, duration);
      }

      return id;
    } catch (error) {
      console.error('Notification show error:', error);
      return null;
    }
  }

  hide(id) {
    try {
      const notificationIndex = this.notifications.findIndex(n => n.id === id);
      if (notificationIndex === -1) return;

      const { element } = this.notifications[notificationIndex];

      // 移除活跃状态
      this.activeNotifications.delete(id);

      element.classList.add('notification-hide');

      setTimeout(() => {
        try {
          if (element && element.parentNode) {
            element.parentNode.removeChild(element);
          }
          this.notifications.splice(notificationIndex, 1);
        } catch (error) {
          console.warn('Notification hide DOM removal error:', error);
        }
      }, 300);
    } catch (error) {
      console.error('Notification hide error:', error);
    }
  }

  createNotification(id, message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.dataset.id = id;

    // 图标映射
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    notification.innerHTML = `
      <div class="notification-icon">${icons[type] || icons.info}</div>
      <div class="notification-content">${message}</div>
      <button class="notification-close" onclick="NotificationUtils.hideStatic(${id})">×</button>
    `;

    // 添加样式
    this.addStyles();

    return notification;
  }

  addStyles() {
    // 如果样式已添加，跳过
    if (document.getElementById('notification-styles')) {
      return;
    }

    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
      .notification-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 400px;
      }

      .notification {
        background: rgba(43, 43, 43, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 16px;
        color: #ffffff;
        font-size: 14px;
        line-height: 1.4;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        gap: 12px;
        pointer-events: all;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }

      .notification-show {
        transform: translateX(0);
        opacity: 1;
      }

      .notification-hide {
        transform: translateX(100%);
        opacity: 0;
      }

      .notification-icon {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
      }

      .notification-success .notification-icon {
        background: #28a745;
        color: white;
      }

      .notification-error .notification-icon {
        background: #dc3545;
        color: white;
      }

      .notification-warning .notification-icon {
        background: #ffc107;
        color: #212529;
      }

      .notification-info .notification-icon {
        background: #17a2b8;
        color: white;
      }

      .notification-content {
        flex: 1;
        word-wrap: break-word;
      }

      .notification-close {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        font-size: 18px;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
        flex-shrink: 0;
      }

      .notification-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }

      /* 响应式设计 */
      @media (max-width: 768px) {
        .notification-container {
          right: 10px;
          left: 10px;
          max-width: none;
        }

        .notification {
          font-size: 13px;
          padding: 12px;
        }
      }

      /* 深色模式适配 */
      @media (prefers-color-scheme: light) {
        .notification {
          background: rgba(255, 255, 255, 0.95);
          color: #333333;
          border-color: rgba(0, 0, 0, 0.1);
        }

        .notification-close {
          color: rgba(0, 0, 0, 0.6);
        }

        .notification-close:hover {
          background: rgba(0, 0, 0, 0.1);
          color: #333333;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  limitNotifications() {
    if (this.notifications.length > this.maxNotifications) {
      const oldestNotification = this.notifications.shift();
      this.hide(oldestNotification.id);
    }
  }

  // 清除所有通知
  clear() {
    this.notifications.forEach(({ id }) => {
      this.hide(id);
    });
  }

  // 成功通知
  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  // 错误通知
  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  // 警告通知
  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  // 信息通知
  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

// 静默模式 - 禁用所有通知
let silentMode = true;

// 创建全局实例，使用不同的名称避免冲突
const notificationInstance = new NotificationManager();

// 将实例赋值给全局变量
window.NotificationUtils = notificationInstance;

// 重新定义静态方法，直接操作实例
window.NotificationUtils.showSuccess = (message, duration) => {
  if (silentMode) return null;
  try {
    return notificationInstance.success(message, duration);
  } catch (error) {
    console.error('NotificationUtils.showSuccess error:', error);
    return null;
  }
};

window.NotificationUtils.showError = (message, duration) => {
  if (silentMode) return null;
  try {
    return notificationInstance.error(message, duration);
  } catch (error) {
    console.error('NotificationUtils.showError error:', error);
    return null;
  }
};

window.NotificationUtils.showWarning = (message, duration) => {
  if (silentMode) return null;
  try {
    return notificationInstance.warning(message, duration);
  } catch (error) {
    console.error('NotificationUtils.showWarning error:', error);
    return null;
  }
};

window.NotificationUtils.showInfo = (message, duration) => {
  if (silentMode) return null;
  try {
    return notificationInstance.info(message, duration);
  } catch (error) {
    console.error('NotificationUtils.showInfo error:', error);
    return null;
  }
};

// 修复无限递归 - 直接调用实例方法
window.NotificationUtils.hideStatic = (id) => {
  try {
    return notificationInstance.hide(id);
  } catch (error) {
    console.error('NotificationUtils.hide error:', error);
    return null;
  }
};

window.NotificationUtils.clearStatic = () => {
  try {
    return notificationInstance.clear();
  } catch (error) {
    console.error('NotificationUtils.clear error:', error);
    return null;
  }
};

// 提供启用/禁用静默模式的方法
window.NotificationUtils.setSilentMode = (silent) => {
  silentMode = silent;
};

window.NotificationUtils.isSilentMode = () => {
  return silentMode;
};