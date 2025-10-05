#!/usr/bin/env node

/**
 * Simple MCP Browser Server - 无依赖版本
 * 纯WebSocket + HTTP，无需MCP SDK
 */

// ============================================
// 🔧 配置区域 - 可手动修改的常量
// ============================================
const CONFIG = {
  // === 版本信息 ===
  DEFAULT_VERSION: '1.0.0',  // 默认版本（会从 package.json 自动读取覆盖）
  
  // === GitHub 仓库 ===
  GITHUB_REPO: 'https://github.com/',  // 到时候发布记得改一下！！！！！！！！！！！！
  
  // === 端口配置 ===
  DEFAULT_WEBSOCKET_PORT: 9222,  // WebSocket 服务器默认端口（如占用会自动顺延）
  DEFAULT_HTTP_PORT: 3000,       // HTTP 管理界面默认端口（如占用会自动顺延）
  PORT_SCAN_MAX_ATTEMPTS: 10,    // 端口扫描最大尝试次数
  
  // === 请求限制 ===
  MAX_REQUEST_BODY_SIZE: 10 * 1024 * 1024,  // HTTP 请求体最大大小（10MB）
  TOOL_CALL_TIMEOUT: 30000,                  // 工具调用超时时间（30秒）
  
  // === 日志配置 ===
  KEEP_ALIVE_INTERVAL: 300000,  // Keep-alive 心跳间隔（5分钟，仅 STDIO 模式）
  LOG_FILE_NAME: 'debug_mcp_server.log',  // 日志文件名
  
  // === 国际化 ===
  DEFAULT_LANGUAGE: 'auto',  // 默认语言：'auto' (自动检测), 'zh' (中文), 'en' (英文)
};

// 语言包
const LANG = {
  zh: {
    serverStarting: 'MCP Browser Server 启动中...',
    manualStartMode: '注意: 当前为手动启动模式',
    serverWontStart: '为避免端口冲突，服务器不会启动',
    useCursorToStart: '通过 Cursor 以 STDIO 模式启动',
    setupInstructions: '配置指南：',
    createConfigFile: '1. 在项目根目录创建 .cursor/mcp.json',
    addConfiguration: '2. 添加以下配置:',
    executableMode: '[可执行文件模式]',
    nodeScriptMode: '[Node 脚本模式]',
    restartCursor: '3. 完全退出并重启 Cursor',
    verifyInCursor: '4. 在 Cursor 中验证:',
    pressCtrlShiftU: '按 Ctrl+Shift+U',
    selectMcpLogs: '选择 "MCP Logs"',
    whenCursorStarts: '5. Cursor 启动后会:',
    websocketServer: 'WebSocket 服务器: 端口 9222',
    webUi: 'Web 管理界面: 端口 3000',
    autoPortFallback: '如有端口冲突，自动使用下一个可用端口',
    installExtension: '6. 安装 Chrome 扩展:',
    openExtensions: '打开 chrome://extensions/',
    enableDevMode: '启用"开发者模式"',
    loadExtensionFolder: '加载 chrome-extension 文件夹',
    checkWebUi: '打开管理页面查看实际 WebSocket 端口',
    connectViaPopup: '点击扩展图标连接到显示的端口',
    docs: '文档: README.md',
    pressCtrlCToExit: '按 Ctrl+C 退出服务器',
  },
  en: {
    serverStarting: 'MCP Browser Server starting...',
    manualStartMode: 'Note: Manual start mode - Server will not start',
    serverWontStart: '',
    useCursorToStart: 'Use Cursor to start in STDIO mode',
    setupInstructions: 'Setup Instructions:',
    createConfigFile: '1. Create .cursor/mcp.json in project root',
    addConfiguration: '2. Add configuration:',
    executableMode: '[Executable Mode]',
    nodeScriptMode: '[Node Script Mode]',
    restartCursor: '3. Restart Cursor completely',
    verifyInCursor: '4. Verify in Cursor:',
    pressCtrlShiftU: 'Press Ctrl+Shift+U',
    selectMcpLogs: 'Select "MCP Logs"',
    whenCursorStarts: '5. When Cursor starts:',
    websocketServer: 'WebSocket server: port 9222',
    webUi: 'Web UI: port 3000',
    autoPortFallback: 'Auto port fallback if occupied',
    installExtension: '6. Install Chrome Extension:',
    openExtensions: 'Open chrome://extensions/',
    enableDevMode: 'Enable Developer mode',
    loadExtensionFolder: 'Load chrome-extension folder',
    checkWebUi: 'Check Web UI for actual port',
    connectViaPopup: 'Connect via extension popup',
    docs: 'Docs: README.md',
    pressCtrlCToExit: 'Press Ctrl+C to exit',
  }
};

// 获取系统语言（用于控制台输出）
function getSystemLanguage() {
  if (CONFIG.DEFAULT_LANGUAGE !== 'auto') {
    return CONFIG.DEFAULT_LANGUAGE;
  }
  // 检测系统语言
  const lang = process.env.LANG || process.env.LANGUAGE || process.env.LC_ALL || '';
  return lang.toLowerCase().includes('zh') ? 'zh' : 'en';
}

