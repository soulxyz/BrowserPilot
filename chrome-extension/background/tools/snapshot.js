/**
 * Snapshot Tools
 * 页面快照和截图工具
 */

export class SnapshotTools {
  /**
   * browser_snapshot - 捕获页面快照
   */
  static async capture(params, tabId) {
    console.log('[Snapshot] Capturing snapshot for tab:', tabId);
    
    try {
      // 注入快照收集脚本并执行
      const [result] = await chrome.scripting.executeScript({
        target: { tabId },
        func: capturePageSnapshot,
        world: 'MAIN' // 在页面上下文中执行
      });
      
      if (!result || !result.result) {
        throw new Error('Failed to capture snapshot');
      }
      
      const snapshot = result.result;
      
      // 获取标签页信息
      const tab = await chrome.tabs.get(tabId);
      
      // 转换为YAML格式（简化版）
      const yamlSnapshot = SnapshotTools.convertToYAML(snapshot.elements);
      
      return {
        url: tab.url,
        title: tab.title,
        snapshot: yamlSnapshot,
        elementsCount: snapshot.elements.length,
        timestamp: snapshot.timestamp
      };
      
    } catch (error) {
      console.error('[Snapshot] Error:', error);
      throw error;
    }
  }
  
  /**
   * browser_take_screenshot - 截取屏幕截图
   */
  static async screenshot(params, tabId) {
    const { element, ref, filename, fullPage, type = 'png' } = params;
    
    console.log('[Screenshot] Taking screenshot, element:', element, 'ref:', ref);
    
    try {
      let dataUrl;
      
      if (ref) {
        // 元素截图
        dataUrl = await SnapshotTools.screenshotElement(tabId, ref);
      } else if (fullPage) {
        // 全页截图 - 需要滚动拼接
        dataUrl = await SnapshotTools.screenshotFullPage(tabId);
      } else {
        // 视口截图
        dataUrl = await chrome.tabs.captureVisibleTab(null, {
          format: type
        });
      }
      
      // 如果指定了文件名，保存到下载
      if (filename) {
        await chrome.downloads.download({
          url: dataUrl,
          filename: filename,
          saveAs: false
        });
      }
      
      return {
        success: true,
        dataUrl: dataUrl.substring(0, 100) + '...',  // 只返回前100字符
        filename: filename || `screenshot-${Date.now()}.${type}`
      };
      
    } catch (error) {
      console.error('[Screenshot] Error:', error);
      throw error;
    }
  }
  
  /**
   * 截取元素截图
   */
  static async screenshotElement(tabId, ref) {
    console.log('[Screenshot] Taking element screenshot, ref:', ref);
    
    try {
      // 1. 滚动元素到视口中心并获取位置
      const [rectResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: (ref) => {
          const element = window.__MCP_REF_MAP__?.get(ref);
          if (!element) throw new Error('Element not found');
          
          // 滚动到元素
          element.scrollIntoView({ 
            behavior: 'instant', 
            block: 'center', 
            inline: 'center' 
          });
          
          // 高亮元素（调试用）
          const originalOutline = element.style.outline;
          element.style.outline = '3px solid red';
          setTimeout(() => element.style.outline = originalOutline, 500);
          
          // 获取位置
          const rect = element.getBoundingClientRect();
          return {
            x: Math.max(0, Math.round(rect.x)),
            y: Math.max(0, Math.round(rect.y)),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          };
        },
        args: [ref],
        world: 'MAIN'
      });
      
      if (!rectResult || !rectResult.result) {
        throw new Error('Element not found');
      }
      
      const rect = rectResult.result;
      console.log('[Screenshot] Element rect:', rect);
      
      // 2. 等待滚动动画完成
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 3. 截取整个视口
      const fullScreenshot = await chrome.tabs.captureVisibleTab(null, {
        format: 'png'
      });
      
      // 4. 裁剪元素区域（在页面上下文中进行）
      const [croppedResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: cropImage,
        args: [fullScreenshot, rect],
        world: 'MAIN'
      });
      
