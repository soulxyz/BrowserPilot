/**
 * Interaction Tools
 * 页面交互相关工具
 */

export class InteractionTools {
  /**
   * browser_click - 点击元素
   */
  static async click(params, tabId) {
    const { element, ref, button = 'left', doubleClick = false, modifiers = [] } = params;
    
    console.log('[Interaction] Clicking element:', element, 'ref:', ref);
    
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: clickElement,
      args: [ref, { button, doubleClick, modifiers }]
    });
    
    if (!result || !result.result) {
      throw new Error('Click failed');
    }
    
    return result.result;
  }
  
  /**
   * browser_type - 输入文本
   */
  static async type(params, tabId) {
    const { element, ref, text, slowly = false, submit = false } = params;
    
    console.log('[Interaction] Typing text:', text, 'into element:', element);
    
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: typeText,
      args: [ref, text, { slowly, submit }]
    });
    
    if (!result || !result.result) {
      throw new Error('Type failed');
    }
    
    return result.result;
  }
  
  /**
   * browser_hover - 鼠标悬停
   */
  static async hover(params, tabId) {
    const { element, ref } = params;
    
    console.log('[Interaction] Hovering over element:', element);
    
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: hoverElement,
      args: [ref]
    });
    
    return result?.result || { success: true };
  }
  
  /**
   * browser_press_key - 按键
   */
  static async pressKey(params, tabId) {
    const { key } = params;
    
    console.log('[Interaction] Pressing key:', key);
    
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: pressKey,
      args: [key]
    });
    
    return { success: true, key };
  }
  
  /**
   * browser_drag - 拖放
   */
  static async drag(params, tabId) {
    const { startElement, startRef, endElement, endRef } = params;
    
    console.log('[Interaction] Dragging from:', startElement, 'to:', endElement);
    
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: dragElement,
      args: [startRef, endRef]
    });
    
    return result?.result || { success: true };
  }
  
  /**
   * browser_wait_for - 等待条件
   */
  static async waitFor(params, tabId) {
    const { text, textGone, time } = params;
    
    console.log('[Interaction] Waiting for:', { text, textGone, time });
    
    if (time) {
      // 等待固定时间
      await new Promise(resolve => setTimeout(resolve, time * 1000));
      return { success: true, waited: time };
    }
    
    if (text || textGone) {
      // 等待文本出现/消失
      const [result] = await chrome.scripting.executeScript({
        target: { tabId },
        func: waitForText,
        args: [text || textGone, textGone ? 'hidden' : 'visible']
      });
      
      return result?.result || { success: true };
    }
    
    throw new Error('No wait condition specified');
  }
  
  /**
   * browser_select_option - 下拉框选择
   */
  static async selectOption(params, tabId) {
    const { element, ref, values } = params;
    
    console.log('[Interaction] Selecting option:', values, 'in element:', ref);
    
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: selectOptionInElement,
      args: [ref, Array.isArray(values) ? values : [values]],
      world: 'MAIN'
    });
    
    if (!result || !result.result) {
      throw new Error('Select option failed');
    }
    
    return result.result;
  }
  
  /**
   * browser_fill_form - 批量填充表单
   */
  static async fillForm(params, tabId) {
    const { fields } = params;
    
    console.log('[Interaction] Filling form with', fields.length, 'fields');
    
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: fillFormFields,
      args: [fields],
      world: 'MAIN'
    });
    
    if (!result || !result.result) {
      throw new Error('Fill form failed');
    }
    
    return result.result;
  }
}

// =============================================================================
// 注入函数（在页面上下文中执行）
// =============================================================================