const CURRENT_LANG = getSystemLanguage();
const t = (key) => LANG[CURRENT_LANG][key] || LANG.en[key] || key;
// ============================================

const http = require('http');
const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const net = require('net');
const { checkForUpdates } = require('./update-checker');


// 检查运行模式（必须最先执行）
const args = process.argv.slice(2);
const STDIO_MODE = args.includes('--stdio-only') || args.includes('--no-ui');

// 智能检测运行方式（node脚本 vs 可执行文件）- 多平台兼容
const IS_PACKAGED = 
  process.pkg !== undefined || // pkg 打包检测（所有平台）
  (
    // Windows: 检测 .exe 但排除 node.exe
    (process.platform === 'win32' && process.execPath.toLowerCase().endsWith('.exe') && !process.execPath.toLowerCase().includes('node')) ||
    // Unix-like: 检测非 node 的可执行文件（通常在用户目录或当前目录）
    (process.platform !== 'win32' && !process.execPath.includes('node') && !process.execPath.includes('/bin/') && !process.execPath.includes('/usr/'))
  );
const EXECUTABLE_PATH = IS_PACKAGED ? process.execPath : `node ${process.argv[1]}`;

// 运行时变量（从配置初始化）
let WEBSOCKET_PORT = CONFIG.DEFAULT_WEBSOCKET_PORT;
let HTTP_PORT = CONFIG.DEFAULT_HTTP_PORT;
let CURRENT_VERSION = CONFIG.DEFAULT_VERSION;
let updateInfo = null;

/**
 * 检测端口是否可用
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port, '0.0.0.0');
  });
}

/**
 * 查找可用端口
 */
async function findAvailablePort(startPort) {
  for (let i = 0; i < CONFIG.PORT_SCAN_MAX_ATTEMPTS; i++) {
    const port = startPort + i;
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
  }
  return null;
}

// 日志系统初始化
let log;
try {
  const logDir = process.cwd();
  const logFilePath = path.join(logDir, CONFIG.LOG_FILE_NAME);
  
  fs.writeFileSync(logFilePath, `Log session started at ${new Date().toISOString()}\n`); 
  
  log = (message) => {
    const logMessage = `[${new Date().toISOString()}] ${message}\n`;
    try {
      fs.appendFileSync(logFilePath, logMessage);
    } catch (err) {
      // 静默失败
    }
    
    if (!STDIO_MODE) {
      console.log(`[LOG] ${message}`);
    }
  };
} catch (error) {
  if (!STDIO_MODE) {
    console.error('Failed to setup file logging:', error.message);
  }
  log = (message) => {
    if (!STDIO_MODE) {
      console.log(`[CONSOLE_ONLY] ${message}`);
    }
  };
}

log('--- SCRIPT START ---');
log(`ARGV: ${JSON.stringify(process.argv)}`);
log(`CWD: ${process.cwd()}`);
log(`EXEC_PATH: ${process.execPath}`);
log(`PLATFORM: ${process.platform}`);
log(`STDIO_MODE: ${STDIO_MODE}`);
log(`IS_PACKAGED: ${IS_PACKAGED} (pkg=${process.pkg !== undefined})`);

// 读取版本号
try {
  const packagePath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  CURRENT_VERSION = packageJson.version || CONFIG.DEFAULT_VERSION;
  log(`Version: ${CURRENT_VERSION}`);
} catch (error) {
  log(`Failed to read version: ${error.message}`);
}

if (!STDIO_MODE) {
  console.log(t('serverStarting'));
}

