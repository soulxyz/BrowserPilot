/**
 * 创建发布包
 * 将exe和chrome-extension打包成zip
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 开始创建发布包...\n');

const version = require('../package.json').version;
const distDir = path.join(__dirname, '..', 'dist');
const releaseDir = path.join(distDir, 'release');

// 创建release目录
if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
  console.log('✅ 创建release目录');
}

// 复制文件到release目录
const filesToCopy = [
  { src: path.join(distDir, 'MCP-Browser-Win.exe'), dest: 'MCP-Browser.exe' },
  { src: path.join(__dirname, '..', 'chrome-extension'), dest: 'chrome-extension' },
  { src: path.join(__dirname, '..', 'README.md'), dest: 'README.md' },
  { src: path.join(__dirname, '..', '.cursor', 'mcp.json'), dest: 'mcp.json.example' }
];

console.log('📋 复制文件到release目录...');

// 复制文件
filesToCopy.forEach(({ src, dest }) => {
  const destPath = path.join(releaseDir, dest);
  
  if (fs.existsSync(src)) {
    if (fs.statSync(src).isDirectory()) {
      // 复制目录
      copyDir(src, destPath);
      console.log(`  ✓ ${dest}/`);
    } else {
      // 复制文件
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(src, destPath);
      console.log(`  ✓ ${dest}`);
    }
  } else {
    console.log(`  ⚠ ${src} 不存在，跳过`);
  }
});

// 创建使用说明
const usageText = `# MCP Browser Control - 使用说明

版本: v${version}

## 快速开始

### 1. 配置Cursor

在项目根目录创建 \`.cursor/mcp.json\` 文件：

\`\`\`json
{
  "mcpServers": {
    "browser-control": {
      "command": "完整路径\\\\MCP-Browser.exe",
      "args": ["--stdio-only"]
    }
  }
}
\`\`\`

**注意**: 将"完整路径"替换为实际的exe文件路径，例如：
\`\`\`
"command": "D:\\\\Tools\\\\MCP-Browser\\\\MCP-Browser.exe"
\`\`\`

### 2. 安装Chrome扩展

1. 打开Chrome浏览器，访问 \`chrome://extensions/\`
2. 启用右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 \`chrome-extension\` 文件夹
5. 扩展安装完成

### 3. 重启Cursor

完全退出Cursor并重新打开，使配置生效。

### 4. 连接扩展

1. Cursor启动后会自动打开管理页面
2. 在管理页面查看WebSocket端口（通常是9222）
3. 点击Chrome工具栏的扩展图标
4. 输入 \`ws://localhost:9222\` 并连接

## 目录结构

\`\`\`
MCP-Browser-Control-v${version}/
├── MCP-Browser.exe          - 服务器可执行文件
├── chrome-extension/        - Chrome扩展文件夹
├── README.md                - 项目说明
├── mcp.json.example         - Cursor配置示例
└── 使用说明.txt             - 本文件
\`\`\`

## 常见问题

### Q: 端口被占用怎么办？
A: 服务器会自动检测并使用下一个可用端口（9223, 9224...），管理页面会显示实际端口。

### Q: 如何验证是否正常工作？
A: 在Cursor中按 Ctrl+Shift+U，选择"MCP Logs"查看连接状态。

### Q: Chrome扩展无法连接？
A: 确保：
1. MCP服务器正在运行（Cursor已启动）
2. WebSocket端口正确（查看管理页面）
3. 防火墙允许本地连接

## 更多信息

- GitHub: https://github.com/your-repo
- 文档: README.md
- 问题反馈: GitHub Issues

---

享受用AI控制浏览器的乐趣！🎉
`;

fs.writeFileSync(path.join(releaseDir, '使用说明.txt'), usageText, 'utf8');
console.log('  ✓ 使用说明.txt');

// 计算文件大小
const exeSize = fs.statSync(path.join(releaseDir, 'MCP-Browser.exe')).size;
const exeSizeMB = (exeSize / 1024 / 1024).toFixed(2);

console.log('\n📊 发布包信息:');
console.log(`  版本: v${version}`);
console.log(`  可执行文件大小: ${exeSizeMB} MB`);
console.log(`  位置: ${releaseDir}`);

console.log('\n✅ 发布包创建完成！');
console.log(`\n📦 下一步: 将 ${releaseDir} 打包成zip文件`);

// 辅助函数：递归复制目录
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}


