# 图标说明

本目录需要包含以下 PNG 图标文件：

- icon16.png - 16x16 像素
- icon48.png - 48x48 像素
- icon128.png - 128x128 像素

## 生成图标

你可以使用以下方法生成 PNG 图标：

### 方法 1: 在线工具
访问 https://www.favicon-generator.org/ 或类似的在线图标生成工具，上传 icon.svg 并生成不同尺寸的 PNG 文件。

### 方法 2: 使用 ImageMagick
```bash
cd src/assets/icons
convert -background none -density 300 icon.svg -resize 16x16 icon16.png
convert -background none -density 300 icon.svg -resize 48x48 icon48.png
convert -background none -density 300 icon.svg -resize 128x128 icon128.png
```

### 方法 3: 使用 Figma/Sketch
1. 打开 icon.svg
2. 导出为不同尺寸的 PNG 文件

### 临时方案
在开发阶段，你可以使用任何 128x128 的 PNG 图片作为临时图标，只要确保文件名正确即可。