// MCP 工具列表
const TOOLS = [
  // 导航类
  { 
    name: 'browser_navigate', 
    description: 'Navigate to URL', 
    inputSchema: { 
      type: 'object', 
      properties: { url: { type: 'string', description: 'URL to navigate to' } }, 
      required: ['url'] 
    } 
  },
  { 
    name: 'browser_navigate_back', 
    description: 'Navigate back to previous page', 
    inputSchema: { type: 'object' } 
  },
  
  // 快照类
  { 
    name: 'browser_snapshot', 
    description: 'Capture page accessibility snapshot', 
    inputSchema: { type: 'object' } 
  },
  { 
    name: 'browser_take_screenshot', 
    description: 'Take screenshot of page or element', 
    inputSchema: { 
      type: 'object',
      properties: {
        element: { type: 'string', description: 'Element description' },
        ref: { type: 'string', description: 'Element reference' },
        filename: { type: 'string', description: 'Output filename' },
        fullPage: { type: 'boolean', description: 'Capture full page' },
        type: { type: 'string', enum: ['png', 'jpeg'], description: 'Image format' }
      }
    } 
  },
  
  // 交互类
  { 
    name: 'browser_click', 
    description: 'Click element', 
    inputSchema: { 
      type: 'object', 
      properties: { 
        element: { type: 'string', description: 'Element description' }, 
        ref: { type: 'string', description: 'Element reference' },
        button: { type: 'string', enum: ['left', 'right', 'middle'], description: 'Mouse button' },
        doubleClick: { type: 'boolean', description: 'Perform double click' },
        modifiers: { type: 'array', items: { type: 'string', enum: ['Control', 'Shift', 'Alt', 'Meta'] } }
      }, 
      required: ['element', 'ref'] 
    } 
  },
  { 
    name: 'browser_type', 
    description: 'Type text into element', 
    inputSchema: { 
      type: 'object', 
      properties: { 
        element: { type: 'string', description: 'Element description' }, 
        ref: { type: 'string', description: 'Element reference' }, 
        text: { type: 'string', description: 'Text to type' },
        slowly: { type: 'boolean', description: 'Type character by character' },
        submit: { type: 'boolean', description: 'Submit form after typing' }
      }, 
      required: ['element', 'ref', 'text'] 
    } 
  },
  { 
    name: 'browser_hover', 
    description: 'Hover over element', 
    inputSchema: { 
      type: 'object', 
      properties: { 
        element: { type: 'string', description: 'Element description' }, 
        ref: { type: 'string', description: 'Element reference' }
      }, 
      required: ['element', 'ref'] 
    } 
  },
  { 
    name: 'browser_press_key', 
    description: 'Press keyboard key', 
    inputSchema: { 
      type: 'object', 
      properties: { 
        key: { type: 'string', description: 'Key to press (e.g., Enter, Escape, Tab)' }
      }, 
      required: ['key'] 
    } 
  },
  { 
    name: 'browser_drag', 
    description: 'Drag and drop element', 
    inputSchema: { 
      type: 'object', 
      properties: { 
        startElement: { type: 'string', description: 'Start element description' }, 
        startRef: { type: 'string', description: 'Start element reference' },
        endElement: { type: 'string', description: 'End element description' },
        endRef: { type: 'string', description: 'End element reference' }
      }, 
      required: ['startElement', 'startRef', 'endElement', 'endRef'] 
    } 
  },
  { 
    name: 'browser_select_option', 
    description: 'Select option(s) in dropdown', 
    inputSchema: { 
      type: 'object', 
      properties: { 
        element: { type: 'string', description: 'Select element description' }, 
        ref: { type: 'string', description: 'Select element reference' },
        values: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Option values to select (can match value, text, or label)' 
        }
      }, 
      required: ['element', 'ref', 'values'] 
    } 
  },
  { 
    name: 'browser_fill_form', 
    description: 'Fill multiple form fields at once', 
    inputSchema: { 
      type: 'object', 
      properties: { 
        fields: { 
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Field name/label' },
              type: { type: 'string', enum: ['textbox', 'checkbox', 'radio', 'combobox', 'slider'], description: 'Field type' },
              ref: { type: 'string', description: 'Element reference' },
              value: { description: 'Field value (string, boolean, or number)' }
            },
            required: ['name', 'type', 'ref', 'value']
          },
          description: 'Array of form fields to fill'
        }
      }, 
      required: ['fields'] 
    } 
  },
  
  // 调试类
  { 
    name: 'browser_evaluate', 
    description: 'Execute JavaScript in page context. Supports both function form "() => expression" and direct expression "document.title". Returns the evaluation result.', 
    inputSchema: { 
      type: 'object', 
      properties: { 
        function: { 
          type: 'string', 
          description: 'JavaScript code to execute. Can be a function like "() => document.title" or a direct expression like "document.title". For complex logic, use function form like "() => { const x = 1; return x + 1; }"'
        }
      }, 
      required: ['function'] 
    } 
  },
  { 
    name: 'browser_console_messages', 
    description: 'Get console messages', 
    inputSchema: { type: 'object' } 
  },
  { 
    name: 'browser_network_requests', 
    description: 'Get network requests', 
    inputSchema: { type: 'object' } 
  },
  
  // 标签页和窗口类
  { 
    name: 'browser_tabs', 
    description: 'Manage browser tabs', 
    inputSchema: { 
      type: 'object', 
      properties: { 
        action: { type: 'string', enum: ['list', 'new', 'close', 'select'], description: 'Tab action to perform' },
        index: { type: 'number', description: 'Tab index (for close/select actions)' }
      }, 
      required: ['action'] 
    } 
  },
  { 
    name: 'browser_wait_for', 
    description: 'Wait for condition', 
    inputSchema: { 
      type: 'object', 
      properties: { 
        text: { type: 'string', description: 'Text to wait for to appear' },
        textGone: { type: 'string', description: 'Text to wait for to disappear' },
        time: { type: 'number', description: 'Time to wait in seconds' }
      }
    } 
  },
  { 
    name: 'browser_resize', 
    description: 'Resize browser window', 
    inputSchema: { 
      type: 'object', 
      properties: { 
        width: { type: 'number', description: 'Window width in pixels' },
        height: { type: 'number', description: 'Window height in pixels' }
      }, 
      required: ['width', 'height'] 
    } 
  }
];

// Extension 连接状态
let extensionSocket = null;
let requestCounter = 0;
const pendingRequests = new Map();

