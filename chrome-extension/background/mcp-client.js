/**
 * MCP Protocol Client
 * 实现MCP协议的WebSocket通信
 */

export class MCPClient {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.ws = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
    this.eventHandlers = new Map();
  }
  
  /**
   * 连接到MCP服务器
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl);
        
        this.ws.onopen = () => {
          console.log('[MCP Client] WebSocket connected');
          this.emit('connected');
          resolve();
        };
        
        this.ws.onclose = () => {
          console.log('[MCP Client] WebSocket closed');
          this.emit('disconnected');
        };
        
        this.ws.onerror = (error) => {
          console.error('[MCP Client] WebSocket error:', error);
          reject(error);
        };
        
        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * 断开连接
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  /**
   * 处理接收到的消息
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      console.log('[MCP Client] Received:', message);
      
      // 检查是否是响应
      if (message.id && this.pendingRequests.has(message.id)) {
        const pending = this.pendingRequests.get(message.id);
        this.pendingRequests.delete(message.id);
        
        if (message.error) {
          pending.reject(new Error(message.error.message || message.error));
        } else {
          pending.resolve(message.result);
        }
        return;
      }
      
      // 检查是否是工具调用请求
      if (message.method && message.method.startsWith('tools/')) {
        this.emit('tool_call', message);
        return;
      }
      
      console.warn('[MCP Client] Unknown message:', message);
      
    } catch (error) {
      console.error('[MCP Client] Error parsing message:', error);
    }
  }
  
  /**
   * 调用MCP工具
   */
  async callTool(toolName, params = {}) {
    const requestId = ++this.requestId;
    
    return new Promise((resolve, reject) => {
      // 设置超时
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Request timeout'));
      }, 30000); // 30秒超时
      
      this.pendingRequests.set(requestId, {
        resolve: (result) => {
          clearTimeout(timeout);
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        }
      });
      
      // 发送请求
      this.send({
        jsonrpc: "2.0",
        id: requestId,
        method: "tools/call",
        params: {
          name: toolName,
          arguments: params
        }
      });
    });
  }
  
  /**
   * 发送响应
   */
  sendResponse(id, result) {
    this.send({
      jsonrpc: "2.0",
      id,
      result
    });
  }
  
  /**
   * 发送错误响应
   */
  sendError(id, errorMessage) {
    this.send({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32000,
        message: errorMessage
      }
    });
  }
  
  /**
   * 发送消息
   */
  send(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    
    const data = JSON.stringify(message);
    console.log('[MCP Client] Sending:', message);
    this.ws.send(data);
  }
  
  /**
   * 事件监听
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }
  
  /**
   * 触发事件
   */
  emit(event, ...args) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(...args);
      } catch (error) {
        console.error('[MCP Client] Event handler error:', error);
      }
    });
  }
}