      console.log('[Screenshot] Element screenshot completed');
      return croppedResult.result;
      
    } catch (error) {
      console.error('[Screenshot] Element screenshot error:', error);
      // 降级到全屏截图
      return await chrome.tabs.captureVisibleTab(null, {
        format: 'png'
      });
    }
  }
  
  /**
   * 截取全页截图
   */
  static async screenshotFullPage(tabId) {
    console.log('[Screenshot] Starting full page screenshot...');
    
    try {
      // 0. 激活标签页（确保滚动能够生效）
      const tab = await chrome.tabs.get(tabId);
      await chrome.tabs.update(tabId, { active: true });
      await chrome.windows.update(tab.windowId, { focused: true });
      console.log('[Screenshot] Tab activated');
      
      // 等待标签页激活
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 1. 获取页面尺寸
      const [metricsResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          function getStickyHeaderHeight() {
            try {
              const elements = Array.from(document.body.getElementsByTagName('*'));
              let header = 0;
              for (const el of elements) {
                const style = window.getComputedStyle(el);
                if (!style) continue;
                const pos = style.position;
                if (pos !== 'fixed' && pos !== 'sticky') continue;
                const rect = el.getBoundingClientRect();
                if (rect.height === 0 || rect.width === 0) continue;
                const topProp = parseInt(style.top || '0', 10);
                const isTopPinned = rect.top <= 1 || topProp === 0;
                if (!isTopPinned) continue;
                // 过滤掉异常超大元素
                if (rect.height > window.innerHeight * 0.5) continue;
                header = Math.max(header, Math.round(Math.min(rect.height, window.innerHeight)));
              }
              return header;
            } catch (_) {
              return 0;
            }
          }
          const headerHeight = getStickyHeaderHeight();
          return {
            scrollHeight: document.documentElement.scrollHeight,
            scrollWidth: document.documentElement.scrollWidth,
            viewportHeight: window.innerHeight,
            viewportWidth: window.innerWidth,
            originalScrollY: window.scrollY,
            headerHeight,
            devicePixelRatio: window.devicePixelRatio || 1
          };
        },
        world: 'MAIN'
      });
      
      const metrics = metricsResult.result;
      console.log('[Screenshot] Page metrics:', metrics);
      
      // 1.1 隐藏置顶/吸附头部，避免覆盖（仅在截图期间生效）
      const [hideResult] = await chrome.scripting.executeScript({
        target: { tabId },
        world: 'MAIN',
        func: () => {
          try {
            const hidden = [];
            const all = Array.from(document.body.getElementsByTagName('*'));
            for (const el of all) {
              const style = window.getComputedStyle(el);
              if (!style) continue;
              const pos = style.position;
              if (pos !== 'fixed' && pos !== 'sticky') continue;
              const rect = el.getBoundingClientRect();
              if (rect.height === 0 || rect.width === 0) continue;
              const topProp = parseInt(style.top || '0', 10);
              const isTopPinned = rect.top <= 1 || topProp === 0;
              if (!isTopPinned) continue;
              if (rect.height > window.innerHeight * 0.5) continue;
              // 记录原样式并隐藏
              el.dataset.__mcp_prev_visibility = el.style.visibility || '';
              el.style.visibility = 'hidden';
              hidden.push(el);
            }
            (window).__MCP_HIDDEN_STICKY__ = hidden;
            return { hiddenCount: hidden.length };
          } catch (e) {
            return { hiddenCount: 0, error: e?.message };
          }
        }
      });
      console.log('[Screenshot] Hidden sticky headers:', hideResult?.result?.hiddenCount || 0);
      
      // 2. 计算需要截图的次数（考虑置顶/吸附头部）
      const headerHeight = Math.max(0, metrics.headerHeight || 0);
      const seamOverlap = Math.max(2, Math.round(3 * (metrics.devicePixelRatio || 1))); // 约3px物理像素
      const stepHeight = Math.max(1, metrics.viewportHeight - headerHeight - seamOverlap);
      const screenshotCount = Math.ceil((metrics.scrollHeight - headerHeight) / stepHeight);
      console.log('[Screenshot] Will take', screenshotCount, 'screenshots');
      
      // 3. 限制最大截图数（防止内存溢出）
      const maxScreenshots = 20; // 最多20屏
      if (screenshotCount > maxScreenshots) {
        console.warn('[Screenshot] Page too long, limiting to', maxScreenshots, 'screenshots');
      }
      
      const actualCount = Math.min(screenshotCount, maxScreenshots);
      const screenshots = [];
      
      // 4. 逐屏截图
      for (let i = 0; i < actualCount; i++) {
        const scrollY = i * stepHeight;
        
        // 滚动到指定位置
        await chrome.scripting.executeScript({
          target: { tabId },
          func: (y) => {
            window.scrollTo(0, y);
            // 强制重绘
            document.body.getBoundingClientRect();
          },
          args: [scrollY],
          world: 'MAIN'
        });
        
        // 等待渲染和Chrome API限制（每秒最多2次截图）
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // 验证滚动位置
        const [scrollCheck] = await chrome.scripting.executeScript({
          target: { tabId },
          func: () => window.scrollY,
          world: 'MAIN'
        });
        
        console.log(`[Screenshot] Scroll ${i + 1}/${actualCount}: expected=${scrollY}, actual=${scrollCheck.result}, step=${stepHeight}, header=${headerHeight}`);
        
        // 截图
        const dataUrl = await chrome.tabs.captureVisibleTab(null, {
          format: 'png'
        });
        
        screenshots.push(dataUrl);
        console.log(`[Screenshot] Captured screenshot ${i + 1}/${actualCount}`);
      }
      
      // 5. 恢复原始滚动位置
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (y) => window.scrollTo(0, y),
        args: [metrics.originalScrollY],
        world: 'MAIN'
      });
      
      // 5.1 恢复隐藏的置顶/吸附头部
      await chrome.scripting.executeScript({
        target: { tabId },
        world: 'MAIN',
        func: () => {
          try {
            const list = (window).__MCP_HIDDEN_STICKY__ || [];
            for (const el of list) {
              if (!el) continue;
              const prev = el.dataset.__mcp_prev_visibility || '';
              el.style.visibility = prev;
              delete el.dataset.__mcp_prev_visibility;
            }
            (window).__MCP_HIDDEN_STICKY__ = [];
          } catch (_) {}
        }
      });
      
      // 6. 拼接图片（在 content script 中进行）
      console.log(`[Screenshot] Stitching ${screenshots.length} screenshots into one image...`);
      const [stitchedResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: stitchScreenshots,
        args: [screenshots, { ...metrics, headerHeight, stepHeight, seamOverlap }],
        world: 'MAIN'
      });
      
      console.log('[Screenshot] Full page screenshot completed successfully');
      console.log(`[Screenshot] Final dimensions: ${metrics.viewportWidth}x${metrics.scrollHeight}`);
      console.log(`[Screenshot] Stitched ${actualCount} screenshots`);
      
      return stitchedResult.result;
      
    } catch (error) {
      console.error('[Screenshot] Full page error:', error);
      // 降级到视口截图
      return await chrome.tabs.captureVisibleTab(null, {
        format: 'png'
      });
    }
  }
  
  /**
   * 转换为YAML格式
   */
  static convertToYAML(elements, indent = 0) {
    const lines = [];
    const prefix = '  '.repeat(indent);
    
    for (const el of elements) {
      let line = `${prefix}- ${el.role || el.tag}`;
      
      if (el.text) {
        line += ` "${el.text.substring(0, 50)}"`;
      }
      
      if (el.ref) {
        line += ` [ref=${el.ref}]`;
      }
      
      if (el.attributes) {
        if (el.attributes.active) line += ' [active]';
        if (el.attributes.checked) line += ' [checked]';
        if (el.attributes.disabled) line += ' [disabled]';
        if (el.isCursorPointer) line += ' [cursor=pointer]';
      }
      
      lines.push(line);
      
      // 添加子属性
      if (el.attributes?.href) {
        lines.push(`${prefix}  - /url: ${el.attributes.href}`);
      }
      if (el.attributes?.level) {
        lines.push(`${prefix}  - [level=${el.attributes.level}]`);
      }
      
      // TODO: 处理子元素
    }
    
    return lines.join('\n');
  }
}

