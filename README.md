# 🤖 MCP Browser Control

**让 Cursor AI 直接控制你的 Chrome 浏览器！**

这个项目实现了 Cursor AI 与 Chrome 浏览器的无缝集成，让你可以通过自然语言指令进行网页自动化、测试、抓取等操作。

## ✨ 特性

- 🎯 **15+ 浏览器控制工具** - 导航、点击、输入、截图、调试等
- 🔌 **即插即用** - 简单配置即可使用
- 🚀 **实时交互** - Cursor 实时控制浏览器
- 🛡️ **完全本地化** - 无需外部 API，数据安全
- 📦 **轻量级** - 仅依赖 ws (WebSocket) 库

## 📐 架构

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

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Cursor

已包含 `.cursor/mcp.json` 配置文件。**重启 Cursor** 使配置生效。

### 3. 安装 Chrome Extension

1. 打开 `chrome://extensions/`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `chrome-extension` 文件夹

### 4. 启动服务器

```bash
npm start
```

访问 http://localhost:3000 查看控制面板。

### 5. 连接 Extension

点击 Chrome 工具栏的扩展图标，连接到 `ws://localhost:9222`

## 🎮 使用示例

在 Cursor Chat 中输入：

**示例 1: 简单导航**
```
打开 https://github.com
```

**示例 2: 自动化操作**
```
打开 https://google.com，搜索 "cursor ai"，然后截图
```

**示例 3: 数据抓取**
```
打开 https://news.ycombinator.com，获取前5条新闻标题
```

**示例 4: 页面调试**
```
打开当前页面，执行 console.log('test')，然后获取所有控制台消息
```

## 🛠️ 可用工具

### 🧭 导航类
- `browser_navigate` - 导航到 URL
- `browser_navigate_back` - 返回上一页

### 📸 快照类
- `browser_snapshot` - DOM 快照
- `browser_take_screenshot` - 截图

### 🖱️ 交互类
- `browser_click` - 点击元素
- `browser_type` - 输入文本
- `browser_hover` - 鼠标悬停
- `browser_press_key` - 按键
- `browser_drag` - 拖拽
- `browser_wait_for` - 等待元素

### 🐛 调试类
- `browser_console_messages` - 控制台消息
- `browser_network_requests` - 网络请求
- `browser_evaluate` - 执行 JavaScript

### 🗂️ 标签页类
- `browser_tabs` - 管理标签页
- `browser_resize` - 调整窗口

## 📁 项目结构

```
Browser_MCP/
├── .cursor/
│   └── mcp.json              # Cursor MCP 配置
├── chrome-extension/          # Chrome 扩展
│   ├── background/           # 后台服务
│   │   ├── service-worker.js # 主服务 Worker
│   │   ├── mcp-client.js     # MCP 客户端
│   │   └── tools/            # 工具实现
│   ├── content/              # 内容脚本
│   ├── injected/             # 页面注入脚本
│   └── ui/                   # 弹出界面
├── simple-server/
│   └── server.js             # MCP 服务器
├── package.json              # 项目配置
├── README.md                 # 本文件
└── SETUP_GUIDE.md           # 详细配置指南

```

## 📚 文档

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - 完整配置指南和故障排查
- **[chrome-extension/INSTALLATION.md](./chrome-extension/INSTALLATION.md)** - 扩展安装说明
- **[chrome-extension/README.md](./chrome-extension/README.md)** - 扩展开发文档

## 🐛 故障排查

### Cursor 看不到工具？
1. 检查 `.cursor/mcp.json` 配置
2. 完全重启 Cursor
3. 查看 MCP Logs (Ctrl+Shift+U → MCP Logs)

### Extension 无法连接？
1. 确认服务器正在运行: `npm start`
2. 访问 http://localhost:3000 查看状态
3. 检查扩展 Console (chrome://extensions/)

### 端口被占用？
```bash
# Windows
netstat -ano | findstr :9222

# Mac/Linux
lsof -i :9222
```

更多问题请查看 [SETUP_GUIDE.md](./SETUP_GUIDE.md)

## 🔒 安全说明

- ✅ 完全本地运行，无外部连接
- ✅ 仅在本地机器上通信 (localhost)
- ✅ Extension 仅响应来自本地服务器的请求
- ⚠️ 请勿在生产环境使用未经审计的工具

## 📝 开发

### 添加新工具

1. 在 `chrome-extension/background/tools/` 创建新工具文件
2. 在 `registry.js` 注册工具
3. 在 `simple-server/server.js` 的 `TOOLS` 数组添加工具定义

### 运行模式

```bash
# 带 UI 模式（用于调试）
npm start

# 纯 STDIO 模式（Cursor 使用）
npm run start:stdio
```

## 📜 License

MIT

## 🙏 致谢

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [Cursor](https://cursor.com/)
- Chrome Extensions API

---

**🎉 享受用 AI 控制浏览器的乐趣！**

有问题或建议？欢迎提 Issue！



