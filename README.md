<div align="center">

# 🚀 BrowserPilot

**让 AI 接管你的浏览器**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io/)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-orange)](https://developer.chrome.com/docs/extensions/)

*基于 MCP 协议，让任何 AI 工具通过自然语言控制浏览器，实现网页自动化、测试和数据抓取。*

[快速开始](#-快速开始) • [特性](#-特性) • [文档](#-文档) • [API](#-api-调用)

**中文** | **[English](./README_EN.md)**

</div>

---

## 📖 项目简介

**BrowserPilot** 是一个基于 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 的浏览器控制工具，让 AI 应用能够通过自然语言控制浏览器。非常适合网页自动化、测试、数据抓取和调试场景。

### 🎯 核心优势

- 🌐 **通用 MCP 支持** - 兼容所有支持 MCP 的 AI 工具（Cursor、Claude Desktop 等）
- 🔌 **多浏览器支持** - 支持所有 Chrome 内核浏览器（Chrome、Edge、Brave 等），Firefox 支持开发中
- 📦 **开箱即用** - 提供打包好的可执行文件，无需安装 Node.js
- 🎯 **15+ 浏览器工具** - 导航、点击、输入、截图、调试等全覆盖
- 🚀 **实时控制** - AI 指令即时响应，无延迟
- 🛡️ **100% 本地运行** - 无需外部 API，数据完全私密
- 📦 **轻量级设计** - 仅依赖 WebSocket (ws) 库
- 🎨 **可访问性优先** - 使用浏览器无障碍树实现可靠的元素定位

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BrowserPilot 架构                               │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐                    ┌──────────────────┐
    │    MCP 客户端    │                    │    MCP 服务器     │
    │                  │                    │                  │
    │  🤖 Cursor      │    ① STDIO         │  📡 Node.js      │
    │  🤖 Claude      │  ◄──────────────►  │  📡 WebSocket    │
    │  🤖 其他AI工具   │   (命令/响应)      │  📡 HTTP Server  │
    └──────────────────┘                    └──────────────────┘
           ▲                                         │
           │                                         │ ② WebSocket
           │                                         │  ws://localhost:9222
           │                                         ▼
           │                                ┌──────────────────┐
           │                                │   浏览器扩展      │
           │                                │                  │
           │                                │  🔧 Service      │
           │                                │     Worker       │
           │                                │  🔧 Tools        │
           └────────────────────────────────│     Registry     │
                   Result                   │  🔧 MCP Client   │
                                            └──────────────────┘
                                                     │
                                                     │ ③ 执行操作
                                                     │  (chrome API)
                                                     ▼
                                            ┌──────────────────┐
                                            │    浏览器标签页   │
                                            │                  │
                                            │  🌐 DOM          │
                                            │  🌐 Console      │
                                            │  🌐 Network      │
                                            └──────────────────┘



## 💿 安装方式

### 方式 1：使用打包版本（推荐）

**无需安装 Node.js**，直接使用预编译的可执行文件：

1. 从 [Releases](./releases) 下载对应平台的版本
2. 解压到任意目录
3. 按照下方[快速开始](#-快速开始)配置即可

### 方式 2：从源码运行

需要 **Node.js ≥ 18.0.0**：

```bash
git clone https://github.com/YOUR_USERNAME/BrowserPilot.git
cd BrowserPilot
npm install
```

## 🚀 快速开始

### 1. 安装浏览器扩展

支持所有 **Chrome 内核浏览器**：Chrome、Edge、Brave、Opera 等

1. 打开扩展管理页面：
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`
2. 启用**开发者模式**
3. 点击**加载已解压的扩展程序**
4. 选择 `chrome-extension` 文件夹

> 🦊 **Firefox 支持**：Firefox 版本正在开发中，敬请期待

### 2. 启动 MCP 服务器
注意，在实际使用中，不需要你手动打开，MCP调用方会自行打开。

**使用打包版本：**
```bash
# Windows
.\MCP-Browser-Win.exe

# Mac
./MCP-Browser-Mac

# Linux
./MCP-Browser-Linux
```

**从源码运行：**
```bash
npm start
```

访问 http://localhost:3000 查看控制面板（可选）。

### 3. 连接浏览器扩展

点击浏览器工具栏的扩展图标，连接到 `ws://localhost:9222`

### 4. 配置 MCP 客户端

#### 在 Cursor 中配置

项目包含 `.cursor/mcp.json` 配置，**重启 Cursor** 使配置生效。

#### 在 Claude Desktop 中配置

编辑 `~/Library/Application Support/Claude/claude_desktop_config.json`（Mac）或对应的配置文件：

```json
{
  "mcpServers": {
    "browser-pilot": {
      "command": "/path/to/MCP-Browser",
      "args": ["--stdio-only"]
    }
  }
}
```

#### 在其他 MCP 客户端中配置

参考对应客户端的 MCP 配置文档，关键参数：
- **command**: MCP 服务器路径
- **args**: `["--stdio-only"]`
- **protocol**: stdio

## ✨ 核心特性

### 🧭 导航与快照
| 工具 | 描述 |
|------|------|
| `browser_navigate` | 导航到指定 URL |
| `browser_navigate_back` | 返回上一页 |
| `browser_snapshot` | 捕获页面可访问性树，用于元素定位 |
| `browser_take_screenshot` | 截取全页或指定元素的截图 |

### 🖱️ 交互操作
| 工具 | 描述 |
|------|------|
| `browser_click` | 点击元素（支持双击、修饰键） |
| `browser_type` | 在输入框输入文本 |
| `browser_hover` | 鼠标悬停在元素上 |
| `browser_press_key` | 按下键盘按键（Enter、Escape 等） |
| `browser_drag` | 拖拽元素到指定位置 |
| `browser_select_option` | 选择下拉菜单选项 |
| `browser_fill_form` | 批量填写多个表单字段 |
| `browser_wait_for` | 等待条件满足（文本出现/消失、延迟） |

### 🐛 调试与分析
| 工具 | 描述 |
|------|------|
| `browser_console_messages` | 获取浏览器控制台日志 |
| `browser_network_requests` | 获取网络请求记录 |
| `browser_evaluate` | 在页面上下文执行 JavaScript |

### 🗂️ 标签页管理
| 工具 | 描述 |
|------|------|
| `browser_tabs` | 管理标签页（列出、创建、关闭、切换） |
| `browser_resize` | 调整浏览器窗口尺寸 |

## 💬 使用场景

在支持 MCP 的 AI 工具中，用自然语言下达指令：

**网页自动化：**
> "打开 https://example.com，填写登录表单，用户名是 demo@example.com，密码是 demo123，然后点击登录"

**数据抓取：**
> "访问 https://news.ycombinator.com，提取前 10 条新闻的标题和链接"

**自动化测试：**
> "打开我们的产品页面，点击购买按钮，填写测试数据，截图结账页面"

**网页调试：**
> "执行 console.log(document.title)，然后显示控制台消息和最近的网络请求"

## 📡 API 调用

### 通过 MCP 客户端调用

所有工具都通过 MCP 协议自动暴露，AI 会根据自然语言自动选择和调用。

### 直接调用（编程方式）

如果你想在代码中直接使用，可以通过 WebSocket 与 MCP 服务器通信：

```javascript
const WebSocket = require('ws');

// 连接到 MCP 服务器
const ws = new WebSocket('ws://localhost:9222');

ws.on('open', () => {
  // 调用浏览器工具
  const request = {
    type: 'navigate',
    url: 'https://github.com'
  };
  
  ws.send(JSON.stringify(request));
});

ws.on('message', (data) => {
  const response = JSON.parse(data);
  console.log('结果:', response);
});
```

### 工具参数示例

<details>
<summary><b>browser_navigate</b> - 导航到 URL</summary>

```json
{
  "url": "https://example.com"
}
```
</details>

<details>
<summary><b>browser_click</b> - 点击元素</summary>

```json
{
  "element": "button#submit",
  "ref": "12345",
  "button": "left",
  "modifiers": ["Control"]
}
```
</details>

<details>
<summary><b>browser_type</b> - 输入文本</summary>

```json
{
  "element": "input[name='username']",
  "ref": "67890",
  "text": "demo@example.com",
  "submit": false
}
```
</details>

<details>
<summary><b>browser_evaluate</b> - 执行 JavaScript</summary>

```json
{
  "function": "() => document.title"
}
```
</details>

<details>
<summary><b>browser_fill_form</b> - 批量填写表单</summary>

```json
{
  "fields": [
    {
      "name": "用户名",
      "type": "textbox",
      "ref": "12345",
      "value": "demo@example.com"
    },
    {
      "name": "密码",
      "type": "textbox",
      "ref": "67890",
      "value": "demo123"
    }
  ]
}
```
</details>

更多工具参数请参考 [API 文档](./docs/API.md)（开发中）。

## 📁 项目结构

```
BrowserPilot/
├── .cursor/
│   └── mcp.json              # Cursor MCP 配置
├── chrome-extension/          # 浏览器扩展源码
│   ├── background/
│   │   ├── service-worker.js # 主服务 Worker
│   │   ├── mcp-client.js     # WebSocket 客户端
│   │   └── tools/            # 工具实现
│   │       ├── navigation.js # 导航工具
│   │       ├── interaction.js# 交互工具
│   │       ├── snapshot.js   # 快照工具
│   │       ├── debug.js      # 调试工具
│   │       ├── tabs.js       # 标签页工具
│   │       └── registry.js   # 工具注册表
│   ├── content/              # 内容脚本
│   ├── injected/             # 页面注入脚本
│   └── ui/                   # 弹出界面
├── simple-server/
│   ├── server.js             # MCP 服务器
│   └── update-checker.js     # 更新检查器
├── scripts/
│   └── create-release.js     # 构建脚本
├── dist/                     # 构建输出
│   ├── MCP-Browser-Win.exe   # Windows 版本
│   ├── MCP-Browser-Mac       # macOS 版本
│   └── MCP-Browser-Linux     # Linux 版本
├── package.json
└── README.md
```

## 📖 文档

- **[BUILD_GUIDE.md](./BUILD_GUIDE.md)** - 如何构建可执行文件
- **[QUICK_BUILD.md](./QUICK_BUILD.md)** - 快速构建参考
- **[chrome-extension/README.md](./chrome-extension/README.md)** - 扩展开发文档

## 🔧 故障排查

### MCP 客户端看不到工具？
1. 确认 MCP 服务器正在运行
2. 检查 MCP 配置文件路径和参数
3. **完全重启 MCP 客户端**
4. 查看客户端的 MCP 日志

### 浏览器扩展无法连接？
1. 确保 MCP 服务器正在运行
2. 访问 http://localhost:3000 检查状态
3. 在浏览器扩展管理页面检查扩展控制台
4. 确认 WebSocket URL 为 `ws://localhost:9222`
5. 检查防火墙是否阻止连接

### 端口被占用？
```bash
# Windows
netstat -ano | findstr :9222
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :9222
kill -9 <PID>
```

### 指令不生效？
1. 先执行 `browser_snapshot` 获取页面结构
2. 使用快照中的 `ref` 引用元素
3. 尝试更具体的元素描述
4. 检查浏览器控制台是否有错误

## 🔒 安全说明

- ✅ **完全本地运行** - 无外部 API 调用
- ✅ **仅限本地主机** - 所有通信都在 127.0.0.1 上
- ✅ **无遥测数据** - 不收集或跟踪任何数据
- ✅ **开源透明** - 完全透明，可审计代码
- ⚠️ **开发工具** - 不适用于生产环境

**最佳实践：**
- 仅在可信网站上使用
- 执行前检查生成的脚本
- 不使用时禁用扩展
- 不要将 WebSocket 端口暴露到公网

## 🛠️ 开发指南

### 添加新工具

1. 在 `chrome-extension/background/tools/` 创建工具文件
2. 在 `chrome-extension/background/tools/registry.js` 注册
3. 在 `simple-server/server.js` 的 TOOLS 数组添加工具定义
4. 测试工具功能

### 运行模式

```bash
# 开发模式（带 Web UI）
npm start

# STDIO 模式（供 MCP 客户端使用）
npm run start:stdio

# 构建可执行文件
npm run build
```

### 构建打包版本

详细构建说明请查看 [BUILD_GUIDE.md](./BUILD_GUIDE.md)

```bash
# 构建所有平台
npm run build:all

# 构建 Windows
npm run build:win

# 构建 macOS
npm run build:mac

# 构建 Linux
npm run build:linux
```

## 🤝 贡献

欢迎贡献！你可以这样帮助我们：

1. 🐛 **报告 Bug** - 提交 Issue 并附上复现步骤
2. 💡 **建议功能** - 分享你对改进的想法
3. 📖 **改进文档** - 帮助使文档更清晰
4. 🔧 **提交 PR** - 修复 Bug 或添加功能
5. 🌍 **翻译** - 帮助翻译文档到更多语言

## 🌐 支持的平台

### MCP 客户端
- ✅ **Cursor** - AI 代码编辑器
- ✅ **Claude Desktop** - Anthropic 官方桌面应用
- ✅ 任何支持 MCP 协议的客户端

### 浏览器
- ✅ **Chrome** - Google Chrome
- ✅ **Edge** - Microsoft Edge
- ✅ **Brave** - Brave 浏览器
- ✅ **Opera** - Opera 浏览器
- ✅ 其他 Chromium 内核浏览器
- 🔜 **Firefox** - 开发中

### 操作系统
- ✅ **Windows** - Windows 10/11
- ✅ **macOS** - macOS 10.15+
- ✅ **Linux** - Ubuntu 20.04+, Debian, Fedora 等

## 📊 与其他工具对比

| 特性 | BrowserPilot | Puppeteer | Playwright | Selenium |
|------|-------------|-----------|------------|----------|
| MCP 原生支持 | ✅ | ❌ | ❌ | ❌ |
| AI 自然语言控制 | ✅ | ❌ | ❌ | ❌ |
| 真实浏览器交互 | ✅ | ⚠️ 主要无头 | ⚠️ 两者 | ✅ |
| 无需编程 | ✅ | ❌ | ❌ | ❌ |
| 配置复杂度 | 🟢 低 | 🟡 中 | 🟡 中 | 🔴 高 |
| 多浏览器支持 | 🟡 Chrome 内核 | 🟡 Chromium | ✅ 全部 | ✅ 全部 |
| 轻量级 | ✅ | ✅ | ❌ | ❌ |

## 🗺️ 路线图

- [ ] Firefox 浏览器支持
- [ ] Safari 浏览器支持（macOS）
- [ ] 录制模式（录制操作序列，稍后重放）
- [ ] 可视化元素选择器
- [ ] 多标签页协调和同步
- [ ] 会话持久化和恢复
- [ ] 浏览器配置文件管理
- [ ] 代理和网络配置
- [ ] 移动端浏览器支持
- [ ] Docker 容器化部署
- [ ] 插件市场（社区工具）

## 📜 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件。

## 🙏 致谢

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) - 协议规范
- [Cursor](https://cursor.com/) - AI 优先的 IDE
- [Anthropic](https://www.anthropic.com/) - Claude 和 MCP 协议
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/) - 扩展平台
- [WebSocket (ws)](https://github.com/websockets/ws) - WebSocket 实现

## 📬 联系与支持

 🐛 **问题反馈**：[GitHub Issues](https://github.com/YOUR_USERNAME/BrowserPilot/issues)
 💬 **讨论交流**：[GitHub Discussions](https://github.com/YOUR_USERNAME/BrowserPilot/discussions)
 ⭐ **点个星**：如果觉得有用，请给我们点个星！

---

<div align="center">


[⬆ 回到顶部](#-browserpilot)

</div>