async function startServer() {
  if (!STDIO_MODE) {
    // 手动启动模式：显示配置指南
    console.log('');
    console.log('========================================');
    console.log('  MCP Browser Control - Configuration');
    console.log('========================================');
    console.log('');
    console.log(t('manualStartMode'));
    console.log(`      ${t('useCursorToStart')}`);
    console.log('');
    console.log(t('setupInstructions'));
    console.log('');
    console.log(`   ${t('createConfigFile')}`);
    console.log('');
    console.log(`   ${t('addConfiguration')}`);
    console.log('');
    
    if (IS_PACKAGED) {
      // 可执行文件模式
      const exePath = process.execPath.replace(/\\/g, '\\\\');
      console.log('      {');
      console.log('        "mcpServers": {');
      console.log('          "browser-control": {');
      console.log(`            "command": "${exePath}",`);
      console.log('            "args": ["--stdio-only"]');
      console.log('          }');
      console.log('        }');
      console.log('      }');
      console.log('');
      console.log(`   ${t('executableMode')}`);
      console.log(`   Path: ${process.execPath}`);
    } else {
      const scriptPath = path.relative(process.cwd(), process.argv[1]).replace(/\\/g, '/');
      console.log('      {');
      console.log('        "mcpServers": {');
      console.log('          "browser-control": {');
      console.log('            "command": "node",');
      console.log('            "args": [');
      console.log(`              "${scriptPath}",`);
      console.log('              "--stdio-only"');
      console.log('            ]');
      console.log('          }');
      console.log('        }');
      console.log('      }');
      console.log('');
      console.log(`   ${t('nodeScriptMode')}`);
      console.log('   Build: npm run build');
    }
    
    console.log('');
    console.log(`   ${t('restartCursor')}`);
    console.log('');
    console.log(`   ${t('verifyInCursor')}`);
    console.log(`      - ${t('pressCtrlShiftU')}`);
    console.log(`      - ${t('selectMcpLogs')}`);
    console.log('');
    console.log(`   ${t('whenCursorStarts')}`);
    console.log(`      - ${t('websocketServer')}`);
    console.log(`      - ${t('webUi')}`);
    console.log(`      - ${t('autoPortFallback')}`);
    console.log('');
    console.log(`   ${t('installExtension')}`);
    console.log(`      - ${t('openExtensions')}`);
    console.log(`      - ${t('enableDevMode')}`);
    console.log(`      - ${t('loadExtensionFolder')}`);
    console.log(`      - ${t('checkWebUi')}`);
    console.log(`      - ${t('connectViaPopup')}`);
    console.log('');
    console.log('========================================');
    console.log('');
    console.log(t('docs'));
    console.log('');
    return;
  }

  // STDIO 模式：检测端口并启动服务器
  log('Scanning for available ports...');
  
  const wsPort = await findAvailablePort(CONFIG.DEFAULT_WEBSOCKET_PORT);
  if (wsPort === null) {
    log(`Error: No available WebSocket port (${CONFIG.DEFAULT_WEBSOCKET_PORT}-${CONFIG.DEFAULT_WEBSOCKET_PORT + CONFIG.PORT_SCAN_MAX_ATTEMPTS - 1})`);
    return;
  }
  WEBSOCKET_PORT = wsPort;
  if (wsPort !== CONFIG.DEFAULT_WEBSOCKET_PORT) {
    log(`WebSocket port ${CONFIG.DEFAULT_WEBSOCKET_PORT} occupied, using ${wsPort}`);
  }
  
  const httpPort = await findAvailablePort(CONFIG.DEFAULT_HTTP_PORT);
  if (httpPort === null) {
    log(`Error: No available HTTP port (${CONFIG.DEFAULT_HTTP_PORT}-${CONFIG.DEFAULT_HTTP_PORT + CONFIG.PORT_SCAN_MAX_ATTEMPTS - 1})`);
    return;
  }
  HTTP_PORT = httpPort;
  if (httpPort !== CONFIG.DEFAULT_HTTP_PORT) {
    log(`HTTP port ${CONFIG.DEFAULT_HTTP_PORT} occupied, using ${httpPort}`);
  }
  
  // 启动 WebSocket 服务器
  let wss = null;
  try {
    wss = new WebSocketServer({ port: WEBSOCKET_PORT });
    
    wss.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        log(`WebSocket port ${WEBSOCKET_PORT} already in use`);
      } else {
        log(`WebSocket server error: ${error.message}`);
      }
    });
    
    wss.on('connection', (ws) => {
      log('Chrome Extension connected');
      if (!STDIO_MODE) {
        console.log('Chrome Extension connected');
      }
      extensionSocket = ws;
    
      ws.on('message', (data) => {
        try {
          const response = JSON.parse(data.toString());
          log(`Extension response: ${response.id}`);
          
          if (pendingRequests.has(response.id)) {
            const { resolve } = pendingRequests.get(response.id);
            pendingRequests.delete(response.id);
            resolve(response);
          }
        } catch (error) {
          log(`Message parse error: ${error.message}`);
        }
      });
      
      ws.on('close', () => {
        log('Extension disconnected');
        if (!STDIO_MODE) {
          console.log('Extension disconnected');
        }
        extensionSocket = null;
      });
      
      ws.on('error', (error) => {
        log(`WebSocket error: ${error.message}`);
      });
    });
  } catch (error) {
    log(`Failed to create WebSocket server: ${error.message}`);
    return;
  }
  
  log(`WebSocket server started on port ${WEBSOCKET_PORT}`);
  
  // 启动 HTTP 服务器
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    if (req.url === '/' || req.url === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(getUIHTML());
      return;
    }
    
    // API: 工具调用
    if (req.url === '/api/tool' && req.method === 'POST') {
      let body = '';
      let bodySize = 0;
      
      req.on('data', chunk => {
        bodySize += chunk.length;
        if (bodySize > CONFIG.MAX_REQUEST_BODY_SIZE) {
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Request body too large (max ${CONFIG.MAX_REQUEST_BODY_SIZE / 1024 / 1024}MB)` }));
          req.destroy();
          return;
        }
        body += chunk;
      });
      
      req.on('end', async () => {
        try {
          const { tool, params } = JSON.parse(body);
          const result = await callExtensionTool(tool, params);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }
    
    if (req.url === '/api/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        connected: extensionSocket !== null && extensionSocket.readyState === 1,
        websocket_port: WEBSOCKET_PORT,
        http_port: HTTP_PORT
      }));
      return;
    }
    
    if (req.url === '/api/update') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        currentVersion: CURRENT_VERSION,
        updateInfo: updateInfo
      }));
      return;
    }
    
    res.writeHead(404);
    res.end('Not Found');
  });

  server.listen(HTTP_PORT, () => {
    log(`HTTP server started on port ${HTTP_PORT}`);
    
    // 自动打开浏览器
    setTimeout(() => {
      try {
        const start = process.platform === 'win32' ? 'start' : 
                     process.platform === 'darwin' ? 'open' : 'xdg-open';
        spawn(start, [`http://localhost:${HTTP_PORT}`], { shell: true, detached: true });
        log(`Web UI opened: http://localhost:${HTTP_PORT}`);
      } catch (e) {
        log(`Failed to open browser: http://localhost:${HTTP_PORT}`);
      }
    }, 1000);
    
    // 检查更新
    setTimeout(() => {
      checkForUpdates(CURRENT_VERSION, CONFIG.GITHUB_REPO, log)
        .then((info) => {
          if (info) {
            updateInfo = info;
            log(`New version available: ${info.latestVersion}`);
          }
        })
        .catch((error) => {
          log(`Update check failed: ${error.message}`);
        });
    }, 3000);
  });

  server.on('error', (error) => {
    log(`HTTP server error: ${error.message}`);
  });
}

