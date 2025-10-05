/**
 * Navigation Tools
 * 页面导航相关工具
 */

import { SnapshotTools } from './snapshot.js';

export class NavigationTools {
  /**
   * browser_navigate - 导航到指定URL
   */
  static async navigate(params, tabId) {
    const { url } = params;
    
    if (!url) {
      throw new Error('URL is required');
    }
    
    console.log('[Navigation] Navigating to:', url, 'in tab:', tabId);
    
    // 更新标签页URL
    await chrome.tabs.update(tabId, { url });
    
    // 等待页面加载完成
    await NavigationTools.waitForPageLoad(tabId);
    
    // 获取页面状态
    const tab = await chrome.tabs.get(tabId);
    
    // 获取快照
    const snapshot = await SnapshotTools.capture({}, tabId);
    
    return {
      success: true,
      url: tab.url,
      title: tab.title,
      snapshot
    };
  }
  
  /**
   * browser_navigate_back - 返回上一页
   */
  static async goBack(params, tabId) {
    console.log('[Navigation] Going back in tab:', tabId);
    
    // 执行后退
    await chrome.tabs.goBack(tabId);
    
    // 等待页面加载
    await NavigationTools.waitForPageLoad(tabId);
    
    // 获取页面状态
    const tab = await chrome.tabs.get(tabId);
    
    // 获取快照
    const snapshot = await SnapshotTools.capture({}, tabId);
    
    return {
      success: true,
      url: tab.url,
      title: tab.title,
      snapshot
    };
  }
  
  /**
   * 等待页面加载完成
   */
  static async waitForPageLoad(tabId, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkStatus = async () => {
        try {
          const tab = await chrome.tabs.get(tabId);
          
          if (tab.status === 'complete') {
            resolve();
            return;
          }
          
          if (Date.now() - startTime > timeout) {
            reject(new Error('Page load timeout'));
            return;
          }
          
          setTimeout(checkStatus, 100);
        } catch (error) {
          reject(error);
        }
      };
      
      checkStatus();
    });
  }
}






