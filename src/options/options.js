// Options 页面逻辑

document.addEventListener('DOMContentLoaded', () => {
  // DOM 元素
  const providerInputs = document.querySelectorAll('input[name="provider"]');
  const apiKeyInput = document.getElementById('apiKey');
  const toggleApiKeyBtn = document.getElementById('toggleApiKey');
  const apiEndpointInput = document.getElementById('apiEndpoint');
  const modelSelect = document.getElementById('model');
  const openaiModels = document.getElementById('openai-models');
  const geminiModels = document.getElementById('gemini-models');
  const toggleAdvancedBtn = document.getElementById('toggleAdvanced');
  const advancedSettings = document.getElementById('advancedSettings');
  const temperatureInput = document.getElementById('temperature');
  const tempValueSpan = document.getElementById('tempValue');
  const maxTokensInput = document.getElementById('maxTokens');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const statusMessage = document.getElementById('statusMessage');

  // 默认配置
  let currentConfig = {
    provider: 'openai',
    apiKey: '',
    apiEndpoint: '',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 1000
  };

  // 加载已保存的配置
  loadConfig();

  // 监听提供商切换
  providerInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      const provider = e.target.value;
      currentConfig.provider = provider;
      updateModelOptions(provider);
    });
  });

  // 监听 API Key 显示/隐藏
  toggleApiKeyBtn.addEventListener('click', () => {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleApiKeyBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      `;
    } else {
      apiKeyInput.type = 'password';
      toggleApiKeyBtn.innerHTML = `
        <svg class="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      `;
    }
  });

  // 监听高级设置切换
  toggleAdvancedBtn.addEventListener('click', () => {
    const isHidden = advancedSettings.style.display === 'none';
    advancedSettings.style.display = isHidden ? 'block' : 'none';
    toggleAdvancedBtn.querySelector('svg').style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
  });

  // 监听 Temperature 变化
  temperatureInput.addEventListener('input', (e) => {
    tempValueSpan.textContent = e.target.value;
    currentConfig.temperature = parseFloat(e.target.value);
  });

  // 监听保存按钮
  saveBtn.addEventListener('click', saveConfig);

  // 监听测试按钮
  testBtn.addEventListener('click', testConnection);

  // 加载配置
  function loadConfig() {
    chrome.storage.local.get(['aiConfig'], (result) => {
      if (result.aiConfig) {
        currentConfig = { ...currentConfig, ...result.aiConfig };
        applyConfigToUI();
      }
    });
  }

  // 应用配置到 UI
  function applyConfigToUI() {
    // 设置提供商
    providerInputs.forEach(input => {
      input.checked = input.value === currentConfig.provider;
    });
    updateModelOptions(currentConfig.provider);

    // 设置 API Key
    if (currentConfig.apiKey) {
      apiKeyInput.value = currentConfig.apiKey;
    }

    // 设置 API Endpoint
    if (currentConfig.apiEndpoint) {
      apiEndpointInput.value = currentConfig.apiEndpoint;
    }

    // 设置模型
    if (currentConfig.model) {
      modelSelect.value = currentConfig.model;
    }

    // 设置高级参数
    temperatureInput.value = currentConfig.temperature;
    tempValueSpan.textContent = currentConfig.temperature;
    maxTokensInput.value = currentConfig.maxTokens;
  }

  // 更新模型选项
  function updateModelOptions(provider) {
    if (provider === 'openai') {
      openaiModels.style.display = 'block';
      geminiModels.style.display = 'none';
      modelSelect.value = currentConfig.model.includes('gpt') ? currentConfig.model : 'gpt-4o-mini';
      apiEndpointInput.placeholder = '留空使用 https://api.openai.com/v1';
    } else if (provider === 'gemini') {
      openaiModels.style.display = 'none';
      geminiModels.style.display = 'block';
      modelSelect.value = currentConfig.model.includes('gemini') ? currentConfig.model : 'gemini-1.5-pro';
      apiEndpointInput.placeholder = '留空使用 https://generativelanguage.googleapis.com';
    }
  }

  // 保存配置
  async function saveConfig() {
    // 收集表单数据
    const provider = document.querySelector('input[name="provider"]:checked').value;
    const apiKey = apiKeyInput.value.trim();
    const apiEndpoint = apiEndpointInput.value.trim();
    const model = modelSelect.value;
    const temperature = parseFloat(temperatureInput.value);
    const maxTokens = parseInt(maxTokensInput.value);

    // 验证
    if (!apiKey) {
      showStatus('请输入 API Key', 'error');
      return;
    }

    // 保存配置
    const config = {
      provider,
      apiKey,
      apiEndpoint,
      model,
      temperature,
      maxTokens
    };

    chrome.storage.local.set({ aiConfig: config }, () => {
      currentConfig = config;
      showStatus('配置已保存！', 'success');
    });
  }

  // 测试连接
  async function testConnection() {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      showStatus('请先输入 API Key', 'error');
      return;
    }

    // 禁用按钮
    testBtn.disabled = true;
    testBtn.innerHTML = `
      <svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
      </svg>
      测试中...
    `;

    try {
      // 发送测试请求到 background
      const response = await chrome.runtime.sendMessage({
        type: 'TEST_CONNECTION',
        config: {
          provider: document.querySelector('input[name="provider"]:checked').value,
          apiKey: apiKey,
          apiEndpoint: apiEndpointInput.value.trim(),
          model: modelSelect.value
        }
      });

      if (response.success) {
        showStatus('连接成功！API 配置有效', 'success');
      } else {
        showStatus(`连接失败：${response.error}`, 'error');
      }
    } catch (error) {
      showStatus(`连接失败：${error.message}`, 'error');
    } finally {
      // 恢复按钮
      testBtn.disabled = false;
      testBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        测试连接
      `;
    }
  }

  // 显示状态消息
  function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';

    // 3秒后自动隐藏
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 3000);
  }
});
