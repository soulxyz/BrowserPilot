/**
 * Console Collector
 * 收集来自页面的console消息
 */

export class ConsoleCollector {
  constructor() {
    this.messagesByTab = new Map(); // tabId -> messages[]
  }
  
  /**
   * 添加console消息
   */
  add(tabId, message) {
    if (!this.messagesByTab.has(tabId)) {
      this.messagesByTab.set(tabId, []);
    }
    
    this.messagesByTab.get(tabId).push({
      ...message,
      timestamp: message.timestamp || Date.now()
    });
  }
  
  /**
   * 获取指定标签页的所有消息
   */
  getMessages(tabId) {
    return this.messagesByTab.get(tabId) || [];
  }
  
  /**
   * 清理指定标签页的消息
   */
  clearMessages(tabId) {
    this.messagesByTab.delete(tabId);
  }
}