// 调用 Extension 工具
async function callExtensionTool(toolName, params) {
  return new Promise((resolve, reject) => {
    if (!extensionSocket || extensionSocket.readyState !== 1) {
      reject(new Error('Extension not connected'));
      return;
    }
    
    const requestId = ++requestCounter;
    
    const timeoutId = setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        reject(new Error('Request timeout'));
      }
    }, CONFIG.TOOL_CALL_TIMEOUT);
    
    pendingRequests.set(requestId, { 
      resolve: (response) => {
        clearTimeout(timeoutId);
        resolve(response);
      },
      reject: (error) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
    
    const request = {
      id: requestId,
      type: 'tool_call',
      tool: toolName,
      params: params || {}
    };
    
    extensionSocket.send(JSON.stringify(request));
  });
}

// MCP 协议处理
process.stdin.setEncoding('utf8');
process.stdin.resume();

process.on('exit', (code) => {
  log(`--- SCRIPT EXIT --- Code: ${code}`);
});

// Keep-alive (STDIO 模式)
if (STDIO_MODE) {
  log('Keep-alive interval set');
  setInterval(() => {
    log('Keep-alive tick');
  }, CONFIG.KEEP_ALIVE_INTERVAL);
}

let buffer = '';
log('STDIN listeners ready');

