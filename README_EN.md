<div align="center">

# 🚀 BrowserPilot

**Let AI Control Your Browser**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io/)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-orange)](https://developer.chrome.com/docs/extensions/)

*Based on MCP protocol, enable any AI tool to control browsers through natural language for automation, testing, and web scraping.*

[Quick Start](#-quick-start) • [Features](#-features) • [Documentation](#-documentation) • [API](#-api-usage)

**[中文](./README.md)** | **English**

</div>

---

## 📖 Overview

**BrowserPilot** is a browser control tool based on [Model Context Protocol (MCP)](https://modelcontextprotocol.io/), enabling AI applications to control browsers through natural language. Perfect for web automation, testing, scraping, and debugging.

### 🎯 Key Features

- 🌐 **Universal MCP Support** - Compatible with all MCP-enabled AI tools (Cursor, Claude Desktop, etc.)
- 🔌 **Multi-Browser Support** - Works with all Chromium-based browsers (Chrome, Edge, Brave, etc.), Firefox support in development
- 📦 **Ready to Use** - Pre-built executables available, no Node.js required
- 🎯 **15+ Browser Tools** - Complete coverage: navigate, click, type, screenshot, debug, and more
- 🚀 **Real-time Control** - Instant response to AI commands with no delay
- 🛡️ **100% Local** - No external APIs, complete data privacy
- 📦 **Lightweight** - Only depends on WebSocket (ws) library
- 🎨 **Accessibility-First** - Reliable element detection using browser accessibility tree

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      BrowserPilot Architecture                           │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐                    ┌──────────────────┐
    │   MCP Client     │                    │    MCP Server    │
    │                  │                    │                  │
    │  🤖 Cursor       │    ① STDIO         │  📡 Node.js      │
    │  🤖 Claude       │  ◄──────────────►  │  📡 WebSocket    │
    │  🤖 Other AI     │   (Cmd/Response)   │  📡 HTTP Server  │
    └──────────────────┘                    └──────────────────┘
           ▲                                         │
           │                                         │ ② WebSocket
           │                                         │  ws://localhost:9222
           │                                         ▼
           │                                ┌──────────────────┐
           │                                │  Browser Ext.    │
           │                                │                  │
           │                                │  🔧 Service      │
           │                                │     Worker       │
           │                                │  🔧 Tools        │
           └────────────────────────────────│     Registry     │
                 ④ Results                  │  🔧 MCP Client   │
                                            └──────────────────┘
                                                     │
                                                     │ ③ Execute
                                                     │  (chrome API)
                                                     ▼
                                            ┌──────────────────┐
                                            │   Browser Tab    │
                                            │                  │
                                            │  🌐 DOM          │
                                            │  🌐 Console      │
                                            │  🌐 Network      │
                                            └──────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ Data Flow:                                                               │
│ ① MCP Client sends AI commands (e.g., "open webpage") via STDIO          │
│ ② MCP Server converts commands to browser actions via WebSocket          │
│ ③ Browser Extension calls Chrome APIs to execute (navigate, click, etc.) │
│ ④ Results flow back: Browser → Extension → MCP Server → MCP Client      │
└─────────────────────────────────────────────────────────────────────────┘


## 💿 Installation Methods

### Method 1: Use Pre-built Binaries (Recommended)

**No Node.js required**, use pre-compiled executables:

1. Download from [Releases](https://github.com/YOUR_USERNAME/BrowserPilot/releases)
2. Extract to any directory
3. Follow [Quick Start](#-quick-start) below

### Method 2: Run from Source

Requires **Node.js ≥ 18.0.0**:

```bash
git clone https://github.com/YOUR_USERNAME/BrowserPilot.git
cd BrowserPilot
npm install
```

## 🚀 Quick Start

### 1. Install Browser Extension

Works with all **Chromium-based browsers**: Chrome, Edge, Brave, Opera, etc.

1. Open extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `chrome-extension` folder

> 🦊 **Firefox Support**: Firefox version is under development

### 2. Start MCP Server

**Using pre-built binary:**
```bash
# Windows
.\MCP-Browser-Win.exe

# Mac
./MCP-Browser-Mac

# Linux
./MCP-Browser-Linux
```

**From source:**
```bash
npm start
```

Visit http://localhost:3000 to see the control panel (optional).

### 3. Connect Browser Extension

Click the extension icon in browser toolbar, connect to `ws://localhost:9222`

### 4. Configure MCP Client

#### Cursor Configuration

Project includes `.cursor/mcp.json` configuration. **Restart Cursor** to activate.

#### Claude Desktop Configuration

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac) or corresponding config:

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

#### Other MCP Clients

Refer to your client's MCP configuration documentation, key parameters:
- **command**: Path to MCP server
- **args**: `["--stdio-only"]`
- **protocol**: stdio

## ✨ Core Features

### 🧭 Navigation & Snapshots
| Tool | Description |
|------|-------------|
| `browser_navigate` | Navigate to URL |
| `browser_navigate_back` | Go back to previous page |
| `browser_snapshot` | Capture page accessibility tree for element discovery |
| `browser_take_screenshot` | Screenshot full page or specific element |

### 🖱️ Interactions
| Tool | Description |
|------|-------------|
| `browser_click` | Click elements (double-click, modifiers supported) |
| `browser_type` | Type text into inputs |
| `browser_hover` | Hover over elements |
| `browser_press_key` | Press keyboard keys (Enter, Escape, etc.) |
| `browser_drag` | Drag elements to target position |
| `browser_select_option` | Select dropdown options |
| `browser_fill_form` | Batch fill multiple form fields |
| `browser_wait_for` | Wait for conditions (text appear/disappear, delay) |

### 🐛 Debugging & Analysis
| Tool | Description |
|------|-------------|
| `browser_console_messages` | Get browser console logs |
| `browser_network_requests` | Get network request logs |
| `browser_evaluate` | Execute JavaScript in page context |

### 🗂️ Tab Management
| Tool | Description |
|------|-------------|
| `browser_tabs` | Manage tabs (list, create, close, switch) |
| `browser_resize` | Resize browser window |

## 💬 Use Cases

In MCP-enabled AI tools, use natural language commands:

**Web Automation:**
> "Open https://example.com, fill the login form with username demo@example.com and password demo123, then click login"

**Data Scraping:**
> "Visit https://news.ycombinator.com and extract the titles and links of the top 10 stories"

**Automated Testing:**
> "Open our product page, click the buy button, fill in test data, and screenshot the checkout page"

**Web Debugging:**
> "Execute console.log(document.title), then show console messages and recent network requests"

## 📡 API Usage

### Via MCP Client

All tools are automatically exposed through MCP protocol. AI will automatically select and call them based on natural language.

### Direct API Calls (Programmatic)

If you want to use directly in code, communicate with MCP server via WebSocket:

```javascript
const WebSocket = require('ws');

// Connect to MCP server
const ws = new WebSocket('ws://localhost:9222');

ws.on('open', () => {
  // Call browser tool
  const request = {
    type: 'navigate',
    url: 'https://github.com'
  };
  
  ws.send(JSON.stringify(request));
});

ws.on('message', (data) => {
  const response = JSON.parse(data);
  console.log('Result:', response);
});
```

### Tool Parameter Examples

<details>
<summary><b>browser_navigate</b> - Navigate to URL</summary>

```json
{
  "url": "https://example.com"
}
```
</details>

<details>
<summary><b>browser_click</b> - Click element</summary>

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
<summary><b>browser_type</b> - Type text</summary>

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
<summary><b>browser_evaluate</b> - Execute JavaScript</summary>

```json
{
  "function": "() => document.title"
}
```
</details>

<details>
<summary><b>browser_fill_form</b> - Batch fill form</summary>

```json
{
  "fields": [
    {
      "name": "Username",
      "type": "textbox",
      "ref": "12345",
      "value": "demo@example.com"
    },
    {
      "name": "Password",
      "type": "textbox",
      "ref": "67890",
      "value": "demo123"
    }
  ]
}
```
</details>

For more tool parameters, see [API Documentation](./docs/API.md) (in development).

## 📁 Project Structure

```
BrowserPilot/
├── .cursor/
│   └── mcp.json              # Cursor MCP configuration
├── chrome-extension/          # Browser extension source
│   ├── background/
│   │   ├── service-worker.js # Main service worker
│   │   ├── mcp-client.js     # WebSocket client
│   │   └── tools/            # Tool implementations
│   │       ├── navigation.js # Navigation tools
│   │       ├── interaction.js# Interaction tools
│   │       ├── snapshot.js   # Snapshot tools
│   │       ├── debug.js      # Debug tools
│   │       ├── tabs.js       # Tab tools
│   │       └── registry.js   # Tool registry
│   ├── content/              # Content scripts
│   ├── injected/             # Page context scripts
│   └── ui/                   # Popup interface
├── simple-server/
│   ├── server.js             # MCP server
│   └── update-checker.js     # Update checker
├── scripts/
│   └── create-release.js     # Build scripts
├── dist/                     # Build output
│   ├── MCP-Browser-Win.exe   # Windows binary
│   ├── MCP-Browser-Mac       # macOS binary
│   └── MCP-Browser-Linux     # Linux binary
├── package.json
└── README.md
```

## 📖 Documentation

- **[BUILD_GUIDE.md](./BUILD_GUIDE.md)** - How to build executables
- **[QUICK_BUILD.md](./QUICK_BUILD.md)** - Quick build reference
- **[chrome-extension/README.md](./chrome-extension/README.md)** - Extension development

## 🔧 Troubleshooting

### MCP client doesn't see tools?
1. Verify MCP server is running
2. Check MCP configuration file path and parameters
3. **Completely restart MCP client**
4. Check client's MCP logs

### Browser extension won't connect?
1. Ensure MCP server is running
2. Visit http://localhost:3000 to check status
3. Check extension console in browser extension management page
4. Verify WebSocket URL is `ws://localhost:9222`
5. Check if firewall is blocking connection

### Port already in use?
```bash
# Windows
netstat -ano | findstr :9222
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :9222
kill -9 <PID>
```

### Commands not working?
1. Execute `browser_snapshot` first to get page structure
2. Use `ref` from snapshot to reference elements
3. Try more specific element descriptions
4. Check browser console for errors

## 🔒 Security

- ✅ **Fully local** - No external API calls
- ✅ **Localhost only** - All communication over 127.0.0.1
- ✅ **No telemetry** - No data collection or tracking
- ✅ **Open source** - Full transparency, audit the code
- ⚠️ **Development tool** - Not intended for production use

**Best Practices:**
- Only use on trusted websites
- Review generated scripts before execution
- Disable extension when not in use
- Don't expose WebSocket port to public network

## 🛠️ Development

### Adding New Tools

1. Create tool file in `chrome-extension/background/tools/`
2. Register in `chrome-extension/background/tools/registry.js`
3. Add tool definition in `simple-server/server.js` TOOLS array
4. Test functionality

### Running Modes

```bash
# Development mode with web UI
npm start

# STDIO mode for MCP clients
npm run start:stdio

# Build executable
npm run build
```

### Building Binaries

See [BUILD_GUIDE.md](./BUILD_GUIDE.md) for detailed instructions.

```bash
# Build all platforms
npm run build:all

# Build Windows
npm run build:win

# Build macOS
npm run build:mac

# Build Linux
npm run build:linux
```

## 🤝 Contributing

Contributions welcome! Here's how you can help:

1. 🐛 **Report bugs** - Open an issue with reproduction steps
2. 💡 **Suggest features** - Share your ideas for improvements
3. 📖 **Improve docs** - Help make documentation clearer
4. 🔧 **Submit PRs** - Fix bugs or add features
5. 🌍 **Translate** - Help translate docs to more languages

## 🌐 Supported Platforms

### MCP Clients
- ✅ **Cursor** - AI-powered code editor
- ✅ **Claude Desktop** - Anthropic's official desktop app
- ✅ Any client supporting MCP protocol

### Browsers
- ✅ **Chrome** - Google Chrome
- ✅ **Edge** - Microsoft Edge
- ✅ **Brave** - Brave Browser
- ✅ **Opera** - Opera Browser
- ✅ Other Chromium-based browsers
- 🔜 **Firefox** - In development

### Operating Systems
- ✅ **Windows** - Windows 10/11
- ✅ **macOS** - macOS 10.15+
- ✅ **Linux** - Ubuntu 20.04+, Debian, Fedora, etc.

## 📊 Comparison with Other Tools

| Feature | BrowserPilot | Puppeteer | Playwright | Selenium |
|---------|-------------|-----------|------------|----------|
| Native MCP Support | ✅ | ❌ | ❌ | ❌ |
| AI Natural Language | ✅ | ❌ | ❌ | ❌ |
| Real Browser Interaction | ✅ | ⚠️ Mostly Headless | ⚠️ Both | ✅ |
| No Programming Required | ✅ | ❌ | ❌ | ❌ |
| Setup Complexity | 🟢 Low | 🟡 Medium | 🟡 Medium | 🔴 High |
| Multi-Browser Support | 🟡 Chromium | 🟡 Chromium | ✅ All | ✅ All |
| Lightweight | ✅ | ✅ | ❌ | ❌ |

## 🗺️ Roadmap

- [ ] Firefox browser support
- [ ] Safari browser support (macOS)
- [ ] Recording mode (record and replay action sequences)
- [ ] Visual element selector
- [ ] Multi-tab coordination and sync
- [ ] Session persistence and recovery
- [ ] Browser profile management
- [ ] Proxy and network configuration
- [ ] Mobile browser support
- [ ] Docker containerization
- [ ] Plugin marketplace (community tools)

## 📜 License

MIT License - See [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) - Protocol specification
- [Cursor](https://cursor.com/) - AI-first IDE
- [Anthropic](https://www.anthropic.com/) - Claude and MCP protocol
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/) - Extension platform
- [WebSocket (ws)](https://github.com/websockets/ws) - WebSocket implementation

## 📬 Contact & Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/BrowserPilot/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/BrowserPilot/discussions)
- 📧 **Email**: your-email@example.com
- ⭐ **Star us**: If you find this useful, please star the repository!

---

<div align="center">

**Built with ❤️ for the AI automation community**

[⬆ Back to Top](#-browserpilot)

</div>
