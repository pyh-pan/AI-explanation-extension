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

  // 上下文配置相关元素
  const useContextCheckbox = document.getElementById('useContext');
  const contextModeSelect = document.getElementById('contextMode');
  const contextModeGroup = document.getElementById('contextModeGroup');
  const enableHighlightCheckbox = document.getElementById('enableHighlight');
  const highlightGroup = document.getElementById('highlightGroup');

  // Prompt 模板相关元素
  const promptTemplateSelect = document.getElementById('promptTemplateSelect');
  const customTemplateGroup = document.getElementById('customTemplateGroup');
  const customPromptTemplate = document.getElementById('customPromptTemplate');
  const previewTemplateBtn = document.getElementById('previewTemplate');

  // 默认配置
  let currentConfig = {
    provider: 'openai',
    apiKey: '',
    apiEndpoint: '',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 1000,
    // 上下文配置
    useContext: true,
    contextMode: 'standard',
    enableHighlight: true,
    promptTemplate: 'template:default'
  };

  // 预设模板库（用于预览）
  const PRESET_TEMPLATES = {
    'template:default': `你是一个智能助手，请基于网页内容的上下文，对用户选中的内容提供准确、深入的解释。

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

    'template:technical': `你是一个技术文档解读助手，请基于上下文解释技术概念。

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

    'template:academic': `你是一个学术研究助手，请基于论文上下文解释学术概念。

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

    'template:code': `你是一个代码理解助手，请基于代码上下文解释代码片段。

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

  // 监听上下文配置变化
  useContextCheckbox.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    contextModeGroup.style.display = enabled ? 'block' : 'none';
    highlightGroup.style.display = enabled ? 'block' : 'none';
  });

  // 监听模板选择变化
  promptTemplateSelect.addEventListener('change', (e) => {
    const templateKey = e.target.value;

    if (templateKey === 'custom') {
      customTemplateGroup.style.display = 'block';
    } else {
      customTemplateGroup.style.display = 'none';
      // 如果切换到预设模板，可以在这里显示预览
    }
  });

  // 监听模板预览按钮
  previewTemplateBtn.addEventListener('click', previewTemplate);

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

    // 设置上下文配置
    if (currentConfig.useContext !== undefined) {
      useContextCheckbox.checked = currentConfig.useContext;
      contextModeGroup.style.display = currentConfig.useContext ? 'block' : 'none';
      highlightGroup.style.display = currentConfig.useContext ? 'block' : 'none';
    }

    if (currentConfig.contextMode) {
      contextModeSelect.value = currentConfig.contextMode;
    }

    if (currentConfig.enableHighlight !== undefined) {
      enableHighlightCheckbox.checked = currentConfig.enableHighlight;
    }

    // 设置 Prompt 模板
    if (currentConfig.promptTemplate) {
      const template = currentConfig.promptTemplate;

      // 检查是否是预设模板
      if (template.startsWith('template:')) {
        promptTemplateSelect.value = template;
        customTemplateGroup.style.display = 'none';
      } else {
        // 自定义模板
        promptTemplateSelect.value = 'custom';
        customPromptTemplate.value = template;
        customTemplateGroup.style.display = 'block';
      }
    }
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

    // 收集上下文配置
    const useContext = useContextCheckbox.checked;
    const contextMode = contextModeSelect.value;
    const enableHighlight = enableHighlightCheckbox.checked;

    // 收集 Prompt 模板配置
    let promptTemplate;
    const templateSelect = promptTemplateSelect.value;

    if (templateSelect === 'custom') {
      promptTemplate = customPromptTemplate.value.trim();
      if (!promptTemplate) {
        showStatus('请输入自定义模板或选择预设模板', 'error');
        return;
      }
    } else {
      promptTemplate = templateSelect;
    }

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
      maxTokens,
      useContext,
      contextMode,
      enableHighlight,
      promptTemplate
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

  // 预览模板
  function previewTemplate() {
    let template;

    const templateSelect = promptTemplateSelect.value;

    if (templateSelect === 'custom') {
      template = customPromptTemplate.value.trim();
      if (!template) {
        showStatus('请先输入自定义模板', 'error');
        return;
      }
    } else {
      template = PRESET_TEMPLATES[templateSelect];
    }

    // 生成预览
    const preview = template
      .replace(/\{\{pageTitle\}\}/g, '示例网页标题')
      .replace(/\{\{pageUrl\}\}/g, 'https://example.com/article')
      .replace(/\{\{context\}\}/g, '这是网页的上下文内容示例...\n\n用户选中了一个术语需要解释。')
      .replace(/\{\{selectedText\}\}/g, 'API')
      .replace(/\{\{contextTokens\}\}/g, '6000');

    // 创建预览弹窗
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;

    content.innerHTML = `
      <h3 style="margin: 0 0 16px 0; font-size: 18px;">Prompt 模板预览</h3>
      <pre style="
        background: #f5f5f5;
        padding: 16px;
        border-radius: 8px;
        white-space: pre-wrap;
        word-wrap: break-word;
        margin: 0;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 13px;
        line-height: 1.6;
      ">${escapeHtml(preview)}</pre>
      <button id="closePreview" style="
        margin-top: 16px;
        padding: 8px 24px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      ">关闭</button>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // 关闭按钮
    document.getElementById('closePreview').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // 点击外部关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  // 转义 HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});
