#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// --- 健壮的调试日志 ---
let log;
try {
  const logDir = path.dirname(process.execPath);
  const logFilePath = path.join(logDir, 'debug_mcp_test.log');
  fs.writeFileSync(logFilePath, `Log session started at ${new Date().toISOString()}\n`);
  log = (message) => fs.appendFileSync(logFilePath, `[${new Date().toISOString()}] ${message}\n`);
} catch (error) {
  // 初始日志记录器在文件系统访问前可能失败
  // 我们将在脚本后面重新定义它
}

log('--- SCRIPT START ---');
log(`ARGV: ${JSON.stringify(process.argv)}`);
log(`EXEC_PATH: ${process.execPath}`);

// --- 核心MCP逻辑 ---

const TOOLS = [
  { name: 'test_tool', description: 'A dummy tool that does nothing.', inputSchema: { type: 'object' } }
];

process.stdin.setEncoding('utf8');

let buffer = '';
process.stdin.on('data', (chunk) => {
  log(`DATA_IN: ${JSON.stringify(chunk)}`);
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (!line.trim()) continue;
    
    try {
      const request = JSON.parse(line);
      log(`REQUEST: ${JSON.stringify(request)}`);
      
      let response;
      if (request.method === 'initialize') {
        response = {
          jsonrpc: '2.0', id: request.id,
          result: {
            protocolVersion: '0.1.0',
            serverInfo: { name: 'mcp-test', version: '1.0.0' },
            capabilities: { tools: { listChanged: false } }
          }
        };
      } else if (request.method === 'tools/list') {
        response = {
          jsonrpc: '2.0', id: request.id,
          result: { tools: TOOLS }
        };
      } else {
        response = {
          jsonrpc: '2.0', id: request.id,
          error: { code: -32601, message: `Method not found: ${request.method}` }
        };
      }
      
      const responseStr = JSON.stringify(response) + '\n';
      process.stdout.write(responseStr);
      log(`RESPONSE: ${responseStr}`);

    } catch (error) {
      log(`ERROR: ${error.stack}`);
    }
  }
});

// 关键: 保持进程持续运行
process.stdin.resume();

process.on('exit', (code) => {
  log(`--- SCRIPT EXIT --- Code: ${code}`);
});

log('--- INITIALIZATION COMPLETE, WAITING FOR INPUT ---');

