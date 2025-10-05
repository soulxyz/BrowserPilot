/**
 * Page Context Script
 * 在页面上下文中运行，拦截console并提供工具函数
 */

(function() {
  'use strict';
  
  if (window.__MCP_INITIALIZED__) {
    console.log('[MCP Page] Already initialized');
    return;
  }
  
  window.__MCP_INITIALIZED__ = true;
  console.log('[MCP Page] Initializing...');
  
  // =============================================================================
  // Console拦截
  // =============================================================================
  
  const consoleMessages = [];
  const originalConsole = {};
  const consoleMethods = ['log', 'warn', 'error', 'info', 'debug'];
  
  consoleMethods.forEach(method => {
    originalConsole[method] = console[method];
    
    console[method] = function(...args) {
      // 序列化参数
      const serializedArgs = args.map(arg => {
        try {
          if (arg instanceof Error) {
            return {
              __type: 'Error',
              message: arg.message,
              stack: arg.stack
            };
          }
          if (typeof arg === 'object' && arg !== null) {
            return JSON.parse(JSON.stringify(arg));
          }
          return String(arg);
        } catch (e) {
          return '[Unserializable]';
        }
      });
      
      const message = {
        type: method,
        args: serializedArgs,
        stack: new Error().stack,
        timestamp: Date.now(),
        url: window.location.href
      };
      
      consoleMessages.push(message);
      
      // 通知Content Script
      window.postMessage({
        type: '__MCP_CONSOLE__',
        payload: message
      }, '*');
      
      // 调用原始方法
      originalConsole[method].apply(console, args);
    };
  });
  
  // 捕获未处理的错误
  window.addEventListener('error', (event) => {
    const message = {
      type: 'error',
      args: [event.message],
      stack: event.error?.stack,
      timestamp: Date.now(),
      url: event.filename,
      line: event.lineno,
      column: event.colno
    };
    
    consoleMessages.push(message);
    
    window.postMessage({
      type: '__MCP_CONSOLE__',
      payload: message
    }, '*');
  });
  
  // 未处理的Promise拒绝
  window.addEventListener('unhandledrejection', (event) => {
    const message = {
      type: 'error',
      args: [`Unhandled Promise Rejection: ${event.reason}`],
      stack: event.reason?.stack,
      timestamp: Date.now()
    };
    
    consoleMessages.push(message);
    
    window.postMessage({
      type: '__MCP_CONSOLE__',
      payload: message
    }, '*');
  });
  
  // =============================================================================
  // 暴露API
  // =============================================================================
  
  window.__MCP_GET_CONSOLE__ = () => [...consoleMessages];
  window.__MCP_CLEAR_CONSOLE__ = () => {
    consoleMessages.length = 0;
  };
  
  // Ref映射表（由snapshot工具创建）
  window.__MCP_REF_MAP__ = new Map();
  
  // 监听清理ref的消息
  window.addEventListener('message', (event) => {
    if (event.data.type === '__MCP_CLEAR_REFS__') {
      window.__MCP_REF_MAP__.clear();
      console.log('[MCP Page] Refs cleared');
    }
  });
  
  console.log('[MCP Page] Initialized successfully');
})();