function clickElement(ref, options) {
  const element = window.__MCP_REF_MAP__?.get(ref);
  if (!element) throw new Error(`Element not found: ${ref}`);
  
  // 滚动到可见
  element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  
  // 等待一小会儿确保滚动完成
  return new Promise(resolve => {
    setTimeout(() => {
      const rect = element.getBoundingClientRect();
      
      // 高亮显示（调试用）
      const originalOutline = element.style.outline;
      element.style.outline = '2px solid red';
      setTimeout(() => element.style.outline = originalOutline, 500);
      
      // 模拟完整的鼠标事件序列
      const clickOptions = {
        bubbles: true,
        cancelable: true,
        view: window,
        button: options.button === 'right' ? 2 : options.button === 'middle' ? 1 : 0,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        ctrlKey: options.modifiers?.includes('Control'),
        shiftKey: options.modifiers?.includes('Shift'),
        altKey: options.modifiers?.includes('Alt'),
        metaKey: options.modifiers?.includes('Meta')
      };
      
      element.dispatchEvent(new MouseEvent('mouseover', clickOptions));
      element.dispatchEvent(new MouseEvent('mouseenter', clickOptions));
      element.dispatchEvent(new MouseEvent('mousemove', clickOptions));
      element.dispatchEvent(new MouseEvent('mousedown', clickOptions));
      
      if (element.focus) element.focus();
      
      element.dispatchEvent(new MouseEvent('mouseup', clickOptions));
      element.dispatchEvent(new MouseEvent('click', clickOptions));
      
      if (options.doubleClick) {
        element.dispatchEvent(new MouseEvent('dblclick', clickOptions));
      }
      
      resolve({
        success: true,
        ref,
        element: {
          tag: element.tagName,
          text: element.textContent?.substring(0, 50)
        }
      });
    }, 300);
  });
}

function typeText(ref, text, options) {
  const element = window.__MCP_REF_MAP__?.get(ref);
  if (!element) throw new Error(`Element not found: ${ref}`);
  
  element.focus();
  element.value = '';
  
  return new Promise(async resolve => {
    if (options.slowly) {
      // 逐字符输入
      for (const char of text) {
        const keyCode = char.charCodeAt(0);
        
        element.dispatchEvent(new KeyboardEvent('keydown', {
          key: char,
          code: `Key${char.toUpperCase()}`,
          keyCode,
          bubbles: true
        }));
        
        element.value += char;
        
        element.dispatchEvent(new InputEvent('input', {
          data: char,
          inputType: 'insertText',
          bubbles: true
        }));
        
        element.dispatchEvent(new KeyboardEvent('keyup', {
          key: char,
          keyCode,
          bubbles: true
        }));
        
        await new Promise(r => setTimeout(r, 50));
      }
    } else {
      // 快速填充
      element.value = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // 提交
    if (options.submit) {
      element.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        bubbles: true
      }));
      element.dispatchEvent(new KeyboardEvent('keyup', {
        key: 'Enter',
        keyCode: 13,
        bubbles: true
      }));
      
      const form = element.closest('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true }));
      }
    }
    
    resolve({ success: true, value: element.value });
  });
}

function hoverElement(ref) {
  const element = window.__MCP_REF_MAP__?.get(ref);
  if (!element) throw new Error(`Element not found: ${ref}`);
  
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  return new Promise(resolve => {
    setTimeout(() => {
      const rect = element.getBoundingClientRect();
      const hoverOptions = {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
      };
      
      element.dispatchEvent(new MouseEvent('mouseover', hoverOptions));
      element.dispatchEvent(new MouseEvent('mouseenter', hoverOptions));
      element.dispatchEvent(new MouseEvent('mousemove', hoverOptions));
      
      resolve({ success: true });
    }, 200);
  });
}

function pressKey(key) {
  const activeElement = document.activeElement || document.body;
  
  const keyCodeMap = {
    'Enter': 13,
    'Escape': 27,
    'Tab': 9,
    'Backspace': 8,
    'ArrowLeft': 37,
    'ArrowUp': 38,
    'ArrowRight': 39,
    'ArrowDown': 40
  };
  
  const keyCode = keyCodeMap[key] || key.charCodeAt(0);
  
  activeElement.dispatchEvent(new KeyboardEvent('keydown', {
    key,
    code: key,
    keyCode,
    bubbles: true
  }));
  
  activeElement.dispatchEvent(new KeyboardEvent('keyup', {
    key,
    keyCode,
    bubbles: true
  }));
  
  return { success: true };
}

function dragElement(startRef, endRef) {
  const startEl = window.__MCP_REF_MAP__?.get(startRef);
  const endEl = window.__MCP_REF_MAP__?.get(endRef);
  
  if (!startEl || !endEl) throw new Error('Element not found');
  
  const startRect = startEl.getBoundingClientRect();
  const endRect = endEl.getBoundingClientRect();
  
  // 模拟拖放事件
  const dragStartEvent = new DragEvent('dragstart', {
    bubbles: true,
    cancelable: true,
    clientX: startRect.left + startRect.width / 2,
    clientY: startRect.top + startRect.height / 2
  });
  
  const dropEvent = new DragEvent('drop', {
    bubbles: true,
    cancelable: true,
    clientX: endRect.left + endRect.width / 2,
    clientY: endRect.top + endRect.height / 2
  });
  
  startEl.dispatchEvent(dragStartEvent);
  endEl.dispatchEvent(dropEvent);
  startEl.dispatchEvent(new DragEvent('dragend', { bubbles: true }));
  
  return { success: true };
}

