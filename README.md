# AI 划词解释 Chrome 插件

浏览器划词 AI 解释插件，支持**上下文感知**，AI 能够理解网页内容并给出更准确的解释。

## ✨ 核心特性

- **智能划词**：选中文字，自动显示"AI 解释"按钮
- **上下文感知**：自动提取网页内容，AI 结合上下文解释
- **多模型支持**：OpenAI (GPT-4o, GPT-4o Mini, GPT-4, GPT-3.5)、Gemini (1.5 Pro/Flash, Pro) 和 GLM (智谱 AI)
- **Google 设计语言**：简洁优雅的淡蓝色主题界面
- **模板管理**：编辑预设模板、创建自定义模板、另存为新模板
- **隐私安全**：数据本地存储，不上传第三方服务器

## 📦 安装

1. 克隆项目：`git clone https://github.com/pyh-pan/AI-explanation-extension.git`
2. 打开 Chrome：`chrome://extensions/`
3. 启用"开发者模式"
4. 点击"加载已解压的扩展程序"，选择项目目录

## 🚀 快速开始

### 1. 配置 API Key

点击插件图标，进入设置页面：
- 选择 AI 提供商（OpenAI、Gemini 或 GLM）
- 输入 API Key（[OpenAI](https://platform.openai.com/api-keys) | [Gemini](https://makersuite.google.com/app/apikey) | [GLM](https://open.bigmodel.cn/usercenter/apikeys)）
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

**支持的模型：**
- **OpenAI**: GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo
- **Gemini**: Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini Pro
- **GLM**: GLM-4.7, GLM-4, GLM-4 Flash, GLM-3 Turbo

### 上下文配置

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| 启用上下文感知 | 提取网页内容 | ✅ |
| 上下文模式 | Token 预算 | 标准 (6K) |
| Prompt 模板 | 解释模板 | 默认 |

**上下文模式：**
- 经济 (~2K tokens)：简单词汇、快速浏览
- 标准 (~6K tokens)：日常阅读、平衡选择 ⭐
- 精确 (~12K tokens)：复杂概念、专业文档

### Prompt 模板配置

插件提供了完整的 Prompt 模板管理功能：

**预设模板：**
- 默认模板（通用解释）
- 技术文档模板
- 学术论文模板
- 代码理解模板

**自定义模板：**
- 编辑预设模板：点击"编辑"按钮修改预设模板
- 另存为新模板：将当前模板另存为新的自定义模板
- 新建模板：点击"新建模板"按钮创建全新的自定义模板
- 删除模板：在自定义模板列表中删除不需要的模板

**可用变量：**
- `{{pageTitle}}` - 网页标题
- `{{pageUrl}}` - 网页链接
- `{{context}}` - 上下文内容
- `{{selectedText}}` - 选中的文本
- `{{contextTokens}}` - 上下文 token 数

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
│   │   └── content.css        # 弹窗样式
│   ├── background/            # 后台服务
│   │   └── service-worker.js  # API 调用、Prompt 模板
│   ├── options/               # 设置页面
│   │   ├── options.html       # 配置界面
│   │   ├── options.js         # 配置逻辑
│   │   └── options.css        # 配置样式
│   └── assets/
│       └── icons/           # 扩展图标
├── README.md                # 本文档（用户文档）
└── CLAUDE.md               # 开发文档（技术细节）
```

## 🔧 技术栈

- **Manifest V3** - Chrome 扩展最新标准
- **原生 JavaScript** - 无需构建，轻量高效
- **Chrome APIs** - Storage, Runtime Messaging
- **Google Design Language** - 界面设计

## 📝 版本历史

### v2.1.0 (2026-02-24) 🎉

**🆕 Prompt 模板管理**
- 编辑预设模板功能
- 创建自定义模板功能
- 另存为新模板功能
- 自定义模板列表管理（删除）
- 模板预览功能增强

**🔧 技术改进**
- 修复 GitHub 仓库链接
- 后台服务支持动态加载自定义模板
- 模板存储优化

### v2.0.0 (2025-02-13) 🎉

**🎨 前端重构**
- 采用 Google Translator 设计风格
- 淡蓝色主题配色（#1a73e8）
- Material Design 3.0 圆角按钮
- 微妙阴影系统、流畅动画

**✨ 上下文感知**
- 智能内容截断算法
- 三种模式：经济/标准/精确
- 自动降级机制

**📝 Prompt 模板**
- 4 种预设模板
- 自定义模板编辑器
- 变量替换系统

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
A: 设置页面 → Prompt 模板配置 → 编辑模板或新建模板 → 使用变量编辑 → 预览 → 保存

**Q: 开发相关的问题？**
A: 请查看 [CLAUDE.md](CLAUDE.md) 开发文档获取技术细节和调试信息

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

## 🔗 相关链接

- [GitHub 仓库](https://github.com/pyh-pan/AI-explanation-extension)
- [开发文档 (CLAUDE.md)](CLAUDE.md)
- [获取 OpenAI API Key](https://platform.openai.com/api-keys)
- [获取 Gemini API Key](https://makersuite.google.com/app/apikey)
- [获取 GLM API Key](https://open.bigmodel.cn/usercenter/apikeys)
