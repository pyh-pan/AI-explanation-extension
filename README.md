# AI 划词解释 Chrome 插件

一款浏览器划词AI解释插件，帮助用户在浏览网页时快速获取选中内容的AI智能解释。

## 功能特性

- **划词识别**：在网页上选中任意文字，自动显示"AI解释"按钮
- **智能解释**：点击按钮即可获取AI对选中内容的详细解释
- **多模型支持**：支持 OpenAI (GPT-4o, GPT-4o Mini 等) 和 Gemini (Google AI)
- **自定义配置**：支持自定义 API Endpoint、模型参数等
- **安全存储**：API Key 本地加密存储，不上传至任何服务器
- **Markdown 渲染**：支持代码高亮、列表等 Markdown 格式

## 安装方法

### 开发模式安装

1. 克隆或下载本项目
```bash
git clone <repository-url>
cd ai-explanation-extension
```

2. 生成图标文件（参考 [src/assets/icons/README.md](src/assets/icons/README.md)）

3. 打开 Chrome 浏览器，进入扩展管理页面
   - 方式一：在地址栏输入 `chrome://extensions/`
   - 方式二：菜单 → 更多工具 → 扩展程序

4. 开启"开发者模式"（右上角开关）

5. 点击"加载已解压的扩展程序"

6. 选择项目根目录

7. 插件安装完成，点击插件图标进入设置页面

## 使用说明

### 首次配置

1. 点击浏览器工具栏中的插件图标
2. 在设置页面中：
   - 选择 AI 提供商（OpenAI 或 Gemini）
   - 输入你的 API Key（必填）
   - 选择要使用的模型
   - 可选：调整高级参数（Temperature、Max Tokens）
3. 点击"保存配置"
4. 点击"测试连接"验证配置是否正确

### 获取 API Key

**OpenAI API Key:**
- 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
- 登录后创建新的 API Key

**Gemini API Key:**
- 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
- 创建新的 API Key

### 日常使用

1. 在任意网页上用鼠标选中你想要解释的文字
2. 选区右上方会出现"AI解释"按钮
3. 点击按钮，等待AI分析
4. 解释结果会以弹窗形式展示，支持 Markdown 格式
5. 可以点击"复制"按钮复制解释内容

### 快捷键

- `ESC` - 关闭解释弹窗

## 项目结构

```
ai-explanation-extension/
├── manifest.json              # Chrome 扩展配置文件
├── package.json               # 项目配置
├── README.md                  # 项目说明
├── PRD.md                     # 产品需求文档
├── src/
│   ├── content/               # 内容脚本
│   │   ├── content.js         # 划词识别、按钮、弹窗逻辑
│   │   └── content.css        # 弹窗样式
│   ├── background/            # 后台服务
│   │   └── service-worker.js  # API 调用、消息通信
│   ├── options/               # 设置页面
│   │   ├── options.html       # 设置页面结构
│   │   ├── options.js         # 设置页面逻辑
│   │   └── options.css        # 设置页面样式
│   ├── utils/                 # 工具函数
│   │   ├── api.js             # API 请求封装
│   │   ├── storage.js         # 存储管理
│   │   └── markdown.js        # Markdown 渲染
│   └── assets/                # 静态资源
│       └── icons/             # 图标文件
└── tests/                     # 测试文件（待添加）
```

## 技术栈

- **Manifest V3** - Chrome 扩展最新标准
- **原生 JavaScript** - 无需构建工具，轻量高效
- **Chrome Storage API** - 本地数据存储
- **Chrome Runtime Messaging** - 组件间通信
- **Fetch API** - HTTP 请求

## 支持的 AI 模型

### OpenAI
- GPT-4o
- GPT-4o Mini
- GPT-4 Turbo
- GPT-3.5 Turbo

### Gemini (Google AI)
- Gemini 1.5 Pro
- Gemini 1.5 Flash
- Gemini Pro

## 配置选项

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| Provider | AI 提供商 | openai |
| API Key | API 访问密钥 | - |
| API Endpoint | API 端点地址 | 官方地址 |
| Model | 模型名称 | gpt-4o-mini |
| Temperature | 随机性控制 (0-2) | 0.7 |
| Max Tokens | 最大生成长度 | 1000 |

## 开发说明

### 本地开发

1. 修改代码后，在 `chrome://extensions/` 页面点击刷新按钮
2. 或者点击"重新加载"按钮重新加载扩展

### 调试

**Content Script 调试:**
1. 在任意网页上按 F12 打开开发者工具
2. 切换到 "Console" 标签
3. 可以看到 content.js 的日志输出

**Background Service Worker 调试:**
1. 在 `chrome://extensions/` 页面
2. 找到本插件，点击 "Service Worker" 链接
3. 打开独立的开发者工具窗口

**Options 页面调试:**
1. 在设置页面上按 F12 打开开发者工具

## 常见问题

### 1. 为什么点击"AI解释"按钮没有反应？

- 检查是否已配置 API Key
- 打开浏览器控制台查看错误信息
- 确认网络连接正常

### 2. API 调用超时怎么办？

- 检查网络连接
- 尝试更换 API Endpoint
- 如果使用代理，确保配置正确

### 3. 支持自定义 API 吗？

支持。在设置页面的"API Endpoint"中输入你的自定义地址即可。

### 4. 数据会上传到服务器吗？

不会。所有数据（包括 API Key）都存储在本地浏览器中，不会上传到任何第三方服务器。

### 5. 在某些网站上不工作？

某些网站可能会限制 Content Script 的运行，这是正常的安全限制。

## 隐私政策

- 本插件不收集任何用户数据
- API Key 仅存储在本地浏览器中
- 所有 API 请求直接发送到你配置的 API 端点
- 不进行任何用户行为追踪

## 版本历史

### v1.0.0 (2025-01-24)
- 初始版本发布
- 支持 OpenAI 和 Gemini API
- 基础划词解释功能
- 设置页面

## 后续计划

- [ ] 支持更多 AI 模型（Claude、文心一言等）
- [ ] 自定义提示词模板
- [ ] 历史记录功能
- [ ] 快捷键支持
- [ ] 多语言界面
- [ ] 导出解释结果

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue。

---

**享受使用 AI 划词解释插件！**
