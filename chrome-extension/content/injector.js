/**
 * Content Script Injector
 * 注入页面上下文脚本并建立通信桥梁
 */

console.log('[MCP Content] Injector loaded');

// 注入页面上下文脚本
function injectPageContext() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected/page-context.js');
  script.onload = function() {
    this.remove();
    console.log('[MCP Content] Page context script injected');
  };
  (document.head || document.documentElement).appendChild(script);
}

// 立即注入
injectPageContext();

// 监听来自页面的消息
window.addEventListener('message', (event) => {
  // 只接受来自同一窗口的消息
  if (event.source !== window) return;
  
  if (event.data.type === '__MCP_CONSOLE__') {
    // 转发console消息到background
    chrome.runtime.sendMessage({
      type: 'console_message',
      data: event.data.payload
    }).catch(() => {
      // Ignore if background is not ready
    });
  }
});

// 监听来自background的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[MCP Content] Message received:', request.type);
  
  switch (request.type) {
    case 'ping':
      sendResponse({ pong: true });
      break;
      
    case 'navigation_completed':
      // 页面导航完成，清理旧的ref
      window.postMessage({
        type: '__MCP_CLEAR_REFS__'
      }, '*');
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ error: 'Unknown message type' });
  }
  
  return true;
});

console.log('[MCP Content] Injector ready');






