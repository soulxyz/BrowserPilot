# MCP Browser Client - Chrome Extension

> Chrome扩展版本的MCP Browser客户端

## 🎯 功能特性

### 已实现 ✅
- **导航工具**
  - `browser_navigate` - 导航到URL
  - `browser_navigate_back` - 返回上一页
  
- **页面快照**
  - `browser_snapshot` - 捕获页面结构和元素ref
  - `browser_take_screenshot` - 截图
  
- **交互工具**
  - `browser_click` - 点击元素
  - `browser_type` - 输入文本
  - `browser_hover` - 鼠标悬停
  - `browser_press_key` - 按键
  - `browser_drag` - 拖放
  
- **调试工具**
  - `browser_console_messages` - 获取Console消息
  - `browser_network_requests` - 获取网络请求
  - `browser_evaluate` - 执行JavaScript
  
- **标签页管理**
  - `browser_tabs` - 标签页列表/新建/关闭/选择
  - `browser_wait_for` - 等待条件
  - `browser_resize` - 调整窗口大小

### 待实现 ⏳
- 表单操作（fill_form, select_option, file_upload, handle_dialog）
- 完整的网络请求监控
- Side Panel UI（AI聊天界面）
- DevTools集成

## 📦 安装方法

### 1. 加载扩展

1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 启用右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `chrome-extension` 文件夹

### 2. 配置MCP服务器

1. 点击扩展图标打开Popup
2. 输入MCP服务器地址（如：`ws://localhost:3000`）
3. 点击"连接"按钮

## 🚀 使用方法

### 通过Popup UI

1. 点击扩展图标
2. 使用快速操作按钮：
   - 📸 获取快照 - 捕获当前页面结构
   - 🖼️ 截图 - 截取当前页面
   - 📝 Console - 查看控制台消息
   - 🌐 Network - 查看网络请求

### 通过MCP协议

扩展会监听来自MCP服务器的工具调用请求，自动执行并返回结果。

## 📁 项目结构

```
chrome-extension/
├── manifest.json              # 扩展配置
├── background/                # 后台服务
│   ├── service-worker.js      # 主服务
│   ├── mcp-client.js         # MCP客户端
│   ├── network-monitor.js    # 网络监控
│   ├── console-collector.js  # Console收集
│   └── tools/                # 工具实现
│       ├── registry.js       # 工具注册表
│       ├── navigation.js     # 导航工具
│       ├── snapshot.js       # 快照工具
│       ├── interaction.js    # 交互工具
│       ├── debug.js          # 调试工具
│       └── tabs.js           # 标签页工具
├── content/                  # Content Scripts
│   └── injector.js          # 脚本注入器
├── injected/                # 页面上下文脚本
│   └── page-context.js      # Console拦截等
├── ui/                      # 用户界面
│   └── popup/               # 弹出窗口
│       ├── popup.html
│       ├── popup.css
│       └── popup.js
└── icons/                   # 图标（需要添加）
```

## 🔧 核心技术

### Ref系统
- 为每个可交互元素生成唯一的ref标识
- 使用XPath和hash算法确保ref的唯一性和稳定性
- 在`window.__MCP_REF_MAP__`中维护ref到DOM元素的映射

### 三层通信架构
```
Page Context (injected/page-context.js)
    ↕ window.postMessage
Content Script (content/injector.js)
    ↕ chrome.runtime.sendMessage
Background Service Worker (background/service-worker.js)
    ↕ WebSocket
MCP Server
```

### Console拦截
- 在页面加载前（document_start）注入脚本
- 重写console方法，拦截所有console调用
- 捕获未处理的错误和Promise拒绝

### 网络监控
- 使用`chrome.webRequest` API监听所有网络请求
- 记录请求/响应头、状态码、时长等信息
- 按标签页分组管理

## 🐛 调试

### 查看后台日志
1. 访问 `chrome://extensions/`
2. 找到"MCP Browser Client"
3. 点击"Service Worker"链接
4. 在DevTools中查看日志

### 查看Content Script日志
1. 在任意网页上右键 -> 检查
2. 切换到Console标签
3. 过滤 `[MCP]` 关键字

## ⚠️ 已知问题

1. **网络请求监控** - 当前未完全集成到工具中
2. **全页截图** - 需要实现滚动拼接
3. **元素截图裁剪** - 需要实现Canvas裁剪

## 📝 开发笔记

### 重要发现

1. **Service Worker生命周期**
   - 需要定期ping保持活跃（每20秒）
   - 使用`chrome.runtime.onSuspend`监听休眠

2. **Content Script注入时机**
   - 必须使用`run_at: "document_start"`才能在页面脚本前执行
   - 需要`all_frames: true`支持iframe

3. **事件模拟完整性**
   - 必须触发完整的事件序列（mouseover → mousedown → click）
   - focus事件对某些元素很重要

4. **Ref生成策略**
   - 使用元素路径hash + 索引确保唯一性
   - 页面变化后需要重新生成

## 🔮 未来计划

### Phase 1 (当前) ✅
- [x] 核心MCP协议实现
- [x] 基础导航和快照
- [x] 基础交互工具
- [x] Popup UI

### Phase 2 (下一步)
- [ ] 完整的网络和Console监控集成
- [ ] 表单操作工具
- [ ] 完善截图功能（裁剪、全页）
- [ ] 错误处理优化

### Phase 3
- [ ] Side Panel UI（AI聊天）
- [ ] DevTools集成
- [ ] 操作录制和回放
- [ ] 性能优化

### Phase 4
- [ ] 扩展API（书签、下载、Cookie）
- [ ] 发布到Chrome Web Store
- [ ] 用户文档和教程

## 📄 许可

MIT License

## 🙏 致谢

基于Browser MCP (Playwright) 的设计和实现。

---

**版本**: 0.1.0  
**作者**: MCP Browser Client Team  
**更新日期**: 2025-10-02






