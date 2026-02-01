// 存储管理工具
const StorageManager = {
  // 默认配置
  DEFAULT_CONFIG: {
    provider: 'openai', // openai 或 gemini
    apiKey: '',
    apiEndpoint: '',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 1000
  },

  // 获取配置
  async getConfig() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['aiConfig'], (result) => {
        const config = result.aiConfig || this.DEFAULT_CONFIG;
        resolve(config);
      });
    });
  },

  // 保存配置
  async saveConfig(config) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ aiConfig: config }, () => {
        resolve(true);
      });
    });
  },

  // 检查是否已配置
  async isConfigured() {
    const config = await this.getConfig();
    return !!(config.apiKey);
  }
};

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
