/**
 * Popup UI Script
 */

// DOM元素
const elements = {
  serverUrl: document.getElementById('serverUrl'),
  connectBtn: document.getElementById('connectBtn'),
  statusDot: document.getElementById('statusDot'),
  statusText: document.getElementById('statusText'),
  snapshotBtn: document.getElementById('snapshotBtn'),
  screenshotBtn: document.getElementById('screenshotBtn'),
  consoleBtn: document.getElementById('consoleBtn'),
  networkBtn: document.getElementById('networkBtn'),
  toolsList: document.getElementById('toolsList'),
  resultSection: document.getElementById('resultSection'),
  resultOutput: document.getElementById('resultOutput')
};

// 状态
let connected = false;
let currentTabId = null;

// 初始化
async function init() {
  console.log('[Popup] Initializing...');
  
  // 获取当前标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTabId = tab?.id;
  
  // 从存储中恢复服务器URL
  const config = await chrome.storage.local.get(['mcpServerUrl']);
  if (config.mcpServerUrl) {
    elements.serverUrl.value = config.mcpServerUrl;
  }
  
  // 检查MCP连接状态
  checkMCPStatus();
  
  // 加载已注册的工具
  loadTools();
  
  // 绑定事件
  bindEvents();
  
  console.log('[Popup] Initialized, current tab:', currentTabId);
}

// 检查MCP状态
async function checkMCPStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'get_mcp_status' });
    updateStatus(response.connected);
  } catch (error) {
    console.error('[Popup] Error checking status:', error);
    updateStatus(false);
  }
}

// 更新状态显示
function updateStatus(isConnected) {
  connected = isConnected;
  
  if (isConnected) {
    elements.statusDot.classList.add('connected');
    elements.statusText.textContent = '已连接';
    elements.connectBtn.textContent = '断开';
  } else {
    elements.statusDot.classList.remove('connected');
    elements.statusText.textContent = '未连接';
    elements.connectBtn.textContent = '连接';
  }
}

// 加载已注册的工具
async function loadTools() {
  // 示例工具列表
  const tools = [
    'browser_navigate',
    'browser_snapshot',
    'browser_click',
    'browser_type',
    'browser_evaluate',
    'browser_console_messages',
    'browser_network_requests',
    'browser_tabs'
  ];
  
  elements.toolsList.innerHTML = tools
    .map(tool => `<span class="tool-tag">${tool}</span>`)
    .join('');
}

// 绑定事件
function bindEvents() {
  // 连接/断开按钮
  elements.connectBtn.addEventListener('click', async () => {
    if (connected) {
      await disconnect();
    } else {
      await connect();
    }
  });
  
  // 快照按钮
  elements.snapshotBtn.addEventListener('click', async () => {
    await executeTool('browser_snapshot', {});
  });
  
  // 截图按钮
  elements.screenshotBtn.addEventListener('click', async () => {
    await executeTool('browser_take_screenshot', {
      filename: `screenshot-${Date.now()}.png`
    });
  });
  
  // Console按钮
  elements.consoleBtn.addEventListener('click', async () => {
    await executeTool('browser_console_messages', {});
  });
  
  // Network按钮
  elements.networkBtn.addEventListener('click', async () => {
    await executeTool('browser_network_requests', {});
  });
}

// 连接到MCP服务器
async function connect() {
  const serverUrl = elements.serverUrl.value.trim();
  
  if (!serverUrl) {
    showResult({ error: '请输入服务器地址' });
    return;
  }
  
  try {
    elements.connectBtn.disabled = true;
    elements.connectBtn.textContent = '连接中...';
    
    const response = await chrome.runtime.sendMessage({
      type: 'connect_mcp',
      serverUrl
    });
    
    if (response.success) {
      updateStatus(true);
      showResult({ message: '连接成功！', serverUrl });
    } else {
      showResult({ error: response.error || '连接失败' });
    }
  } catch (error) {
    console.error('[Popup] Connect error:', error);
    showResult({ error: error.message });
  } finally {
    elements.connectBtn.disabled = false;
  }
}

// 断开连接
async function disconnect() {
  try {
    await chrome.runtime.sendMessage({ type: 'disconnect_mcp' });
    updateStatus(false);
    showResult({ message: '已断开连接' });
  } catch (error) {
    console.error('[Popup] Disconnect error:', error);
  }
}

// 执行工具
async function executeTool(toolName, params) {
  try {
    showResult({ message: `执行中: ${toolName}...` });
    
    const response = await chrome.runtime.sendMessage({
      type: 'execute_tool',
      tool: toolName,
      params,
      tabId: currentTabId
    });
    
    if (response.success) {
      showResult(response.result);
    } else {
      showResult({ error: response.error });
    }
  } catch (error) {
    console.error('[Popup] Execute tool error:', error);
    showResult({ error: error.message });
  }
}

// 显示结果
function showResult(data) {
  elements.resultSection.style.display = 'block';
  elements.resultOutput.textContent = JSON.stringify(data, null, 2);
  
  // 滚动到结果区域
  elements.resultSection.scrollIntoView({ behavior: 'smooth' });
}

// 启动
init();

// 监听来自background的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'mcp_status') {
    updateStatus(request.connected);
  }
});






