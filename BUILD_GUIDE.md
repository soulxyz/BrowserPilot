# 🔨 MCP Browser Control - 打包指南

**版本**: v1.1.0  
**更新时间**: 2025-10-04

---

## 📦 打包说明

本项目使用 `pkg` 将Node.js应用打包成单个可执行文件，无需用户安装Node.js即可运行。

### 打包优势

| 优势 | 说明 |
|------|------|
| ✅ **零依赖** | 用户无需安装Node.js |
| ✅ **体积小** | ~30-40MB（使用GZip压缩） |
| ✅ **即开即用** | 双击运行，无需配置 |
| ✅ **跨平台** | 支持Windows/Mac/Linux |
| ✅ **易分发** | 单个exe文件+扩展文件夹 |

---

## 🚀 快速打包

### 1. 安装依赖

```bash
npm install
```

这会安装：
- `ws` - WebSocket库
- `pkg` - 打包工具

### 2. 打包Windows版本

```bash
npm run build
```

或者：

```bash
npm run build:win
```

**输出**: `dist/MCP-Browser-Win.exe` (~35MB)

### 3. 创建完整发布包

```bash
npm run package
```

这会：
1. 打包exe文件
2. 复制chrome-extension文件夹
3. 复制README和配置示例
4. 创建使用说明
5. 生成 `dist/release/` 发布目录

---

## 🎯 所有打包命令

```bash
# Windows版本（推荐）
npm run build:win

# Mac版本
npm run build:mac

# Linux版本
npm run build:linux

# 所有平台
npm run build:all

# 完整发布包（Windows）
npm run package
```

---

## 📊 打包配置

### package.json配置

```json
{
  "pkg": {
    "assets": [
      "node_modules/ws/**/*"
    ],
    "targets": ["node18-win-x64"],
    "outputPath": "dist",
    "compress": "GZip"
  }
}
```

### 配置说明

| 选项 | 说明 |
|------|------|
| `assets` | 需要打包的资源文件 |
| `targets` | 目标平台（node18-win-x64） |
| `outputPath` | 输出目录 |
| `compress` | 压缩方式（GZip） |

---

## 📁 打包文件结构

### 编译后目录

```
dist/
├── MCP-Browser-Win.exe        # Windows可执行文件 (~35MB)
├── MCP-Browser-Mac            # Mac可执行文件
├── MCP-Browser-Linux          # Linux可执行文件
└── release/                   # 发布包目录
    ├── MCP-Browser.exe
    ├── chrome-extension/
    ├── README.md
    ├── mcp.json.example
    └── 使用说明.txt
```

---

## 🔧 技术细节

### pkg原理

`pkg` 将Node.js和你的应用打包成单个可执行文件：

```
┌─────────────────────────────────┐
│  MCP-Browser.exe                │
│                                 │
│  ┌─────────────────────────┐   │
│  │  Node.js Runtime        │   │
│  │  (v18.x)                │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  Your Application       │   │
│  │  - server.js            │   │
│  │  - ws module            │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

### 文件大小优化

| 优化项 | 大小 | 说明 |
|--------|------|------|
| Node.js Runtime | ~25MB | 必需 |
| WebSocket (ws) | ~5MB | 依赖 |
| 应用代码 | ~1MB | server.js |
| GZip压缩 | -20% | 启用压缩 |
| **总计** | **~30-40MB** | 最终大小 |

### 为什么不更小？

- Node.js运行时占用大部分空间（~25MB）
- 已经使用GZip压缩
- 相比完整Node.js安装（~50MB）已经很小
- 可以考虑使用Bun或Deno（更小的运行时）

---

## 🎨 自定义打包

### 修改目标平台

编辑 `package.json`:

```json
{
  "pkg": {
    "targets": [
      "node18-win-x64",    // Windows 64位
      "node18-macos-x64",  // Mac Intel
      "node18-macos-arm64", // Mac M1/M2
      "node18-linux-x64"   // Linux 64位
    ]
  }
}
```

### 修改压缩方式

```json
{
  "pkg": {
    "compress": "Brotli"  // 或 "GZip" 或 "None"
  }
}
```

### 添加图标（Windows）

1. 准备 `icon.ico` 文件
2. 使用 `rcedit` 工具添加图标：

```bash
npm install -g rcedit
rcedit dist/MCP-Browser-Win.exe --set-icon icon.ico
```

---

## 📦 发布流程

### 1. 更新版本号

```bash
# 编辑 package.json
"version": "1.1.0"
```

### 2. 构建发布包

```bash
npm run package
```

### 3. 测试可执行文件

```bash
cd dist/release
MCP-Browser.exe --stdio-only
```

### 4. 创建ZIP压缩包

```bash
# 压缩 dist/release 目录
# 命名：MCP-Browser-Control-v1.1.0-Win64.zip
```

### 5. 发布

- 上传到GitHub Releases
- 提供下载链接
- 更新README

---

## ✅ 打包检查清单

打包前确认：

- [ ] 所有功能测试通过
- [ ] 更新版本号
- [ ] 更新README和文档
- [ ] 运行 `npm run package`
- [ ] 测试可执行文件
- [ ] 测试Cursor配置
- [ ] 测试Chrome扩展连接
- [ ] 创建ZIP压缩包
- [ ] 准备发布说明

---

## 🔍 故障排查

### 问题1: 打包失败

**错误**: `Error: Cannot find module 'ws'`

**解决**:
```bash
npm install
npm run build
```

### 问题2: exe文件太大

**检查**:
- 是否启用压缩（compress: "GZip"）
- 是否打包了不必要的文件

**优化**:
```json
{
  "pkg": {
    "assets": ["node_modules/ws/**/*"],  // 只打包必要的
    "compress": "Brotli"  // 使用更好的压缩
  }
}
```

### 问题3: exe运行报错

**检查**:
- 是否打包了所有依赖
- 是否有动态require（pkg不支持）
- 查看日志文件 `debug_mcp_server.log`

---

## 🎯 用户安装流程

### Windows用户

1. **下载发布包**
   ```
   MCP-Browser-Control-v1.1.0-Win64.zip
   ```

2. **解压到任意目录**
   ```
   C:\Tools\MCP-Browser\
   ├── MCP-Browser.exe
   ├── chrome-extension/
   └── ...
   ```

3. **配置Cursor**
   ```json
   {
     "mcpServers": {
       "browser-control": {
         "command": "C:\\Tools\\MCP-Browser\\MCP-Browser.exe",
         "args": ["--stdio-only"]
       }
     }
   }
   ```

4. **安装Chrome扩展**
   - 加载 `chrome-extension` 文件夹

5. **完成！**

---

## 📈 未来优化方向

1. **更小的体积**
   - 使用Bun运行时（~15MB）
   - 使用Deno编译（single binary）

2. **自动更新**
   - 集成自动更新功能
   - 版本检测和提示

3. **图形界面**
   - Electron包装
   - 系统托盘图标

4. **签名**
   - 代码签名（避免Windows警告）
   - 证书申请

---

## 🎉 总结

使用pkg打包后：
- ✅ 体积小（~35MB）
- ✅ 易分发
- ✅ 用户友好
- ✅ 跨平台

**现在就可以打包了！**

```bash
npm install
npm run package
```

🚀 享受打包的乐趣！