/**
 * 裁剪图片指定区域（注入到页面中执行）
 */
function cropImage(dataUrl, rect) {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      
      img.onload = () => {
        // 创建 Canvas
        const canvas = document.createElement('canvas');
        canvas.width = rect.width;
        canvas.height = rect.height;
        const ctx = canvas.getContext('2d');
        
        // 裁剪指定区域
        ctx.drawImage(
          img,
          rect.x, rect.y, rect.width, rect.height,  // 源区域
          0, 0, rect.width, rect.height              // 目标区域
        );
        
        // 转换为 Data URL
        const croppedDataUrl = canvas.toDataURL('image/png');
        
        // 清理
        canvas.remove();
        
        resolve(croppedDataUrl);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 拼接多个截图为一张完整图片（注入到页面中执行）
 */
function stitchScreenshots(screenshots, metrics) {
  return new Promise((resolve, reject) => {
    try {
      const { scrollHeight, viewportHeight, viewportWidth, headerHeight = 0, stepHeight = viewportHeight, seamOverlap = 2 } = metrics;
      
      // 创建 Canvas
      const canvas = document.createElement('canvas');
      // Canvas 尺寸需要使用逻辑像素，绘制时会自动处理 DPR
      canvas.width = viewportWidth;
      canvas.height = scrollHeight;
      const ctx = canvas.getContext('2d');
      
      console.log(`[Screenshot] Canvas size: ${canvas.width}x${canvas.height}`);
      
      // 加载所有图片
      const imagePromises = screenshots.map((dataUrl, index) => {
        return new Promise((resolveImg, rejectImg) => {
          const img = new Image();
          img.onload = () => resolveImg({ img, index });
          img.onerror = () => rejectImg(new Error(`Failed to load image ${index}`));
          img.src = dataUrl;
        });
      });
      
      // 等待所有图片加载完成
      Promise.all(imagePromises).then(images => {
        console.log(`[Screenshot] Stitching ${images.length} images...`);
        console.log(`[Screenshot] First image size: ${images[0]?.img.width}x${images[0]?.img.height}`);
        
        // 绘制所有图片
        images.forEach(({ img, index }) => {
          // 目标在画布上的y位置，按步长累积
          const y = index * stepHeight;
          
          // 本张截图顶部需要裁掉的高度（除第1张外都需要裁掉置顶头部）
          const topCrop = index === 0 ? 0 : (headerHeight + seamOverlap);
          
          // 计算实际需要绘制的高度（最后一张可能不足一屏）
          const remainingHeight = scrollHeight - y;
          const drawHeight = Math.min(viewportHeight - topCrop, remainingHeight);
          
          // 按设备像素比换算源图像的裁剪起点与高度
          const scaleY = img.height / viewportHeight;
          const sourceY = Math.floor(topCrop * scaleY);
          const sourceHeight = Math.floor(drawHeight * scaleY);
          
          console.log(`[Screenshot] Stitch piece ${index + 1}/${images.length}: y=${y}, topCrop=${topCrop}, drawHeight=${drawHeight}, srcY=${sourceY}, srcH=${sourceHeight}`);
          
          ctx.drawImage(
            img,
            0, sourceY, img.width, sourceHeight, // 源矩形（裁掉置顶头部）
            0, y, viewportWidth, drawHeight       // 目标矩形
          );
        });
        
        console.log('[Screenshot] All images stitched successfully');
        
        // 转换为 Data URL
        const stitchedDataUrl = canvas.toDataURL('image/png');
        
        // 清理
        canvas.remove();
        
        resolve(stitchedDataUrl);
      }).catch(error => {
        console.error('[Screenshot] Stitching error:', error);
        reject(error);
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 页面快照收集函数（注入到页面中执行）
 */
function capturePageSnapshot() {
  const elements = [];
  const refMap = new Map();
  
  // 选择器：所有可交互元素
  const selectors = [
    'a[href]',
    'button',
    'input',
    'select',
    'textarea',
    '[role="button"]',
    '[role="link"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="textbox"]',
    '[role="combobox"]',
    '[onclick]',
    '[contenteditable]',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
  ].join(',');
  
  const foundElements = document.querySelectorAll(selectors);
  
  let elementIndex = 0;
  
  foundElements.forEach(el => {
    // 检查可见性
    if (!isVisible(el)) return;
    
    const rect = el.getBoundingClientRect();
    const ref = generateRef(el, elementIndex++);
    
    const elementData = {
      ref,
      tag: el.tagName.toLowerCase(),
      role: getRoleByTag(el),
      text: getVisibleText(el),
      attributes: {
        id: el.id || undefined,
        name: el.name || undefined,
        href: el.href || undefined,
        value: el.value || undefined,
        placeholder: el.placeholder || undefined,
        ariaLabel: el.getAttribute('aria-label') || undefined,
        active: el === document.activeElement,
        checked: el.checked || undefined,
        disabled: el.disabled || undefined,
        level: getHeadingLevel(el)
      },
      position: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      },
      isCursorPointer: window.getComputedStyle(el).cursor === 'pointer'
    };
    
    elements.push(elementData);
    
    // 保存到全局映射
    refMap.set(ref, el);
  });
  
  // 保存ref映射到全局
  window.__MCP_REF_MAP__ = refMap;
  
  return {
    url: window.location.href,
    title: document.title,
    elements,
    timestamp: Date.now()
  };
  
  // 辅助函数
  function isVisible(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    
    const style = window.getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') return false;
    
    return true;
  }
  
  function generateRef(el, index) {
    // 生成唯一ref
    const path = getElementPath(el);
    const hash = simpleHash(path);
    return `e${hash % 10000 + index}`;
  }
  
  function getElementPath(el) {
    const path = [];
    let current = el;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector += `#${current.id}`;
        path.unshift(selector);
        break;
      }
      
      const siblings = Array.from(current.parentNode?.children || []);
      const sameTagSiblings = siblings.filter(s => s.tagName === current.tagName);
      
      if (sameTagSiblings.length > 1) {
        const index = sameTagSiblings.indexOf(current);
        selector += `:nth-of-type(${index + 1})`;
      }
      
      path.unshift(selector);
      current = current.parentNode;
    }
    
    return path.join(' > ');
  }
  
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
  
  function getVisibleText(el) {
    // 获取元素的可见文本
    const clone = el.cloneNode(true);
    const children = clone.querySelectorAll('*');
    children.forEach(child => child.remove());
    return clone.textContent.trim().substring(0, 100);
  }
  
  function getRoleByTag(el) {
    const roleMap = {
      'A': 'link',
      'BUTTON': 'button',
      'INPUT': el.type === 'checkbox' ? 'checkbox' :
               el.type === 'radio' ? 'radio' : 'textbox',
      'SELECT': 'combobox',
      'TEXTAREA': 'textbox',
      'H1': 'heading',
      'H2': 'heading',
      'H3': 'heading',
      'H4': 'heading',
      'H5': 'heading',
      'H6': 'heading'
    };
    return el.getAttribute('role') || roleMap[el.tagName] || 'generic';
  }
  
  function getHeadingLevel(el) {
    const match = el.tagName.match(/^H(\d)$/);
    return match ? parseInt(match[1]) : undefined;
  }
}






