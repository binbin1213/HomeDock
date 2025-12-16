/**
 * 工具函数模块
 */

/**
 * HTML 转义，防止 XSS 攻击
 */
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') {
    return '';
  }
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\//g, "&#x2F;");
}

/**
 * URL 转义
 */
function escapeUrl(url) {
  if (typeof url !== 'string') {
    return '#';
  }

  // 如果URL为空或只是空格，返回#
  if (!url || url.trim() === '') {
    return '#';
  }

  try {
    // 如果是锚链接，直接返回
    if (url.startsWith('#')) {
      return url;
    }

    // 验证 URL 格式
    const urlObj = new URL(url);
    return urlObj.toString();
  } catch (e) {
    // 静默处理无效URL，不显示警告
    return '#';
  }
}

/**
 * 防抖函数
 */
function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

/**
 * 节流函数
 */
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 深拷贝对象
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }

  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * 生成唯一 ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 检测设备类型
 */
function getDeviceType() {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * 本地存储操作封装
 */
const Storage = {
  get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (e) {
      console.error('Storage get error:', e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Storage remove error:', e);
      return false;
    }
  },

  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error('Storage clear error:', e);
      return false;
    }
  }
};

/**
 * DOM 操作工具
 */
const DOM = {
  // 创建元素
  create(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'innerHTML') {
        element.innerHTML = value;
      } else if (key === 'textContent') {
        element.textContent = value;
      } else if (key.startsWith('data-') || key.startsWith('aria-')) {
        element.setAttribute(key, value);
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key in element && typeof element[key] !== 'function') {
        element[key] = value;
      } else {
        element.setAttribute(key, value);
      }
    });

    children.forEach(child => {
      if (child === null || child === undefined) {
        return;
      }
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      } else if (Array.isArray(child)) {
        child.forEach(grandchild => {
          if (typeof grandchild === 'string') {
            element.appendChild(document.createTextNode(grandchild));
          } else if (grandchild instanceof Node) {
            element.appendChild(grandchild);
          }
        });
      }
    });

    return element;
  },

  // 查询元素
  find(selector, context = document) {
    return context.querySelector(selector);
  },

  findAll(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
  },

  // 添加事件监听
  on(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options);
    return () => element.removeEventListener(event, handler, options);
  },

  // 移除元素
  remove(element) {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  },

  // 显示/隐藏元素
  show(element) {
    element.style.display = '';
  },

  hide(element) {
    element.style.display = 'none';
  },

  // 切换显示状态
  toggle(element) {
    element.style.display = element.style.display === 'none' ? '' : 'none';
  }
};

/**
 * 动画工具
 */
const Animation = {
  // 淡入
  fadeIn(element, duration = 300) {
    element.style.opacity = 0;
    element.style.display = '';

    let start = null;
    function animate(timestamp) {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const opacity = Math.min(progress / duration, 1);

      element.style.opacity = opacity;

      if (progress < duration) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  },

  // 淡出
  fadeOut(element, duration = 300, callback) {
    let start = null;
    const initialOpacity = parseFloat(window.getComputedStyle(element).opacity);

    function animate(timestamp) {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const opacity = Math.max(initialOpacity * (1 - progress / duration), 0);

      element.style.opacity = opacity;

      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
        if (callback) callback();
      }
    }

    requestAnimationFrame(animate);
  }
};

// 导出到全局
window.Helpers = {
  escapeHtml,
  escapeUrl,
  debounce,
  throttle,
  deepClone,
  generateId,
  formatFileSize,
  getDeviceType,
  Storage,
  DOM,
  Animation
};