// Background Service Worker - 处理 API 调用

// 预设 Prompt 模板库
const PROMPT_TEMPLATES = {
  default: `你是一个智能助手，请基于网页内容的上下文，对用户选中的内容提供准确、深入的解释。

【网页信息】
标题: {{pageTitle}}
链接: {{pageUrl}}

【上下文内容】
{{context}}

【用户选中的内容】
{{selectedText}}

请基于上述上下文，从以下维度解释选中的内容：
1. 在当前语境中的含义
2. 背景和上下文信息
3. 相关要点和细节
4. 如果是专业术语，结合语境解释

**重要提示:**
- 优先结合上下文进行解释
- 如果上下文不足，可以参考通用知识
- 使用 Markdown 格式
- 字数控制在 300-600 字之间`,

  technical: `你是一个技术文档解读助手，请基于上下文解释技术概念。

【技术文档】
标题: {{pageTitle}}
链接: {{pageUrl}}

【技术上下文】
{{context}}

【待解释的技术术语/概念】
{{selectedText}}

请提供：
1. 该技术术语在当前文档中的具体含义
2. 相关的技术背景和原理
3. 实际应用场景和示例
4. 相关技术栈和工具

使用 Markdown 格式，尽可能详细和准确。`,

  academic: `你是一个学术研究助手，请基于论文上下文解释学术概念。

【论文信息】
标题: {{pageTitle}}
链接: {{pageUrl}}

【研究上下文】
{{context}}

【待解释的学术概念/术语】
{{selectedText}}

请从学术角度解释：
1. 该概念在当前研究语境中的定义
2. 相关的理论背景和研究现状
3. 该概念在论文中的作用和重要性
4. 相关的研究者和参考文献

使用学术化语言，Markdown 格式。`,

  code: `你是一个代码理解助手，请基于代码上下文解释代码片段。

【代码文件】
{{pageTitle}}
链接: {{pageUrl}}

【代码上下文】
{{context}}

【选中的代码】
{{selectedText}}

请解释：
1. 这段代码的具体功能
2. 使用的技术和算法
3. 输入参数和返回值
4. 可能的边界情况和注意事项

使用 Markdown 代码块格式，如果相关可以提供改进建议。`
};

