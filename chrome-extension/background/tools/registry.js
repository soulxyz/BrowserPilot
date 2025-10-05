/**
 * Tool Registry
 * 工具注册表，管理所有MCP工具的实现
 */

import { NavigationTools } from './navigation.js';
import { SnapshotTools } from './snapshot.js';
import { InteractionTools } from './interaction.js';
import { DebugTools } from './debug.js';
import { TabTools } from './tabs.js';

export class ToolRegistry {
  constructor(networkMonitor = null) {
    this.tools = new Map();
    this.networkMonitor = networkMonitor;
    this.registerTools();
  }
  
  /**
   * 注册所有工具
   */
  registerTools() {
    // 导航类
    this.register('browser_navigate', NavigationTools.navigate);
    this.register('browser_navigate_back', NavigationTools.goBack);
    
    // 快照类
    this.register('browser_snapshot', SnapshotTools.capture);
    this.register('browser_take_screenshot', SnapshotTools.screenshot);
    
    // 交互类
    this.register('browser_click', InteractionTools.click);
    this.register('browser_type', InteractionTools.type);
    this.register('browser_hover', InteractionTools.hover);
    this.register('browser_press_key', InteractionTools.pressKey);
    this.register('browser_drag', InteractionTools.drag);
    this.register('browser_select_option', InteractionTools.selectOption);
    this.register('browser_fill_form', InteractionTools.fillForm);
    
    // 调试类
    this.register('browser_console_messages', DebugTools.getConsoleMessages);
    this.register('browser_network_requests', (params, tabId) => 
      DebugTools.getNetworkRequests(params, tabId, this.networkMonitor)
    );
    this.register('browser_evaluate', DebugTools.evaluate);
    
    // 标签页类
    this.register('browser_tabs', TabTools.manageTabs);
    this.register('browser_wait_for', InteractionTools.waitFor);
    this.register('browser_resize', TabTools.resize);
    
    console.log('[Tool Registry] Registered', this.tools.size, 'tools');
  }
  
  /**
   * 注册单个工具
   */
  register(name, handler) {
    this.tools.set(name, handler);
  }
  
  /**
   * 执行工具
   */
  async execute(toolName, params, tabId) {
    const handler = this.tools.get(toolName);
    
    if (!handler) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    
    console.log('[Tool Registry] Executing:', toolName, 'params:', params, 'tabId:', tabId);
    
    try {
      const result = await handler(params, tabId);
      console.log('[Tool Registry] Result:', result);
      return result;
    } catch (error) {
      console.error('[Tool Registry] Execution error:', error);
      throw error;
    }
  }
  
  /**
   * 获取所有已注册的工具列表
   */
  list() {
    return Array.from(this.tools.keys());
  }
}






