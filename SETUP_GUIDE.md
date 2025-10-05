# 🚀 MCP Browser Control - 完整配置指南

这个项目让 Cursor AI 能够直接控制 Chrome 浏览器，实现自动化测试、网页抓取等功能。

## 📐 架构说明

```
┌─────────┐  STDIO   ┌─────────────┐  WebSocket  ┌──────────────┐
│ Cursor  │ <------> │  MCP Server │ <---------> │  Chrome Ext  │
│   AI    │          │  (Node.js)  │             │   Extension  │
└─────────┘          └─────────────┘             └──────────────┘
                                                          |
                                                          v
                                                   ┌──────────────┐
                                                   │   Browser    │
                                                   │   (Chrome)   │
                                                   └──────────────┘
```

## 🔧 配置步骤

### Step 0: 安装依赖

在项目根目录运行：

```bash
npm install
```

这会安装 `ws` (WebSocket) 库，大约需要几秒钟。

### Step 1: 配置 Cursor MCP

已经为你创建了 `.cursor/mcp.json` 配置文件。

**重启 Cursor** 使配置生效：
1. 完全退出 Cursor
2. 重新打开 Cursor
3. 打开设置 (Ctrl+Shift+J)
4. 前往 **Features → Model Context Protocol**
5. 确认 `browser-control` 服务器显示为 **已启用** ✅

### Step 2: 安装 Chrome Extension

1. **打开 Chrome 扩展页面**
   - 在 Chrome 地址栏输入: `chrome://extensions/`
   - 或者: 菜单 → 更多工具 → 扩展程序

2. **启用开发者模式**
   - 点击右上角 "开发者模式" 开关

3. **加载扩展**
   - 点击 "加载已解压的扩展程序"
   - 选择项目中的 `chrome-extension` 文件夹
   - 扩展应该会出现在列表中，名称为 "MCP Browser Client"

4. **固定扩展**
   - 点击 Chrome 工具栏的扩展图标（拼图图标）
   - 找到 "MCP Browser Client"
   - 点击图钉图标固定到工具栏

### Step 3: 启动 MCP 服务器

有两种启动方式：

#### 方式 A: 手动启动（推荐用于调试）

在项目目录打开终端，运行：

```bash
node simple-server/server.js
```

你会看到：
- 🌐 Web 控制面板: http://localhost:3000
- 📡 WebSocket 服务器: ws://localhost:9222

访问控制面板可以查看连接状态。

#### 方式 B: 自动启动（Cursor 自动管理）

当你在 Cursor 中使用浏览器工具时，Cursor 会自动启动服务器。

### Step 4: 连接 Extension 到服务器

1. **点击 Chrome 工具栏中的扩展图标**
2. **在弹出的 Popup 中：**
   - 服务器地址: `ws://localhost:9222`
   - 点击 "连接" 按钮
3. **确认连接状态**
   - 看到 "已连接 ✅" 表示成功
   - 也可以访问 http://localhost:3000 查看状态

## 🎮 使用方法

### 在 Cursor 中使用

配置完成后，你可以在 Cursor 的 Composer 或 Chat 中直接使用自然语言控制浏览器：

**示例 1: 导航和截图**
```
帮我打开 https://example.com 并截个图
```

**示例 2: 自动化测试**
```
打开 https://github.com，在搜索框输入 "cursor"，点击搜索，然后截图
```

**示例 3: 数据抓取**
```
打开 https://news.ycombinator.com，抓取前10条新闻标题
```

**示例 4: 调试网页**
```
打开这个页面，执行 console.log，然后获取所有控制台消息
```

### 可用工具列表

Cursor AI 可以调用以下工具：

#### 🧭 导航类
- `browser_navigate` - 导航到指定 URL
- `browser_navigate_back` - 返回上一页

#### 📸 快照类
- `browser_snapshot` - 捕获页面 DOM 快照
- `browser_take_screenshot` - 截取页面截图

#### 🖱️ 交互类
- `browser_click` - 点击元素
- `browser_type` - 在输入框输入文本
- `browser_hover` - 鼠标悬停
- `browser_press_key` - 按键
- `browser_drag` - 拖拽元素
- `browser_wait_for` - 等待元素出现

#### 🐛 调试类
- `browser_console_messages` - 获取控制台消息
- `browser_network_requests` - 获取网络请求
- `browser_evaluate` - 执行 JavaScript 代码

#### 🗂️ 标签页类
- `browser_tabs` - 管理标签页（新建、关闭、切换）
- `browser_resize` - 调整窗口大小

## 🔍 验证安装

### 测试 MCP 服务器

在 Cursor Chat 中输入：
```
使用 browser_navigate 工具打开 https://example.com
```

如果看到 Cursor 提示工具调用，说明 MCP 服务器配置成功。

### 测试 Extension 连接

1. 手动启动服务器: `node simple-server/server.js`
2. 访问 http://localhost:3000
3. 查看 "Chrome Extension" 状态是否为 "已连接 ✓"

## 🐛 故障排查

### Cursor 看不到工具

1. **检查配置文件**
   ```bash
   cat .cursor/mcp.json
   ```
   确保格式正确

2. **重启 Cursor**
   完全退出并重新打开

3. **查看 MCP 日志**
   - Ctrl+Shift+U 打开输出面板
   - 选择 "MCP Logs"
   - 查看连接错误

### Extension 无法连接

1. **确认服务器运行**
   ```bash
   node simple-server/server.js
   ```
   应该看到启动信息

2. **检查端口占用**
   ```bash
   # Windows
   netstat -ano | findstr :9222
   
   # Mac/Linux
   lsof -i :9222
   ```

3. **查看 Extension 日志**
   - 打开 Chrome: `chrome://extensions/`
   - 找到 "MCP Browser Client"
   - 点击 "检查视图 service worker"
   - 查看 Console 输出

### WebSocket 连接被拒绝

- 确保防火墙允许 9222 端口
- 尝试使用 `127.0.0.1` 而不是 `localhost`

## 📚 更多资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [Cursor MCP 指南](https://docs.cursor.com/context/mcp)

## 💡 提示

1. **保持服务器运行**: Extension 需要服务器持续运行才能接收 Cursor 的指令
2. **先手动启动**: 建议先手动启动服务器调试，确认连接正常后再让 Cursor 自动管理
3. **查看日志**: 遇到问题时，同时查看三个地方的日志：
   - Cursor MCP Logs
   - Node.js 服务器输出
   - Chrome Extension Console

## 🎯 快速测试命令

在 Cursor Chat 中执行：

```
请执行以下操作：
1. 使用 browser_navigate 打开 https://example.com
2. 使用 browser_snapshot 获取页面结构
3. 使用 browser_take_screenshot 截图
```

如果所有步骤都成功，说明你的环境配置完成！🎉

