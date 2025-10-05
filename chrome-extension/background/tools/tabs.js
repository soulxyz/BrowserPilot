/**
 * Tab Tools
 * 标签页管理工具
 */

export class TabTools {
  /**
   * browser_tabs - 标签页管理
   */
  static async manageTabs(params, tabId) {
    const { action, index } = params;
    
    console.log('[Tabs] Action:', action, 'index:', index);
    
    switch (action) {
      case 'list':
        return await TabTools.listTabs();
        
      case 'new':
        return await TabTools.newTab();
        
      case 'close':
        return await TabTools.closeTab(index);
        
      case 'select':
        return await TabTools.selectTab(index);
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
  
  /**
   * browser_resize - 调整窗口大小
   */
  static async resize(params, tabId) {
    const { width, height } = params;
    
    console.log('[Tabs] Resizing window to:', width, 'x', height);
    
    const window = await chrome.windows.getCurrent();
    await chrome.windows.update(window.id, { width, height });
    
    return {
      success: true,
      width,
      height
    };
  }
  
  // 私有方法
  
  static async listTabs() {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const tabList = tabs.map((tab, index) => ({
      index,
      id: tab.id,
      title: tab.title,
      url: tab.url,
      current: tab.id === currentTab?.id
    }));
    
    return {
      tabs: tabList,
      count: tabList.length
    };
  }
  
  static async newTab() {
    const tab = await chrome.tabs.create({ url: 'about:blank' });
    
    return {
      success: true,
      tabId: tab.id,
      index: tab.index
    };
  }
  
  static async closeTab(index) {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const tab = tabs[index];
    
    if (!tab) {
      throw new Error(`Tab not found at index: ${index}`);
    }
    
    await chrome.tabs.remove(tab.id);
    
    return {
      success: true,
      closed: index
    };
  }
  
  static async selectTab(index) {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const tab = tabs[index];
    
    if (!tab) {
      throw new Error(`Tab not found at index: ${index}`);
    }
    
    await chrome.tabs.update(tab.id, { active: true });
    
    return {
      success: true,
      selected: index,
      tabId: tab.id
    };
  }
}