function waitForText(text, state, timeout = 30000) {
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      const found = findTextInPage(text);
      const isVisible = found && isElementVisible(found);
      
      if ((state === 'visible' && isVisible) || (state === 'hidden' && !isVisible)) {
        clearInterval(checkInterval);
        resolve({ found: true, text });
      }
      
      if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        reject(new Error(`Timeout waiting for text: ${text}`));
      }
    }, 100);
  });
  
  function findTextInPage(text) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.includes(text)) {
        return node.parentElement;
      }
    }
    return null;
  }
  
  function isElementVisible(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && 
           window.getComputedStyle(element).visibility !== 'hidden';
  }
}

function selectOptionInElement(ref, values) {
  const selectEl = window.__MCP_REF_MAP__?.get(ref);
  if (!selectEl) {
    throw new Error(`Element not found: ${ref}`);
  }
  
  if (selectEl.tagName !== 'SELECT') {
    throw new Error(`Element is not a SELECT: ${selectEl.tagName}`);
  }
  
  // 清除现有选择
  Array.from(selectEl.options).forEach(opt => opt.selected = false);
  
  // 选择新值
  const selected = [];
  const notFound = [];
  
  values.forEach(value => {
    const option = Array.from(selectEl.options).find(opt => 
      opt.value === value || opt.text === value || opt.label === value
    );
    
    if (option) {
      option.selected = true;
      selected.push({ value: option.value, text: option.text });
    } else {
      notFound.push(value);
    }
  });
  
  // 触发事件
  selectEl.dispatchEvent(new Event('change', { bubbles: true }));
  selectEl.dispatchEvent(new Event('input', { bubbles: true }));
  
  // 高亮显示（调试用）
  const originalOutline = selectEl.style.outline;
  selectEl.style.outline = '2px solid green';
  setTimeout(() => selectEl.style.outline = originalOutline, 500);
  
  return { 
    success: true, 
    selected: selected,
    selectedCount: selected.length,
    notFound: notFound.length > 0 ? notFound : undefined
  };
}

function fillFormFields(fields) {
  const results = [];
  
  for (const field of fields) {
    try {
      const element = window.__MCP_REF_MAP__?.get(field.ref);
      if (!element) {
        results.push({ 
          name: field.name, 
          success: false, 
          error: 'Element not found' 
        });
        continue;
      }
      
      let value;
      
      switch(field.type) {
        case 'textbox':
          element.focus();
          element.value = field.value;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          value = element.value;
          
          // 高亮显示
          const originalBg = element.style.backgroundColor;
          element.style.backgroundColor = '#d4edda';
          setTimeout(() => element.style.backgroundColor = originalBg, 500);
          break;
          
        case 'checkbox':
        case 'radio':
          const shouldCheck = field.value === 'true' || 
                             field.value === true || 
                             field.value === '1' ||
                             field.value === 1;
          element.checked = shouldCheck;
          element.dispatchEvent(new Event('change', { bubbles: true }));
          value = element.checked;
          break;
          
        case 'combobox':
          if (element.tagName !== 'SELECT') {
            throw new Error('Element is not a SELECT');
          }
          
          const option = Array.from(element.options).find(opt => 
            opt.text === field.value || opt.value === field.value
          );
          
          if (option) {
            option.selected = true;
            element.dispatchEvent(new Event('change', { bubbles: true }));
            value = element.value;
          } else {
            throw new Error(`Option not found: ${field.value}`);
          }
          break;
          
        case 'slider':
          element.value = field.value;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          value = element.value;
          break;
          
        default:
          throw new Error(`Unknown field type: ${field.type}`);
      }
      
      results.push({ 
        name: field.name, 
        success: true, 
        value: value 
      });
      
    } catch (error) {
      results.push({ 
        name: field.name, 
        success: false, 
        error: error.message 
      });
    }
  }
  
  return { 
    success: true, 
    fields: results,
    successCount: results.filter(r => r.success).length,
    totalCount: results.length
  };
}






