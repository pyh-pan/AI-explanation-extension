// API 调用工具
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
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API 调用失败');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  },

  // 调用 Gemini API
  async callGemini(config, text) {
    const endpoint = config.apiEndpoint || 'https://generativelanguage.googleapis.com';
    const prompt = this.generatePrompt(text);

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
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API 调用失败');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
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

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIManager;
}
