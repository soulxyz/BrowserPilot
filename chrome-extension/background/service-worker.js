/**
 * MCP Browser Client - Background Service Worker
 * 核心服务层，处理MCP协议通信和工具调度
 */

import { MCPClient } from './mcp-client.js';
import { ToolRegistry } from './tools/registry.js';
import { NetworkMonitor } from './network-monitor.js';
import { ConsoleCollector } from './console-collector.js';

// 全局状态
const state = {
  mcpClient: null,
  toolRegistry: null,
  networkMonitor: null,
  consoleCollector: null,
  currentTabId: null,
  connected: false
};

// 初始化
async function initialize() {
  console.log('[MCP] Initializing background service worker...');
  
  // 初始化网络监控
  state.networkMonitor = new NetworkMonitor();
  
  // 初始化Console收集器
  state.consoleCollector = new ConsoleCollector();
  
  // 初始化工具注册表（传入 networkMonitor）
  state.toolRegistry = new ToolRegistry(state.networkMonitor);
  
  // 从存储中恢复MCP服务器配置
  const config = await chrome.storage.local.get(['mcpServerUrl']);
  if (config.mcpServerUrl) {
    await connectToMCPServer(config.mcpServerUrl);
  }
  
  console.log('[MCP] Background service worker initialized');
}

// 连接到MCP服务器（现在是反向：Extension连接到本地MCP Server）
async function connectToMCPServer(serverUrl) {
  try {
    console.log('[MCP] Connecting to server:', serverUrl);
    
    const ws = new WebSocket(serverUrl);
    
    ws.onopen = () => {
      state.connected = true;
      state.mcpClient = ws;
      console.log('[MCP] Connected to MCP Server');
      
      // 广播连接状态
      chrome.runtime.sendMessage({
        type: 'mcp_status',
        connected: true
      }).catch(() => {});
    };
    
    ws.onclose = () => {
      state.connected = false;
      state.mcpClient = null;
      console.log('[MCP] Disconnected from MCP Server');
      
      chrome.runtime.sendMessage({
        type: 'mcp_status',
        connected: false
      }).catch(() => {});
    };
    
    ws.onerror = (error) => {
      console.error('[MCP] WebSocket error:', error);
      throw new Error('Connection failed');
    };
    
    ws.onmessage = async (event) => {
      try {
        const request = JSON.parse(event.data);
        console.log('[MCP] Received request:', request);
        
        if (request.type === 'tool_call') {
          // 执行工具
          try {
            const result = await state.toolRegistry.execute(
              request.tool,
              request.params,
              state.currentTabId || (await getCurrentTabId())
            );
            
            // 返回结果
            ws.send(JSON.stringify({
              id: request.id,
              result: result
            }));
          } catch (error) {
            console.error('[MCP] Tool execution error:', error);
            ws.send(JSON.stringify({
              id: request.id,
              error: error.message
            }));
          }
        }
      } catch (error) {
        console.error('[MCP] Error handling message:', error);
      }
    };
    
    // 保存配置
    await chrome.storage.local.set({ mcpServerUrl: serverUrl });
    
  } catch (error) {
    console.error('[MCP] Connection error:', error);
    throw error;
  }
}

// 获取当前活动标签页ID
async function getCurrentTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

// 监听来自Content Script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[MCP] Message received:', request.type, 'from tab:', sender.tab?.id);
  
  // 异步处理
  (async () => {
    try {
      switch (request.type) {
        case 'console_message':
          // 收集console消息
          state.consoleCollector.add(sender.tab.id, request.data);
          sendResponse({ success: true });
          break;
          
        case 'get_mcp_status':
          sendResponse({ 
            connected: state.connected,
            serverUrl: state.mcpClient?.serverUrl
          });
          break;
          
        case 'connect_mcp':
          await connectToMCPServer(request.serverUrl);
          sendResponse({ success: true });
          break;
          
        case 'disconnect_mcp':
          if (state.mcpClient) {
            state.mcpClient.close();
            state.mcpClient = null;
          }
          sendResponse({ success: true });
          break;
          
        case 'execute_tool':
          // 直接执行工具（用于测试）
          const targetTabId = request.tabId || (sender.tab && sender.tab.id) || state.currentTabId || (await getCurrentTabId());
          const result = await state.toolRegistry.execute(
            request.tool,
            request.params,
            targetTabId
          );
          sendResponse({ success: true, result });
          break;
          
        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('[MCP] Error handling message:', error);
      sendResponse({ error: error.message });
    }
  })();
  
  // 保持消息通道开放
  return true;
});

// 监听标签页更新
chrome.tabs.onActivated.addListener((activeInfo) => {
  state.currentTabId = activeInfo.tabId;
  console.log('[MCP] Active tab changed to:', activeInfo.tabId);
});

// 监听标签页关闭
chrome.tabs.onRemoved.addListener((tabId) => {
  console.log('[MCP] Tab closed:', tabId);
  
  // 清理该标签的数据
  state.networkMonitor?.clearRequests(tabId);
  state.consoleCollector?.clearMessages(tabId);
});

// Service Worker保活机制
let keepAliveInterval;

function keepAlive() {
  keepAliveInterval = setInterval(() => {
    chrome.runtime.getPlatformInfo(() => {
      // 空操作，仅保持Service Worker活跃
    });
  }, 20000); // 每20秒
}

chrome.runtime.onSuspend.addListener(() => {
  console.log('[MCP] Service Worker suspending...');
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
});

// 启动
initialize();
keepAlive();

console.log('[MCP] Background service worker loaded');

