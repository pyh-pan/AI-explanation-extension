# AI 划词解释 - 开发文档

> 本文档记录项目的开发过程、技术细节、问题解决方案和相关设计文档。
>
> **用户文档请查看 [README.md](README.md)**

---

## 项目概述

**项目名称：** AI 划词解释 Chrome 扩展

**当前版本：** v2.1.0

**仓库地址：** https://github.com/pyh-pan/AI-explanation-extension

**核心功能：**
- 智能划词识别和 AI 解释
- 上下文感知解释
- 多 AI 模型支持（OpenAI、Gemini、GLM）
- Prompt 模板管理（编辑预设、创建自定义）
- 可拖动和缩放的弹窗界面

---

## 项目结构

```
ai-explanation-extension/
├── manifest.json              # Chrome 扩展配置 (v2.1.0)
├── src/
│   ├── content/               # 内容脚本
│   │   ├── content.js         # 划词识别、弹窗交互
│   │   └── content.css        # 弹窗样式
│   ├── background/            # 后台服务
│   │   └── service-worker.js  # API 调用、Prompt 模板处理
│   ├── options/               # 设置页面
│   │   ├── options.html       # 配置界面
│   │   ├── options.js         # 配置逻辑
│   │   └── options.css        # 配置样式
│   └── assets/
│       └── icons/           # 扩展图标
├── README.md                # 用户文档（项目介绍）
└── CLAUDE.md               # 本文档（开发文档）
```

---

## 版本历史

### v2.1.0 (2026-02-24) 🎉

**新增功能：**
- ✅ Prompt 模板编辑功能
- ✅ 自定义模板管理（创建、编辑、删除）
- ✅ 另存为新模板功能
- ✅ 恢复默认模板功能
- ✅ 模板预览功能

**修复问题：**
- 🔧 修复 GitHub 仓库链接

**技术改进：**
- 后台服务支持动态加载自定义模板
- 模板存储优化（分离预设覆盖和自定义模板）

---

### v2.0.0 (2025-02-13) 🎉

**前端重构：**
- 采用 Google Translator 设计风格
- 淡蓝色主题配色（#1a73e8）
- Material Design 3.0 圆角按钮
- 微妙阴影系统、流畅动画

**上下文感知：**
- 集成 Mozilla Readability 内容提取（已移除）
- 智能内容截断算法
- 三种上下文模式：经济/标准/精确

**Prompt 模板：**
- 4 种预设模板
- 自定义模板编辑器
- 变量替换系统

**技术改进：**
- 修复测试连接功能
- PDF 文档检测
- 自动降级机制

### v1.0.0 (2025-01-24)
- 初始版本
- OpenAI 和 Gemini 支持
- 基础划词解释

---

## 已知问题与解决方案

### 问题 1: 上下文模式不生效

**症状：** 无论选择什么上下文模式（经济/标准/精确），传给 AI 模型的 context 都是一样的。

**根本原因：**
1. content.js 发送给后台服务的消息缺少 `contextMetadata` 字段
2. `cachedConfig` 缓存机制导致设置修改后不会生效
3. `delete` 操作在严格模式下不能删除 `let` 变量

**修复方案：**
1. 将 `let cachedConfig = null;` 改为 `var cachedConfig = null;`
2. 添加 `setupStorageListener()` 监听配置变化
3. 配置改变时设为 `cachedConfig = null` 而不是使用 `delete`
4. 修改 `fetchExplanation()` 只在 context 不为空时才添加 context 和 contextMetadata

**涉及文件：**
- `src/content/content.js`
- `src/background/service-worker.js`

---

### 问题 2: 按钮位置错误

**症状：** 按钮固定在页面右下角，应该显示在选中文本旁边。

**根本原因：** 按钮位置没有根据选区动态计算。

**修复方案：** 修改 `showButton()` 根据选区位置动态计算按钮位置。

**涉及文件：**
- `src/content/content.js`

---

### 问题 3: 拖动/缩放体验不佳

**症状：** 需要点击特定区域才能操作。

**修复方案：**
- 点击弹窗顶部标题栏即可拖动
- 鼠标移至任意边界处即可缩放（右边框、下边框、四角）

**涉及文件：**
- `src/content/content.js`
- `src/content/content.css`

