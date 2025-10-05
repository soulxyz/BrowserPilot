/**
 * Debug Tools
 * 调试相关工具
 */

export class DebugTools {
  /**
   * browser_console_messages - 获取console消息
   */
  static async getConsoleMessages(params, tabId) {
    console.log('[Debug] Getting console messages for tab:', tabId);
    
    // 从页面获取console消息
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        return window.__MCP_GET_CONSOLE__ ? window.__MCP_GET_CONSOLE__() : [];
      }
    });
    
    const messages = result?.result || [];
    
    return {
      messages,
      count: messages.length
    };
  }
  
  /**
   * browser_network_requests - 获取网络请求
   */
  static async getNetworkRequests(params, tabId, networkMonitor) {
    console.log('[Debug] Getting network requests for tab:', tabId);
    
    if (!networkMonitor) {
      return {
        requests: [],
        count: 0,
        message: 'Network monitor not initialized'
      };
    }
    
    // 从NetworkMonitor获取实际数据
    const requests = networkMonitor.getRequests(tabId);
    
    return {
      requests,
      count: requests.length,
      tabId
    };
  }
  
  /**
   * browser_evaluate - 执行JavaScript
   */
  static async evaluate(params, tabId) {
    const { function: code } = params;
    
    console.log('[Debug] Evaluating code:', code?.substring(0, 50) + '...');
    
    try {
      // 方案：使用Function构造函数在ISOLATED world中执行
      // 避免args参数序列化问题
      const [result] = await chrome.scripting.executeScript({
        target: { tabId },
        world: 'MAIN',
        func: function() {
          // 从arguments[0]获取代码字符串
          const codeString = arguments[0];
          try {
            // 检查代码是否是函数形式
            if (codeString.trim().startsWith('(') || codeString.trim().startsWith('function')) {
              // 函数形式: () => {...} 或 function() {...}
              const fn = eval(`(${codeString})`);
              return { success: true, result: fn() };
            } else {
              // 表达式形式: document.title
              return { success: true, result: eval(codeString) };
            }
          } catch (error) {
            return {
              success: false,
              error: error.message,
              stack: error.stack
            };
          }
        },
        args: [String(code)] // 确保是字符串类型
      });
      
      const execResult = result?.result;
      
      if (execResult?.success) {
        return {
          result: execResult.result,
          success: true
        };
      } else {
        return {
          error: execResult?.error || 'Unknown error',
          stack: execResult?.stack,
          success: false
        };
      }
    } catch (error) {
      console.error('[Debug] Evaluate error:', error);
      return {
        error: error.message,
        success: false
      };
    }
  }
}







