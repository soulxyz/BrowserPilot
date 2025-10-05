# ⚡ 快速打包指南

**只需3步，打包成单个exe文件！**

---

## 🎯 第一次打包

### 1️⃣ 安装打包工具

```bash
npm install
```

等待安装完成（约1-2分钟）

### 2️⃣ 执行打包

```bash
npm run build
```

等待打包完成（约2-3分钟），会看到：
```
> pkg simple-server/server.js...
✅ 打包完成！
```

### 3️⃣ 获取结果

打包完成的文件在：
```
dist/MCP-Browser-Win.exe  (~35MB)
```

---

## 🎁 创建完整发布包

```bash
npm run package
```

会自动：
- ✅ 打包exe文件
- ✅ 复制Chrome扩展
- ✅ 生成使用说明
- ✅ 创建配置示例

**输出目录**：`dist/release/`

---

## 📦 发布包内容

```
dist/release/
├── MCP-Browser.exe          # 服务器（~35MB）
├── chrome-extension/        # Chrome扩展
│   ├── background/
│   ├── content/
│   ├── injected/
│   ├── ui/
│   └── manifest.json
├── README.md                # 项目说明
├── mcp.json.example         # Cursor配置示例
└── 使用说明.txt             # 用户指南
```

---

## ✅ 测试打包结果

### 测试exe文件

```bash
cd dist/release
MCP-Browser.exe
```

应该看到配置指南输出。

### 测试STDIO模式

```bash
dist/release/MCP-Browser.exe --stdio-only
```

服务器应该启动并打开管理页面。

---

## 🚀 分发给用户

### 创建ZIP压缩包

1. 压缩 `dist/release` 目录
2. 命名：`MCP-Browser-Control-v1.1.0-Win64.zip`
3. 分享给用户

### 用户使用流程

1. **解压ZIP** 到任意目录
2. **配置Cursor** (.cursor/mcp.json)：
   ```json
   {
     "mcpServers": {
       "browser-control": {
         "command": "完整路径\\MCP-Browser.exe",
         "args": ["--stdio-only"]
       }
     }
   }
   ```
3. **安装Chrome扩展**：加载 `chrome-extension` 文件夹
4. **重启Cursor**，完成！

---

## 💡 常用命令

```bash
# 开发模式运行
npm start

# 打包Windows版本
npm run build:win

# 打包所有平台
npm run build:all

# 创建发布包
npm run package
```

---

## 📊 文件大小

| 文件 | 大小 | 说明 |
|------|------|------|
| MCP-Browser.exe | ~35MB | 包含Node.js运行时 |
| chrome-extension/ | ~500KB | Chrome扩展 |
| **总计** | **~36MB** | 完整发布包 |

相比：
- ❌ Node.js安装包：~70MB
- ✅ 我们的发布包：~36MB

---

## ⚠️ 注意事项

### Windows Defender警告

首次运行可能会被Windows Defender阻止：

**解决方法**：
1. 点击"更多信息"
2. 点击"仍要运行"

**原因**：未签名的exe文件

**长期解决**：申请代码签名证书

### 端口占用

如果9222或3000端口被占用：
- ✅ 服务器会自动使用下一个端口（9223, 3001...）
- ✅ 管理页面会显示实际端口

---

## 🎉 完成！

现在你有了一个：
- ✅ 30-40MB的单文件可执行程序
- ✅ 无需Node.js环境
- ✅ 双击即可运行
- ✅ 易于分发

**开始打包吧！**

```bash
npm install
npm run package
```

🚀 享受打包的乐趣！