---

### 问题 4: 语法错误 (Extension context invalidated)

**症状：** 严格模式下 `delete` 不能用于 `let` 声明的变量，导致扩展加载失败。

**根本原因：** 在严格模式下 `delete` 不能用于 `let` 声明的变量。

**修复方案：** 改为 `var cachedConfig = null;`

**涉及文件：**
- `src/content/content.js`

---

### 问题 5: 另存为新模板后未显示在下拉列表中

**症状：** 编辑完一个模板并另存为后，并没有显示在可选择模板的列表中。

**根本原因：**
在 `confirmTemplateNameBtn` 的点击事件处理中，调用顺序错误：
```javascript
// 错误的代码
hideTemplateNameModal();  // 这里会把 window.templateNameCallback 设为 null
if (window.templateNameCallback) {  // 此时已经是 null，回调永远不会执行
  window.templateNameCallback(name);
}
```

`hideTemplateNameModal()` 函数会将 `window.templateNameCallback` 设为 `null`，但随后才检查并调用这个回调，导致回调永远不会被执行。

**修复方案：**
在调用 `hideTemplateNameModal()` 之前，先保存回调引用：
```javascript
// 正确的代码
const callback = window.templateNameCallback;  // 先保存回调引用
hideTemplateNameModal();  // 现在可以安全地清除
if (callback) {
  callback(name);  // 使用保存的引用调用回调
}
```

**涉及文件：**
- `src/options/options.js`

### 问题 1: 上下文模式不生效

**症状：** 无论选择什么上下文模式（经济/标准/精确），传给 AI 模型的 context 都是一样的。

**根本原因：**
1. content.js 发送给后台服务的消息缺少 `contextMetadata` 字段
2. `cachedConfig` 缓存机制导致设置修改后不会生效
3. `delete` 操作在严格模式下不能删除 `let` 变量

**修复方案：**
1. 将 `let cachedConfig = null;` 改为 `var cachedConfig = null;`
2. 添加 `setupStorageListener()` 监听配置变化
3. 配置改变时设为 `cachedConfig = null` 而不是使用 `delete`
4. 修改 `fetchExplanation()` 只在 context 不为空时才添加 context 和 contextMetadata

**涉及文件：**
- `src/content/content.js`
- `src/background/service-worker.js`

---

### 问题 2: 按钮位置错误

**症状：** 按钮固定在页面右下角，应该显示在选中文本旁边。

**根本原因：** 按钮位置没有根据选区动态计算。

**修复方案：** 修改 `showButton()` 根据选区位置动态计算按钮位置。

**涉及文件：**
- `src/content/content.js`

---

### 问题 3: 拖动/缩放体验不佳

**症状：** 需要点击特定区域才能操作。

**修复方案：**
- 点击弹窗顶部标题栏即可拖动
- 鼠标移至任意边界处即可缩放（右边框、下边框、四角）

**涉及文件：**
- `src/content/content.js`
- `src/content/content.css`

---

### 问题 4: 语法错误 (Extension context invalidated)

**症状：** 严格模式下 `delete` 不能用于 `let` 声明的变量，导致扩展加载失败。

**根本原因：** 在严格模式下 `delete` 不能用于 `let` 声明的变量。

**修复方案：** 改为 `var cachedConfig = null;`

**涉及文件：**
- `src/content/content.js`

---

## Prompt 模板功能开发

### 功能需求

1. **预设模板编辑功能**
   - 用户可以编辑现有的预设模板
   - 编辑后的模板保存为自定义覆盖版本
   - 用户可以随时恢复默认预设

2. **自定义模板管理功能**
   - 用户可以创建新的自定义模板
   - 用户可以删除自定义模板
   - 用户可以选择使用预设模板或自定义模板

### 数据结构设计

```javascript
{
  aiConfig: {
    promptTemplate: 'template:default' 或 'custom:MyTemplate',

    // 自定义模板存储
    customTemplates: {
      'MyTemplate': '模板内容...',
      'AnotherTemplate': '模板内容...'
    },

    // 预设模板覆盖存储
    presetOverrides: {
      'template:default': '修改后的预设模板内容...',
      'template:technical': '修改后的技术文档模板...'
    }
  }
}
```

### UI 设计

