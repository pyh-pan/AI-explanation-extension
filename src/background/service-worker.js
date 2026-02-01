// Background Service Worker - 处理 API 调用

// API 调用管理器
const APIManager = {
  // 生成提示词
  generatePrompt(text) {
    return `你是一个智能助手，请对用户选中的内容提供清晰、简洁、准确的解释。

选中内容：${text}

请从以下维度进行解释：
1. 含义定义（如果适用）
2. 背景知识
3. 相关要点
4. 示例或类比（如有助于理解）

回答要简洁明了，使用Markdown格式，字数控制在200-500字之间。`;
  },

  // 调用 OpenAI API
  async callOpenAI(config, text) {
    const endpoint = config.apiEndpoint || 'https://api.openai.com/v1';
    const prompt = this.generatePrompt(text);

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

  // 调用 Gemini API
  async callGemini(config, text) {
    const endpoint = config.apiEndpoint || 'https://generativelanguage.googleapis.com';
    const prompt = this.generatePrompt(text);

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

  // 根据配置调用相应的 API
  async callAPI(config, text) {
    if (!config.apiKey) {
      throw new Error('请先在设置中配置 API Key');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('请先选择要解释的文字');
    }

    switch (config.provider) {
      case 'openai':
        return await this.callOpenAI(config, text);
      case 'gemini':
        return await this.callGemini(config, text);
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
    maxTokens: 1000
  },

  async getConfig() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['aiConfig'], (result) => {
        const config = result.aiConfig || this.DEFAULT_CONFIG;
        resolve(config);
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
    handleExplainRequest(message.text)
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

// 处理解释请求
async function handleExplainRequest(text) {
  try {
    // 检查是否已配置
    const isConfigured = await StorageManager.isConfigured();
    if (!isConfigured) {
      throw new Error('请先在设置中配置 API Key');
    }

    // 获取配置
    const config = await StorageManager.getConfig();

    // 调用 API
    const result = await APIManager.callAPI(config, text);

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
