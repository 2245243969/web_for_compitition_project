// 强制修改tabbar字体大小的工具函数
export function forceTabbarFontSize() {
  // 等待DOM加载完成
  setTimeout(() => {
    try {
      // 查找所有可能的tabbar元素
      const selectors = [
        '.uni-tabbar .uni-tabbar-item',
        '.uni-tabbar-item',
        'uni-tabbar-item',
        '[role="tabbar"] > *',
        '.uni-tab-bar .uni-tab-bar-item',
        '.uni-tabbar .uni-tabbar__item'
      ];

      selectors.forEach(selector => {
        const items = document.querySelectorAll(selector);
        items.forEach(item => {
          // 移除字体大小设置，使用pages.json配置

          // 查找文字元素（不设置字体大小）
          const textElements = item.querySelectorAll('text, span, .uni-tabbar__label, .uni-tabbar-item__text');

          // 检查是否为选中状态（更全面的检查）
          const isActive = item.classList.contains('uni-tabbar-item-active') ||
            item.classList.contains('active') ||
            item.classList.contains('selected') ||
            item.classList.contains('current') ||
            item.classList.contains('uni-tabbar__item--active') ||
            item.getAttribute('aria-selected') === 'true' ||
            item.hasAttribute('selected');

          if (isActive) {
            item.style.color = '#C9A86B';
            item.style.transform = 'scale(1.03)';

            textElements.forEach(textEl => {
              textEl.style.color = '#C9A86B';
            });
          } else {
            // 确保未选中状态为银灰色
            item.style.color = '#B0B3B8';
            textElements.forEach(textEl => {
              textEl.style.color = '#B0B3B8';
            });
          }
        });
      });

      // 额外的颜色强制应用
      forceTabbarColors();

      console.log('TabBar字体大小已强制修改');
    } catch (error) {
      console.error('修改TabBar字体时出错:', error);
    }
  }, 1000);
}

// 强制应用tabbar颜色
function forceTabbarColors() {
  try {
    // 强制应用selectedColor配置
    const style = document.createElement('style');
    style.textContent = `
      .uni-tabbar .uni-tabbar-item.uni-tabbar-item-active,
      .uni-tabbar .uni-tabbar-item.uni-tabbar-item-active text,
      .uni-tabbar .uni-tabbar-item.uni-tabbar-item-active span,
      .uni-tabbar-item.active,
      .uni-tabbar-item.active text,
      .uni-tabbar-item.active span,
      .uni-tabbar-item.selected,
      .uni-tabbar-item.selected text,
      .uni-tabbar-item.selected span {
        color: #C9A86B !important;
      }
      
      .uni-tabbar .uni-tabbar-item,
      .uni-tabbar .uni-tabbar-item text,
      .uni-tabbar .uni-tabbar-item span {
        color: #B0B3B8 !important;
      }
    `;
    document.head.appendChild(style);

    // 直接修改当前页面的选中项颜色
    setTimeout(() => {
      const currentPath = window.location.pathname || window.location.hash;
      const tabbarItems = document.querySelectorAll('.uni-tabbar-item, .uni-tabbar .uni-tabbar-item');

      tabbarItems.forEach((item, index) => {
        const textElements = item.querySelectorAll('text, span');

        // 根据当前路径判断哪个应该是选中状态
        if (currentPath.includes('index') && index === 0) {
          item.style.color = '#C9A86B';
          textElements.forEach(t => t.style.color = '#C9A86B');
        } else if (currentPath.includes('upload') && index === 1) {
          item.style.color = '#C9A86B';
          textElements.forEach(t => t.style.color = '#C9A86B');
        } else if (currentPath.includes('history') && index === 2) {
          item.style.color = '#C9A86B';
          textElements.forEach(t => t.style.color = '#C9A86B');
        } else if (currentPath.includes('statistics') && index === 3) {
          item.style.color = '#C9A86B';
          textElements.forEach(t => t.style.color = '#C9A86B');
        } else {
          item.style.color = '#B0B3B8';
          textElements.forEach(t => t.style.color = '#B0B3B8');
        }
      });
    }, 500);

    // 调试信息
    console.log('当前路径:', window.location.pathname || window.location.hash);
    console.log('TabBar颜色已强制应用');

  } catch (error) {
    console.error('强制应用tabbar颜色时出错:', error);
  }
}

// 导出一个全局调试函数
window.debugTabbar = function () {
  console.log('=== TabBar调试信息 ===');
  const items = document.querySelectorAll('.uni-tabbar-item, .uni-tabbar .uni-tabbar-item');
  items.forEach((item, index) => {
    console.log(`项目 ${index}:`, {
      element: item,
      classList: Array.from(item.classList),
      color: getComputedStyle(item).color,
      fontSize: getComputedStyle(item).fontSize
    });
  });
  console.log('当前路径:', window.location.pathname || window.location.hash);
};

// 监听页面变化，持续应用样式
export function watchTabbarChanges() {
  // 使用MutationObserver监听DOM变化
  const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        // 检查是否有tabbar相关的变化
        const target = mutation.target;
        if (target.classList && (
          target.classList.contains('uni-tabbar') ||
          target.classList.contains('uni-tabbar-item') ||
          target.tagName === 'UNI-TABBAR'
        )) {
          shouldUpdate = true;
        }
      }
    });

    if (shouldUpdate) {
      forceTabbarFontSize();
    }
  });

  // 开始观察
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });
}