#### 模板选择器区域
```
┌─────────────────────────────────────────────────┐
│ 选择模板                                   │
│ [默认模板 (通用解释) ▼] [编辑] [另存为]  │
└─────────────────────────────────────────────────┘
```

#### 模板编辑器区域
```
┌─────────────────────────────────────────────────┐
│ 编辑: 默认模板（通用解释）       [×]       │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐   │
│ │ [多行文本编辑器]                      │   │
│ └─────────────────────────────────────────┘   │
│                                             │
│ 可用变量: {{pageTitle}} {{pageUrl}} ...      │
│                                             │
│ [保存模板] [恢复默认] [预览模板]            │
└─────────────────────────────────────────────────┘
```

#### 自定义模板列表区域
```
┌─────────────────────────────────────────────────┐
│ 自定义模板                      [新建模板]    │
│                                             │
│ ┌─────────────────────────────────────────┐   │
│ │ MyTemplate                            │   │
│ │ 技术文档模板专用...                    │   │
│ │             [编辑] [删除]              │   │
│ └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### 实现文件清单

#### src/options/options.html
- 添加模板编辑器 UI
- 添加自定义模板列表 UI
- 添加"编辑"、"另存为"、"新建模板"等按钮
- 修复 GitHub 仓库链接

#### src/options/options.js
- 添加自定义模板增删改查函数
- 添加预设模板覆盖保存/恢复函数
- 添加模板列表渲染函数
- 更新模板选择器逻辑

#### src/background/service-worker.js
- 修改 PROMPT_TEMPLATES 加载逻辑
- 添加自定义模板合并逻辑
- 支持从 storage 加载自定义模板

#### src/options/options.css
- 添加模板管理样式
- 添加模态弹窗样式

### 可用变量

- `{{pageTitle}}` - 网页标题
- `{{pageUrl}}` - 网页链接
- `{{context}}` - 上下文内容
- `{{selectedText}}` - 选中的文本
- `{{contextTokens}}` - 上下文 token 数

---

## 技术要点

### Chrome Storage API

```javascript
// 获取配置
chrome.storage.local.get(['aiConfig'], (result) => {
  const config = result.aiConfig || {};
  // 处理配置
});

// 保存配置
chrome.storage.local.set({ aiConfig: config }, () => {
  // 保存完成
});

