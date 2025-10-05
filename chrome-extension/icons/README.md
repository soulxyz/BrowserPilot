# Icons Directory

## 📝 说明

此目录用于存放Chrome扩展的图标文件。

## 📋 需要的文件

- `icon16.png` - 16x16像素（扩展管理页面）
- `icon48.png` - 48x48像素（扩展管理页面）
- `icon128.png` - 128x128像素（Chrome Web Store）

## 🎨 创建图标

### 在线工具
- [favicon.io](https://favicon.io/) - 生成各种尺寸的图标
- [realfavicongenerator.net](https://realfavicongenerator.net/)

### 设计建议
- 使用简单清晰的图形
- 主题色：紫色渐变（#667eea → #764ba2）
- 可以使用 🤖 emoji 或 MCP 字母
- 确保在小尺寸下清晰可见

## 🔧 临时解决方案

如果暂时没有图标，扩展仍可正常工作，Chrome会显示默认的拼图图标。

## 💡 示例

你可以使用任何PNG图片，只需确保尺寸正确：

```bash
# 使用ImageMagick调整尺寸
convert source.png -resize 16x16 icon16.png
convert source.png -resize 48x48 icon48.png
convert source.png -resize 128x128 icon128.png
```

或使用在线工具批量生成。






