/**
 * Network Monitor
 * 监控所有网络请求
 */

export class NetworkMonitor {
  constructor() {
    this.requests = new Map(); // requestId -> request info
    this.requestsByTab = new Map(); // tabId -> requestIds[]
    this.setupListeners();
  }
  
  setupListeners() {
    // 请求开始
    chrome.webRequest.onBeforeRequest.addListener(
      (details) => {
        this.requests.set(details.requestId, {
          id: details.requestId,
          tabId: details.tabId,
          url: details.url,
          method: details.method,
          type: details.type,
          timestamp: details.timeStamp,
          initiator: details.initiator,
          requestBody: details.requestBody
        });
        
        // 按tab分组
        if (!this.requestsByTab.has(details.tabId)) {
          this.requestsByTab.set(details.tabId, []);
        }
        this.requestsByTab.get(details.tabId).push(details.requestId);
      },
      { urls: ["<all_urls>"] },
      ["requestBody"]
    );
    
    // 请求头发送前
    chrome.webRequest.onBeforeSendHeaders.addListener(
      (details) => {
        const request = this.requests.get(details.requestId);
        if (request) {
          request.requestHeaders = details.requestHeaders;
        }
      },
      { urls: ["<all_urls>"] },
      ["requestHeaders"]
    );
    
    // 响应头接收
    chrome.webRequest.onResponseStarted.addListener(
      (details) => {
        const request = this.requests.get(details.requestId);
        if (request) {
          request.statusCode = details.statusCode;
          request.statusLine = details.statusLine;
          request.responseHeaders = details.responseHeaders;
          request.ip = details.ip;
        }
      },
      { urls: ["<all_urls>"] },
      ["responseHeaders"]
    );
    
    // 请求完成
    chrome.webRequest.onCompleted.addListener(
      (details) => {
        const request = this.requests.get(details.requestId);
        if (request) {
          request.completed = true;
          request.fromCache = details.fromCache;
          request.duration = details.timeStamp - request.timestamp;
        }
      },
      { urls: ["<all_urls>"] }
    );
    
    // 请求错误
    chrome.webRequest.onErrorOccurred.addListener(
      (details) => {
        const request = this.requests.get(details.requestId);
        if (request) {
          request.error = details.error;
          request.completed = true;
        }
      },
      { urls: ["<all_urls>"] }
    );
  }
  
  /**
   * 获取指定标签页的所有请求
   */
  getRequests(tabId) {
    const requestIds = this.requestsByTab.get(tabId) || [];
    return requestIds
      .map(id => this.requests.get(id))
      .filter(r => r)
      .map(r => ({
        method: r.method,
        url: r.url,
        status: r.statusCode,
        type: r.type,
        size: this.calculateSize(r),
        duration: r.duration,
        fromCache: r.fromCache,
        error: r.error
      }));
  }
  
  /**
   * 计算请求大小
   */
  calculateSize(request) {
    const contentLength = request.responseHeaders?.find(
      h => h.name.toLowerCase() === 'content-length'
    );
    return contentLength ? parseInt(contentLength.value) : 0;
  }
  
  /**
   * 清理指定标签页的请求记录
   */
  clearRequests(tabId) {
    const requestIds = this.requestsByTab.get(tabId) || [];
    requestIds.forEach(id => this.requests.delete(id));
    this.requestsByTab.delete(tabId);
  }
}