// 监听变化
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.aiConfig) {
    // 配置变化，重新加载
  }
});
```

### 严格模式变量

- `var` 声明的变量可以被 `delete` 操作
- `let` 声明的变量不能被 `delete` 操作

### 消息格式

```javascript
{
  type: 'EXPLAIN_TEXT',
  text: 选中的文字,
  context: 上下文内容（仅当非空时）,
  contextMetadata: { pageTitle, pageUrl },
  pageUrl: 网页 URL,
  pageTitle: 网页标题
}
```

### 模板加载机制

后台服务监听 `chrome.storage.onChanged` 事件，配置变化时自动重新加载模板，无需重启扩展即可生效。

```javascript
// 后台服务模板加载
async function loadTemplatesFromStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['aiConfig'], (result) => {
      const config = result.aiConfig || {};

      // 加载自定义模板
      customTemplates = config.customTemplates || {};

      // 应用预设模板覆盖
      const presetOverrides = config.presetOverrides || {};
      runtimeTemplates = { ...DEFAULT_PRESET_TEMPLATES };
      for (const [key, value] of Object.entries(presetOverrides)) {
        const templateKey = key.replace('template:', '');
        if (runtimeTemplates[templateKey]) {
          runtimeTemplates[templateKey] = value;
        }
      }

      resolve();
    });
  });
}
```

---

## GLM 模型集成

### 配置步骤

1. 打开 `chrome://extensions/`
2. 找到 "AI 划词解释"
3. 点击"重新加载"按钮
4. 点击插件图标，打开设置页面
5. 选择 **GLM (智谱 AI)** 提供商
6. 点击"获取 GLM API Key"链接
7. 注册或登录 [智谱 AI 开放平台](https://open.bigmodel.cn/usercenter/apikeys)
8. 复制 API Key 并粘贴到设置页面
9. 选择模型（推荐 GLM-4.7）

### 支持的 GLM 模型

- **GLM-4.7** - 最新的推理模型（推荐）
- **GLM-4** - 标准模型
- **GLM-4 Flash** - 快速模型
- **GLM-3 Turbo** - 旧版本模型

### GLM API 特殊处理

GLM-4.7 可能返回 `reasoning_content` 而不是 `content`，需要正确处理：

```javascript
const choice = data.choices[0];
const content = choice.message.reasoning_content || choice.message.content;
return content || choice.message.reasoning_content;
```

---

## 测试流程

### 上下文模式测试

| 上下文模式 | 字符限制 | Token 预估 | 验证方法 |
|-----------|----------|-----------|----------|
| 经济模式 | 2000 | ~2000 tokens | 控制台日志 context length ≤ 2000 |
| 标准模式 | 6000 | ~6000 tokens | 控制台日志 context length ≤ 6000 |
| 精确模式 | 12000 | ~12000 tokens | 控制台日志 context length ≤ 12000 |

### 模板功能测试

1. **编辑预设模板**
   - 选择一个预设模板
   - 点击"编辑"按钮
   - 修改内容并保存
   - 刷新页面验证修改是否保留

2. **新建模板**
   - 点击"新建模板"按钮
   - 输入模板名称
   - 编辑模板内容并保存
   - 验证模板出现在列表中

3. **另存为**
   - 选择任意模板
   - 点击"另存为"按钮
   - 输入新模板名称
   - 验证新模板被创建

4. **删除模板**
   - 在自定义模板列表中点击"删除"按钮
   - 确认删除
   - 验证模板被移除

5. **恢复默认**
   - 编辑预设模板后
   - 点击"恢复默认"按钮
   - 验证内容恢复到原始预设

### 调试技巧

**浏览器控制台检查：**
- 按 F12 打开开发者工具
- 查看 Console 标签中的日志
- 搜索 `[Content]` 和 `[Background Service Worker]`

**查看网络请求：**
- 在 Network 标签中查看请求详情
- 确认 API 请求是否成功

**查看配置存储：**
- 打开 Application 标签
- 左侧选择 Local Storage
- 查看 `aiConfig` 键值

---

## 常见问题

### Q: 测试连接失败？
**A:**
1. 确认选择了正确的提供商
2. 检查 API Key 是否正确
3. 查看浏览器控制台错误信息

### Q: 解释内容不相关？
**A:**
- 可能上下文太大（超过限制）
- 尝试选择"经济模式"降低上下文大小
- 或者关闭上下文感知功能

### Q: 弹窗不显示？
**A:**
- 检查是否选中了文字（文字高亮后）
- 尝试重新加载扩展
- 检查浏览器控制台是否有错误

### Q: 无法拖动或缩放？
**A:**
- 确认点击了顶部标题栏进行拖动
- 确认鼠标移至边界处进行缩放
- 检查浏览器控制台是否有错误

### Q: Extension context invalidated 错误？
**A:**
- 这是之前 `let` 和 `delete` 冲突导致的问题
- v2.0.0 已修复，更新到最新版本即可

---

## 开发环境设置

### 语法检查

```bash
# 检查 JavaScript 语法
node -c src/options/options.js
node -c src/background/service-worker.js
node -c src/content/content.js

# 检查 JSON 语法
python3 -m json.tool < manifest.json
```

### 扩展开发流程

1. **修改代码**
2. **重新加载扩展**：在 `chrome://extensions/` 点击刷新按钮
3. **测试功能**
4. **查看控制台**：按 F12 查看错误和日志
5. **修复问题**：根据控制台信息调试

---

## 相关资源

- [GitHub 仓库](https://github.com/pyh-pan/AI-explanation-extension)
- [OpenAI API Keys](https://platform.openai.com/api-keys)
- [Gemini API Keys](https://makersuite.google.com/app/apikey)
- [GLM API Keys](https://open.bigmodel.cn/usercenter/apikeys)
- [Chrome Extensions 文档](https://developer.chrome.com/docs/extensions/mv3/)

---

## 待办事项

- [ ] 支持更多 AI 模型（Claude、文心一言等）
- [ ] 历史记录功能
- [ ] 快捷键支持
- [ ] 多语言界面
- [ ] 导出解释结果

---

**最后更新：** 2026-02-24
