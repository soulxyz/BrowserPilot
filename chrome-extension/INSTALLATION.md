# MCP Browser Client 安装指南

## 📋 前置要求

- Chrome浏览器（版本 > 88）
- 基本的命令行知识
- （可选）MCP服务器（用于协议通信）

## 🚀 快速开始

### 步骤1：下载代码

```bash
# 克隆或下载整个项目
cd chrome-extension
```

### 步骤2：准备图标（可选）

如果没有图标文件，创建简单的占位图标：

```bash
# 在 chrome-extension/icons/ 目录下
# 创建 icon16.png, icon48.png, icon128.png
# 或使用任何16x16, 48x48, 128x128的PNG图片
```

> 📝 **注意**：扩展可以在没有图标的情况下运行，但Chrome会显示警告。

### 步骤3：加载扩展到Chrome

1. **打开Chrome扩展页面**
   - 在地址栏输入：`chrome://extensions/`
   - 或者：菜单 → 更多工具 → 扩展程序

2. **启用开发者模式**
   - 点击右上角的"开发者模式"开关

3. **加载扩展**
   - 点击"加载已解压的扩展程序"按钮
   - 选择 `chrome-extension` 文件夹（包含manifest.json的文件夹）
   - 点击"选择文件夹"

4. **验证安装**
   - 扩展应该出现在列表中
   - 名称："MCP Browser Client"
   - 状态：已启用

### 步骤4：固定扩展图标（推荐）

1. 点击Chrome工具栏中的拼图图标（扩展菜单）
2. 找到"MCP Browser Client"
3. 点击图钉图标将其固定到工具栏

## 🎮 使用扩展

### 方式1：通过Popup UI

1. **打开Popup**
   - 点击工具栏中的扩展图标

2. **测试功能（无需MCP服务器）**
   - 打开任意网页
   - 点击"📸 获取快照"按钮
   - 查看结果输出

3. **连接MCP服务器（可选）**
   - 输入服务器地址（如：`ws://localhost:3000`）
   - 点击"连接"按钮
   - 状态指示灯变绿表示连接成功

### 方式2：开发者控制台

打开Background Service Worker控制台：

1. 访问 `chrome://extensions/`
2. 找到"MCP Browser Client"
3. 点击"Service Worker"链接
4. 在DevTools中测试：

```javascript
// 测试获取快照
chrome.runtime.sendMessage({
  type: 'execute_tool',
  tool: 'browser_snapshot',
  params: {}
}, (response) => {
  console.log(response);
});
```

## 🔍 验证安装

### 检查Service Worker

1. 访问 `chrome://extensions/`
2. 找到扩展
3. 查看"Service Worker"状态：
   - ✅ 正常：显示"Service Worker (Active)"
   - ❌ 错误：显示错误信息，点击查看详情

### 检查Content Script注入

1. 打开任意网页
2. 右键 → 检查（或按F12）
3. 在Console中输入：
   ```javascript
   window.__MCP_INITIALIZED__
   ```
4. 应该返回 `true`

### 检查Console拦截

1. 在同一Console中输入：
   ```javascript
   console.log('测试');
   window.__MCP_GET_CONSOLE__()
   ```
2. 应该看到拦截到的console消息

## 🐛 常见问题

### 问题1：扩展未显示

**症状**：加载扩展后，列表中看不到

**解决方法**：
1. 确认选择了正确的文件夹（包含manifest.json）
2. 检查manifest.json格式是否正确
3. 查看是否有错误提示

### 问题2：Service Worker不活跃

**症状**："Service Worker (Inactive)"

**解决方法**：
1. 点击"Service Worker"链接激活它
2. 检查DevTools中的错误信息
3. 点击扩展图标触发激活

### 问题3：图标显示为拼图

**症状**：扩展图标显示为灰色拼图

**解决方法**：
1. 这是正常的（没有提供图标文件）
2. 添加图标文件到 `icons/` 目录
3. 点击"重新加载"刷新扩展

### 问题4：无法连接MCP服务器

**症状**：点击连接后显示错误

**解决方法**：
1. 确认MCP服务器正在运行
2. 检查服务器地址和端口
3. 确认使用WebSocket协议（ws:// 或 wss://）
4. 检查防火墙设置

### 问题5：快照获取失败

**症状**：点击"获取快照"无响应或报错

**解决方法**：
1. 检查Content Script是否注入成功
2. 查看页面Console的错误信息
3. 确认页面已完全加载
4. 尝试刷新页面后重试

## 🔧 开发调试

### 修改代码后

1. 修改任何文件后
2. 访问 `chrome://extensions/`
3. 找到扩展
4. 点击"重新加载"图标 🔄

### 查看日志

**Background日志：**
- `chrome://extensions/` → 点击"Service Worker"

**Content Script日志：**
- 网页上右键 → 检查 → Console标签
- 过滤 `[MCP]` 查看相关日志

**Page Context日志：**
- 同Content Script，过滤 `[MCP Page]`

## 📚 进阶使用

### 创建图标

使用在线工具或图像编辑器创建三个尺寸的图标：
- `icon16.png` - 16x16像素
- `icon48.png` - 48x48像素  
- `icon128.png` - 128x128像素

保存到 `chrome-extension/icons/` 目录。

### 修改默认服务器地址

编辑 `ui/popup/popup.html`：

```html
<input 
  type="text" 
  id="serverUrl" 
  placeholder="ws://localhost:3000"
  value="ws://your-server:port"  <!-- 修改这里 -->
>
```

### 打包扩展

1. 访问 `chrome://extensions/`
2. 点击"打包扩展程序"
3. 选择扩展根目录
4. 点击"打包扩展程序"
5. 生成 `.crx` 文件和 `.pem` 私钥

> ⚠️ **注意**：妥善保管 `.pem` 文件，用于后续更新！

## ✅ 安装成功标志

如果看到以下情况，说明安装成功：

- ✅ 扩展出现在 `chrome://extensions/` 列表中
- ✅ 点击扩展图标能打开Popup
- ✅ Popup显示"未连接"状态（正常）
- ✅ 点击"获取快照"能返回结果
- ✅ Service Worker显示为Active
- ✅ Console中能看到 `[MCP]` 日志

## 🎉 下一步

1. 📖 阅读 [README.md](./README.md) 了解功能
2. 🧪 尝试各个功能按钮
3. 🔌 连接MCP服务器（如果有）
4. 🚀 开始使用或开发！

## 💡 需要帮助？

- 查看 [README.md](./README.md)
- 检查浏览器Console的错误信息
- 查看 [完整参考文档](../Browser_MCP_API_Complete_Reference.md)

---

**提示**：首次安装建议先在测试页面（如example.com）尝试功能，确认一切正常后再在重要页面使用。






