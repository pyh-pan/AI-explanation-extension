# AI 划词解释 Chrome 插件

浏览器划词 AI 解释插件，支持**上下文感知**，AI 能够理解网页内容并给出更准确的解释。

## ✨ 核心特性

- **智能划词**：选中文字，自动显示"AI 解释"按钮
- **上下文感知**：自动提取网页内容，AI 结合上下文解释
- **三层级高亮**：可视化显示 AI 参考的上下文范围
- **多模型支持**：OpenAI (GPT-4o, GPT-4o Mini, GPT-4, GPT-3.5) 和 Gemini (1.5 Pro/Flash, Pro)
- **Google 设计语言**：简洁优雅的淡蓝色主题界面
- **自定义配置**：API Endpoint、模型参数、Prompt 模板
- **隐私安全**：数据本地存储，不上传第三方服务器

## 📦 安装

1. 克隆项目：`git clone <repository-url>`
2. 打开 Chrome：`chrome://extensions/`
3. 启用"开发者模式"
4. 点击"加载已解压的扩展程序"，选择项目目录

## 🚀 快速开始

### 1. 配置 API Key

点击插件图标，进入设置页面：
- 选择 AI 提供商（OpenAI 或 Gemini）
- 输入 API Key（[OpenAI](https://platform.openai.com/api-keys) | [Gemini](https://makersuite.google.com/app/apikey)）
- 选择模型（默认 GPT-4o Mini）
- 点击"保存配置"

### 2. 使用方法

1. 在网页上选中文字
2. 点击出现的"AI 解释"按钮
3. 查看 AI 基于上下文的智能解释
4. 按ESC或点击外部关闭弹窗

## ⚙️ 配置选项

### AI 模型配置

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| Provider | AI 提供商 | OpenAI |
| API Key | API 密钥 | - |
| API Endpoint | 自定义端点 | 官方地址 |
| Model | 模型 | gpt-4o-mini |
| Temperature | 随机性 (0-2) | 0.7 |
| Max Tokens | 最大长度 | 1000 |

### 上下文配置

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| 启用上下文感知 | 提取网页内容 | ✅ |
| 上下文模式 | Token 预算 | 标准 (6K) |
| 启用高亮 | 显示上下文范围 | ✅ |
| Prompt 模板 | 解释模板 | 默认 |

**上下文模式：**
- 经济 (~2K tokens)：简单词汇、快速浏览
- 标准 (~6K tokens)：日常阅读、平衡选择 ⭐
- 精确 (~12K tokens)：复杂概念、专业文档

### Prompt 模板

- **默认模板**：通用解释
- **技术文档**：技术文章专用
- **学术论文**：研究论文专用
- **代码理解**：代码片段专用
- **自定义模板**：支持变量 `{{pageTitle}}` `{{pageUrl}}` `{{context}}` `{{selectedText}}` `{{contextTokens}}`

## 🎨 界面设计

采用 **Google Translator** 设计风格：
- 主色：`#1a73e8` (Google 蓝)
- 圆角卡片、微妙阴影
- Material Design 3.0 风格
- 流畅动画过渡
- 响应式布局

## 🏗️ 项目结构

```
ai-explanation-extension/
├── manifest.json              # Chrome 扩展配置
├── src/
│   ├── content/               # 内容脚本
│   │   ├── content.js         # 划词识别、弹窗
│   │   └── content.css        # 弹窗样式、高亮
│   ├── background/            # 后台服务
│   │   └── service-worker.js  # API 调用、Prompt 模板
│   ├── options/               # 设置页面
│   │   ├── options.html       # 配置界面
│   │   ├── options.js         # 配置逻辑
│   │   └── options.css        # 配置样式
│   └── utils/                 # 工具函数
│       ├── readability.js     # Mozilla Readability
│       ├── content-extractor.js  # 上下文提取
│       ├── api.js             # API 封装
│       ├── storage.js         # 存储管理
│       └── markdown.js        # Markdown 渲染
└── README.md
```

## 🔧 技术栈

- **Manifest V3** - Chrome 扩展最新标准
- **原生 JavaScript** - 无需构建，轻量高效
- **Chrome APIs** - Storage, Runtime Messaging
- **Mozilla Readability** - 智能内容提取
- **Google Design Language** - 界面设计

## 📝 版本历史

### v2.0.0 (2025-02-13) 🎉

**🎨 前端重构**
- 采用 Google Translator 设计风格
- 淡蓝色主题配色（#1a73e8）
- Material Design 3.0 圆角按钮
- 微妙阴影系统、流畅动画
- 优化弹窗尺寸（480px × 70vh）
- 响应式布局改进

**✨ 上下文感知**
- 集成 Mozilla Readability 内容提取
- 三层级上下文高亮（12% / 8% / 5% 透明度）
- 距离优先智能截断算法
- 三种模式：经济/标准/精确
- 5 分钟缓存机制

**📝 Prompt 模板**
- 4 种预设模板
- 自定义模板编辑器
- 变量替换系统
- 实时预览功能

**🔧 技术改进**
- 修复测试连接功能（添加 TEST_CONNECTION 处理）
- 版本号一致性（v2.0.0）
- PDF 文档检测
- 自动降级机制

### v1.0.0 (2025-01-24)
- 初始版本
- OpenAI 和 Gemini 支持
- 基础划词解释

## ❓ 常见问题

**Q: 点击"AI 解释"没反应？**
A: 检查 API Key 是否配置，查看控制台错误信息

**Q: 上下文功能会增加成本吗？**
A: 会增加 token 使用，建议根据场景选择模式：
- 经济模式：成本增加很少
- 标准模式：平衡选择，推荐
- 精确模式：成本较高，解释更准确

**Q: 数据会上传吗？**
A: 不会。所有数据本地存储，API 请求直连你配置的端点

**Q: 某些网站不工作？**
A: 部分网站限制 Content Script，这是正常的安全限制

**Q: 如何自定义 Prompt？**
A: 设置页面 → Prompt 模板 → 自定义模板 → 使用变量编辑 → 预览 → 保存

## 🔐 隐私政策

- 不收集任何用户数据
- API Key 仅本地存储
- 不进行用户行为追踪
- 所有请求直连配置的 API 端点

## 🗺️ 后续计划

- [ ] 支持更多 AI 模型（Claude、文心一言等）
- [ ] 历史记录功能
- [ ] 快捷键支持
- [ ] 多语言界面
- [ ] 导出解释结果

## 📄 许可证

MIT License

---

**享受智能划词解释！** 🎉