// API 调用管理器
const APIManager = {
  /**
   * 生成提示词 - 支持上下文和自定义模板
   */
  generatePrompt(text, contextData = null, config = {}) {
    const { context, contextMetadata } = contextData || {};

    // 如果没有上下文，降级到简单模式
    if (!context || !contextMetadata) {
      return this.generateSimplePrompt(text);
    }

    // 获取模板（自定义或预设）
    let template = config.promptTemplate;
    if (!template || typeof template !== 'string') {
      template = PROMPT_TEMPLATES.default;
    } else if (template.startsWith('template:')) {
      // 使用预设模板
      const templateKey = template.replace('template:', '');
      template = PROMPT_TEMPLATES[templateKey] || PROMPT_TEMPLATES.default;
    }

    // 替换模板变量
    return this.renderTemplate(template, {
      pageTitle: contextMetadata.pageTitle || '未知',
      pageUrl: contextMetadata.pageUrl || '未知',
      context: context,
      selectedText: text,
      contextTokens: contextMetadata.totalTokens || 0
    });
  },

  /**
   * 渲染模板 - 安全替换变量
   */
  renderTemplate(template, variables) {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      // 转义特殊字符
      const safeValue = this.escapeForTemplate(String(value || ''));
      result = result.split(placeholder).join(safeValue);
    }

    return result;
  },

  /**
   * 转义模板内容
   */
  escapeForTemplate(text) {
    // 转义可能导致模板语法错误的字符
    return text
      .replace(/{{/g, '\\{\\{')
      .replace(/}}/g, '\\}\\}')
      .replace(/\n/g, '\\n')
      .slice(0, 50000);  // 限制长度
  },

  /**
   * 简单模式 prompt（无上下文）
   */
  generateSimplePrompt(text) {
    return `你是一个智能助手，请对用户选中的内容提供清晰、简洁、准确的解释。

选中内容：${text}

请从以下维度进行解释：
1. 含义定义（如果适用）
2. 背景知识
3. 相关要点
4. 示例或类比（如有助于理解）

回答要简洁明了，使用Markdown格式，字数控制在200-500字之间。`;
  },

  /**
   * 调用 OpenAI API - 支持自定义 prompt
   */
  async callOpenAI(config, text, customPrompt = null) {
    const endpoint = config.apiEndpoint || 'https://api.openai.com/v1';
    const prompt = customPrompt || this.generatePrompt(text);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

    try {
      const response = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: config.temperature || 0.7,
          max_tokens: config.maxTokens || 1000
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `API 错误: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('请求超时，请稍后重试');
      }
      throw error;
    }
  },

  /**
   * 调用 Gemini API - 支持自定义 prompt
   */
  async callGemini(config, text, customPrompt = null) {
    const endpoint = config.apiEndpoint || 'https://generativelanguage.googleapis.com';
    const prompt = customPrompt || this.generatePrompt(text);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(
        `${endpoint}/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: config.temperature || 0.7,
              maxOutputTokens: config.maxTokens || 1000
            }
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `API 错误: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('请求超时，请稍后重试');
      }
      throw error;
    }
  },

  /**
   * 根据配置调用相应的 API - 支持上下文
   */
  async callAPI(config, text, contextData = null, customPrompt = null) {
    if (!config.apiKey) {
      throw new Error('请先在设置中配置 API Key');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('请先选择要解释的文字');
    }

    // 生成包含上下文的 prompt
    const prompt = customPrompt || this.generatePrompt(text, contextData, config);

    switch (config.provider) {
      case 'openai':
        return await this.callOpenAI(config, text, prompt);
      case 'gemini':
        return await this.callGemini(config, text, prompt);
      default:
        throw new Error('不支持的 AI 提供商');
    }
  }
};

// 存储管理
const StorageManager = {
  DEFAULT_CONFIG: {
    provider: 'openai',
    apiKey: '',
    apiEndpoint: '',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 1000,
    // 新增：上下文配置
    useContext: true,              // 启用上下文感知
    contextMode: 'standard',       // economic/standard/precise
    enableHighlight: true,         // 启用高亮
    promptTemplate: 'template:default'  // 默认模板
  },

  async getConfig() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['aiConfig'], (result) => {
        const config = result.aiConfig || this.DEFAULT_CONFIG;
        // 合并默认配置，确保新增字段有值
        resolve({ ...this.DEFAULT_CONFIG, ...config });
      });
    });
  },

  async isConfigured() {
    const config = await this.getConfig();
    return !!(config.apiKey);
  }
};

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  if (message.type === 'EXPLAIN_TEXT') {
    handleExplainRequest(message)
      .then(result => {
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('Explain error:', error);
        sendResponse({ success: false, error: error.message });
      });

    // 返回 true 表示异步响应
    return true;
  }

  if (message.type === 'GET_CONFIG') {
    StorageManager.getConfig().then(config => {
      sendResponse({ success: true, config });
    });
    return true;
  }

  if (message.type === 'SAVE_CONFIG') {
    chrome.storage.local.set({ aiConfig: message.config }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

/**
 * 处理解释请求 - 支持上下文
 */
async function handleExplainRequest(message) {
  try {
    // 检查是否已配置
    const isConfigured = await StorageManager.isConfigured();
    if (!isConfigured) {
      throw new Error('请先在设置中配置 API Key');
    }

    // 获取配置
    const config = await StorageManager.getConfig();

    // 构建上下文数据
    const contextData = message.context ? {
      context: message.context,
      contextMetadata: message.contextMetadata
    } : null;

    // 调用 API
    const result = await APIManager.callAPI(
      config,
      message.text,
      contextData,
      message.promptTemplate
    );

    return result;
  } catch (error) {
    throw error;
  }
}

// 插件安装时
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('AI划词解释插件已安装');
    // 打开设置页面
    chrome.runtime.openOptionsPage();
  }
});

// Service Worker 激活时
self.addEventListener('activate', () => {
  console.log('Service Worker activated');
});

console.log('Background Service Worker loaded');