process.stdin.on('data', async (chunk) => {
  buffer += chunk;
  log(`[STDIN] Received ${chunk.length} bytes`);
  
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    try {
      const request = JSON.parse(line);
      log(`[MCP] Request: ${request.method}, id: ${request.id}`);
      if (!STDIO_MODE) {
        console.error('[MCP] Request:', request.method);
      }
      
      let response = null; // 重置响应，通知消息不需要响应
      
      if (request.method === 'initialize') {
        response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            protocolVersion: '2024-11-05',
            serverInfo: {
              name: 'browser-control',
              version: CURRENT_VERSION
            },
            capabilities: {
              tools: {}
            }
          }
        };
      }
      else if (request.method === 'tools/list') {
        response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            tools: TOOLS
          }
        };
      }
      else if (request.method === 'tools/call') {
        try {
          const result = await callExtensionTool(
            request.params.name,
            request.params.arguments || {}
          );
          
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify(result.result || result, null, 2)
              }]
            }
          };
        } catch (error) {
          response = {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32000,
              message: error.message
            }
          };
        }
      }
      else if (request.method === 'notifications/initialized') {
        // 处理 initialized 通知，这是一个通知消息，不需要响应
        log('[MCP] Received initialized notification');
        continue; // 跳过响应发送
      }
      else {
        // 检查是否为通知（没有 id 字段）
        if (request.id === undefined || request.id === null) {
          // 这是一个通知，不需要响应
          log(`[MCP] Ignoring notification: ${request.method}`);
          continue;
        }
        
        // 对于请求，返回错误响应
        response = {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`
          }
        };
      }
      
      // 只有 response 被设置时才发送（通知会跳过）
      if (response) {
        log(`[MCP] Response: ${response.result ? 'success' : 'error'}, id: ${request.id}`);
        if (!STDIO_MODE) {
          console.error('[MCP] Response:', response.result ? 'success' : 'error');
        }
        process.stdout.write(JSON.stringify(response) + '\n');
      }
      
    } catch (error) {
      log(`[MCP] Parse error: ${error.message}`);
    }
  }
});

function getUIHTML() {
  const wsPort = WEBSOCKET_PORT;
  const httpPort = HTTP_PORT;
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCP Browser Control</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      overflow: hidden;
      position: relative;
    }
    .lang-switch {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 10;
    }
    .lang-switch button {
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.5);
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      margin-left: 5px;
      transition: all 0.3s;
    }
    .lang-switch button:hover {
      background: rgba(255,255,255,0.3);
    }
    .lang-switch button.active {
      background: rgba(255,255,255,0.4);
      font-weight: 600;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 { font-size: 28px; margin-bottom: 8px; }
    .header p { opacity: 0.9; }
    .status {
      padding: 30px;
      background: #f9f9f9;
    }
    .status-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      margin-bottom: 15px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .status-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 12px;
      background: #ff4444;
    }
    .status-dot.active {
      background: #44ff44;
      box-shadow: 0 0 10px #44ff44;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    .info-box {
      margin: 30px;
      padding: 25px;
      background: #f9f9f9;
      border-radius: 8px;
    }
    .info-box h3 {
      font-size: 16px;
      color: #666;
      margin-bottom: 15px;
    }
    .info-box code {
      display: block;
      background: #1e1e1e;
      color: #00ff00;
      padding: 15px;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .footer {
      padding: 20px;
      text-align: center;
      color: #999;
      font-size: 14px;
    }
    .update-banner {
      margin: 30px;
      padding: 20px 25px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 8px;
      display: none;
      animation: slideIn 0.5s ease-out;
    }
    .update-banner.show {
      display: block;
    }
    .update-banner h3 {
      margin: 0 0 10px 0;
      font-size: 18px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .update-banner p {
      margin: 8px 0;
      opacity: 0.95;
      line-height: 1.5;
    }
    .update-banner .buttons {
      margin-top: 15px;
      display: flex;
      gap: 10px;
    }
    .update-banner button {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }
    .update-banner .btn-primary {
      background: white;
      color: #667eea;
    }
    .update-banner .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .update-banner .btn-secondary {
      background: rgba(255,255,255,0.2);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
    }
    .update-banner .btn-secondary:hover {
      background: rgba(255,255,255,0.3);
    }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    /* 美化滚动条 */
    #releaseNotesContainer::-webkit-scrollbar {
      width: 8px;
    }
    #releaseNotesContainer::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
    }
    #releaseNotesContainer::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.3);
      border-radius: 4px;
    }
    #releaseNotesContainer::-webkit-scrollbar-thumb:hover {
      background: rgba(255,255,255,0.5);
    }
    .footer a:hover {
      text-decoration: underline;
      transform: translateY(-1px);
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="lang-switch">
      <button onclick="switchLanguage('zh')" id="btnZh">中文</button>
      <button onclick="switchLanguage('en')" id="btnEn">English</button>
    </div>
    <div class="header">
      <h1 id="pageTitle"></h1>
      <p id="pageSubtitle"></p>
    </div>
    
    <!-- Update banner -->
    <div class="update-banner" id="updateBanner">
      <h3>
        <span id="releaseTitle"></span>
      </h3>
      <p style="margin-bottom: 15px;">
        <strong id="txtCurrent"></strong> <span id="currentVer"></span> → 
        <strong id="txtLatest"></strong> <span id="latestVer"></span>
      </p>
      <div id="releaseNotesContainer" style="
        background: rgba(255,255,255,0.1);
        padding: 12px 15px;
        border-radius: 6px;
        margin-bottom: 15px;
        max-height: 150px;
        overflow-y: auto;
        line-height: 1.6;
      ">
        <strong style="display: block; margin-bottom: 8px;" id="txtReleaseNotes"></strong>
        <div id="releaseNotes" style="font-size: 13px; opacity: 0.95; white-space: pre-wrap;"></div>
      </div>
      <div class="buttons">
        <button class="btn-primary" onclick="window.open(updateDownloadUrl, '_blank')" id="btnDownload"></button>
        <button class="btn-secondary" onclick="window.open(updateReleaseUrl, '_blank')" id="btnViewDetails"></button>
      </div>
    </div>
    
    <div class="status">
      <div class="status-item">
        <div style="display: flex; align-items: center;">
          <span class="status-dot active"></span>
          <strong id="txtWebsocketServer"></strong>
        </div>
        <span id="txtRunning"></span>
      </div>
      
      <div class="status-item">
        <div style="display: flex; align-items: center;">
          <span class="status-dot" id="extensionDot"></span>
          <strong id="txtChromeExtension"></strong>
        </div>
        <span id="extensionStatus"></span>
      </div>
    </div>
    
    <div class="info-box">
      <h3 id="txtExtensionConnection"></h3>
      <code>ws://localhost:${wsPort}</code>
      <p style="color: #666; margin-top: 10px;" id="extensionSteps">
        <span id="txtStep1"></span><br>
        <span id="txtStep2"></span><br>
        <span id="txtStep3"></span>
        ${wsPort !== CONFIG.DEFAULT_WEBSOCKET_PORT ? `<br><br><strong style="color: #ff6600;"><span id="txtPortAdjusted"></span></strong>` : ''}
        <br><br>
        <a href="${CONFIG.GITHUB_REPO}/tree/main/chrome-extension" target="_blank" style="color: #667eea;" id="linkInstallGuide"></a>
      </p>
    </div>
    
    <div class="info-box">
      <h3 id="txtCursorConfig"></h3>
      ${IS_PACKAGED ? `
      <code>{
  "mcpServers": {
    "browser-control": {
      "command": "${process.execPath.replace(/\\/g, '\\\\')}",
      "args": ["--stdio-only"]
    }
  }
}</code>
      <p style="color: #666; margin-top: 10px;">
        <span id="txtExecMode"></span><br>
        <span id="txtCopyConfig"></span>
      </p>
      ` : `
      <code>{
  "mcpServers": {
    "browser-control": {
      "command": "node",
      "args": [
        "${path.relative(process.cwd(), process.argv[1]).replace(/\\/g, '/')}",
        "--stdio-only"
      ]
    }
  }
}</code>
      <p style="color: #666; margin-top: 10px;">
        <span id="txtNodeMode"></span><br>
        <span id="txtCopyConfig"></span>
      </p>
      `}
    </div>
    
    <div class="footer">
      <div>MCP Browser Control v${CURRENT_VERSION}</div>
      <div style="margin-top: 8px;">
        <a href="${CONFIG.GITHUB_REPO}" target="_blank" 
           style="color: #667eea; text-decoration: none; font-weight: 600;" id="linkGithub">
        </a>
        <span style="margin: 0 8px; color: #ddd;">|</span>
        <a href="${CONFIG.GITHUB_REPO}/releases" target="_blank" 
           style="color: #667eea; text-decoration: none; font-weight: 600;" id="linkReleases">
        </a>
      </div>
    </div>
  </div>
  
  <script>
    // Web UI 语言包
    const UI_LANG = {
      zh: {
        title: 'MCP Browser Control',
        subtitle: '轻量级浏览器自动化服务器',
        newVersionAvailable: '发现新版本！',
        current: '当前版本',
        latest: '最新版本',
        releaseNotes: '更新内容',
        download: '立即下载',
        viewDetails: '查看完整详情',
        websocketServer: 'WebSocket 服务器',
        chromeExtension: 'Chrome 扩展',
        running: '运行中',
        connected: '已连接',
        waiting: '等待连接...',
        checking: '检查中...',
        extensionConnection: 'Chrome 扩展连接信息',
        openPopup: '1. 打开 Chrome 扩展 Popup',
        enterAddress: '2. 输入上面的地址',
        clickConnect: '3. 点击"连接"按钮',
        portAdjusted: '端口自动调整：',
        occupied: ' 被占用，使用 ',
        installGuide: '扩展安装指南',
        cursorConfig: 'Cursor 配置 (.cursor/mcp.json)',
        executableMode: '[可执行文件模式]',
        nodeScriptMode: '[Node 脚本模式]',
        copyConfig: '复制上面配置到项目根目录 .cursor/mcp.json',
        githubRepo: 'GitHub 仓库',
        allReleases: '所有版本',
      },
      en: {
        title: 'MCP Browser Control',
        subtitle: 'Lightweight browser automation server',
        newVersionAvailable: 'New Version Available',
        current: 'Current',
        latest: 'Latest',
        releaseNotes: 'Release Notes',
        download: 'Download',
        viewDetails: 'View Details',
        websocketServer: 'WebSocket Server',
        chromeExtension: 'Chrome Extension',
        running: 'Running',
        connected: 'Connected',
        waiting: 'Waiting...',
        checking: 'Checking...',
        extensionConnection: 'Chrome Extension Connection',
        openPopup: '1. Open Chrome Extension Popup',
        enterAddress: '2. Enter the address above',
        clickConnect: '3. Click "Connect"',
        portAdjusted: 'Port auto-adjusted: ',
        occupied: ' occupied, using ',
        installGuide: 'Extension Installation Guide',
        cursorConfig: 'Cursor Configuration (.cursor/mcp.json)',
        executableMode: '[Executable Mode]',
        nodeScriptMode: '[Node Script Mode]',
        copyConfig: 'Copy config to .cursor/mcp.json in project root',
        githubRepo: 'GitHub Repository',
        allReleases: 'All Releases',
      }
    };
    
    // 自动检测浏览器语言
    let currentLang = localStorage.getItem('mcpLang') || (navigator.language.toLowerCase().includes('zh') ? 'zh' : 'en');
    let updateDownloadUrl = '';
    let updateReleaseUrl = '';
    const wsPort = ${wsPort};
    const defaultPort = ${CONFIG.DEFAULT_WEBSOCKET_PORT};
    
    function t(key) {
      return UI_LANG[currentLang][key] || UI_LANG.en[key] || key;
    }
    
    function switchLanguage(lang) {
      currentLang = lang;
      localStorage.setItem('mcpLang', lang);
      location.reload();
    }
    
    // 初始化页面文本
    function initUI() {
      document.getElementById('pageTitle').textContent = t('title');
      document.getElementById('pageSubtitle').textContent = t('subtitle');
      document.getElementById('releaseTitle').textContent = t('newVersionAvailable');
      document.getElementById('txtCurrent').textContent = t('current') + ':';
      document.getElementById('txtLatest').textContent = t('latest') + ':';
      document.getElementById('txtReleaseNotes').textContent = t('releaseNotes') + ':';
      document.getElementById('btnDownload').textContent = t('download');
      document.getElementById('btnViewDetails').textContent = t('viewDetails');
      document.getElementById('txtWebsocketServer').textContent = t('websocketServer');
      document.getElementById('txtChromeExtension').textContent = t('chromeExtension');
      document.getElementById('txtRunning').textContent = t('running');
      document.getElementById('extensionStatus').textContent = t('checking');
      document.getElementById('txtExtensionConnection').textContent = t('extensionConnection');
      document.getElementById('txtStep1').textContent = t('openPopup');
      document.getElementById('txtStep2').textContent = t('enterAddress');
      document.getElementById('txtStep3').textContent = t('clickConnect');
      if (wsPort !== defaultPort) {
        const portAdjusted = document.getElementById('txtPortAdjusted');
        if (portAdjusted) {
          portAdjusted.textContent = t('portAdjusted') + defaultPort + t('occupied') + wsPort;
        }
      }
      document.getElementById('linkInstallGuide').textContent = t('installGuide');
      document.getElementById('txtCursorConfig').textContent = t('cursorConfig');
      const execMode = document.getElementById('txtExecMode');
      const nodeMode = document.getElementById('txtNodeMode');
      if (execMode) execMode.textContent = t('executableMode');
      if (nodeMode) nodeMode.textContent = t('nodeScriptMode');
      document.getElementById('txtCopyConfig').textContent = t('copyConfig');
      document.getElementById('linkGithub').textContent = t('githubRepo');
      document.getElementById('linkReleases').textContent = t('allReleases');
      
      // 高亮当前语言按钮
      document.getElementById('btnZh').classList.toggle('active', currentLang === 'zh');
      document.getElementById('btnEn').classList.toggle('active', currentLang === 'en');
    }
    
    // 页面加载时初始化
    initUI();
    
    async function checkStatus() {
      try {
        const res = await fetch('/api/status');
        const status = await res.json();
        
        const dot = document.getElementById('extensionDot');
        const statusText = document.getElementById('extensionStatus');
        
        if (status.connected) {
          dot.classList.add('active');
          statusText.textContent = t('connected');
        } else {
          dot.classList.remove('active');
          statusText.textContent = t('waiting');
        }
      } catch (e) {
        console.error('Status check failed:', e);
      }
    }
    
    async function checkUpdate() {
      try {
        const res = await fetch('/api/update');
        const data = await res.json();
        
        if (data.updateInfo && data.updateInfo.hasUpdate) {
          const banner = document.getElementById('updateBanner');
          const releaseTitle = document.getElementById('releaseTitle');
          const currentVer = document.getElementById('currentVer');
          const latestVer = document.getElementById('latestVer');
          const releaseNotes = document.getElementById('releaseNotes');
          
          if (data.updateInfo.releaseTitle) {
            releaseTitle.textContent = data.updateInfo.releaseTitle;
          } else {
            releaseTitle.textContent = t('newVersionAvailable') + ' ' + data.updateInfo.latestVersion;
          }
          
          currentVer.textContent = data.currentVersion;
          latestVer.textContent = data.updateInfo.latestVersion;
          
          let notes = data.updateInfo.releaseNotes || (currentLang === 'zh' ? '暂无更新说明' : 'No release notes');
          
          if (notes.length > 800) {
            notes = notes.substring(0, 800) + '\\n\\n... (View full details)';
          }
          
          // Simple Markdown formatting
          const backtick = String.fromCharCode(96);
          const backtickRegex = new RegExp(backtick + '(.+?)' + backtick, 'g');
          
          notes = notes
            .replace(/\\r\\n/g, '\\n')
            .replace(/\\n{3,}/g, '\\n\\n')
            .replace(/^#{1,6}\\s+(.+)$/gm, '▸ $1')
            .replace(/^[-*]\\s+/gm, '  • ')
            .replace(/\\*\\*(.+?)\\*\\*/g, '$1')
            .replace(backtickRegex, '\`$1\`');
          
          releaseNotes.textContent = notes;
          
          updateDownloadUrl = data.updateInfo.downloadUrl;
          updateReleaseUrl = data.updateInfo.releaseUrl;
          
          banner.classList.add('show');
        }
      } catch (e) {
        console.error('Update check failed:', e);
      }
    }
    
    checkStatus();
    checkUpdate();
    setInterval(checkStatus, 2000);
  </script>
</body>
</html>`;
}

if (!STDIO_MODE) {
  console.log(t('pressCtrlCToExit'));
}

startServer().catch((error) => {
  log(`Failed to start server: ${error.message}`);
  process.exit(1);
});
