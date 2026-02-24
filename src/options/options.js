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
  const glmModels = document.getElementById('glm-models');
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

  // Prompt 模板相关元素
  const promptTemplateSelect = document.getElementById('promptTemplateSelect');
  const editTemplateBtn = document.getElementById('editTemplateBtn');
  const saveAsNewBtn = document.getElementById('saveAsNewBtn');
  const templateEditorGroup = document.getElementById('templateEditorGroup');
  const editorTitle = document.getElementById('editorTitle');
  const closeEditorBtn = document.getElementById('closeEditorBtn');
  const promptTemplateEditor = document.getElementById('promptTemplateEditor');
  const saveTemplateBtn = document.getElementById('saveTemplateBtn');
  const resetToDefaultBtn = document.getElementById('resetToDefaultBtn');
  const previewTemplateBtn = document.getElementById('previewTemplateBtn');
  const customTemplatesListGroup = document.getElementById('customTemplatesListGroup');
  const customTemplatesList = document.getElementById('customTemplatesList');
  const newTemplateBtn = document.getElementById('newTemplateBtn');

  // 模板名称弹窗相关元素
  const templateNameModal = document.getElementById('templateNameModal');
  const templateNameInput = document.getElementById('templateNameInput');
  const cancelTemplateNameBtn = document.getElementById('cancelTemplateNameBtn');
  const confirmTemplateNameBtn = document.getElementById('confirmTemplateNameBtn');

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
    promptTemplate: 'template:default',
    customTemplates: {},
    presetOverrides: {}
  };

  // 当前编辑的模板
  let currentEditingTemplate = null;
  let isEditingPreset = false;

  // 默认预设模板库
  const DEFAULT_PRESET_TEMPLATES = {
    'template:default': {
      name: '默认模板（通用解释）',
      category: 'preset',
      content: `你是一个智能助手，请基于网页内容的上下文，对用户选中的内容提供准确、深入的解释。

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
- 字数控制在 300-600 字之间`
    },

    'template:technical': {
      name: '技术文档模板',
      category: 'preset',
      content: `你是一个技术文档解读助手，请基于上下文解释技术概念。

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

使用 Markdown 格式，尽可能详细和准确。`
    },

    'template:academic': {
      name: '学术论文模板',
      category: 'preset',
      content: `你是一个学术研究助手，请基于论文上下文解释学术概念。

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

使用学术化语言，Markdown 格式。`
    },

    'template:code': {
      name: '代码理解模板',
      category: 'preset',
      content: `你是一个代码理解助手，请基于代码上下文解释代码片段。

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
    }
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
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"/>
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
  });

  // 监听模板选择变化
  promptTemplateSelect.addEventListener('change', (e) => {
    const templateKey = e.target.value;
    currentConfig.promptTemplate = templateKey;

    // 更新编辑按钮状态
    updateEditButtonState(templateKey);
  });

  // 监听编辑模板按钮
  editTemplateBtn.addEventListener('click', () => {
    openEditorForCurrentTemplate();
  });

  // 监听另存为按钮
  saveAsNewBtn.addEventListener('click', () => {
    saveAsNewTemplate();
  });

  // 监听关闭编辑器按钮
  closeEditorBtn.addEventListener('click', () => {
    templateEditorGroup.style.display = 'none';
  });

  // 监听保存模板按钮
  saveTemplateBtn.addEventListener('click', saveCurrentTemplate);

  // 监听恢复默认按钮
  resetToDefaultBtn.addEventListener('click', resetCurrentTemplateToDefault);

  // 监听预览模板按钮
  previewTemplateBtn.addEventListener('click', previewCurrentTemplate);

  // 监听新建模板按钮
  newTemplateBtn.addEventListener('click', () => {
    showTemplateNameModal('', (name) => {
      if (name) {
        openEditorForNewTemplate(name);
      }
    });
  });

  // 监听模板名称弹窗
  cancelTemplateNameBtn.addEventListener('click', () => {
    hideTemplateNameModal();
  });

  confirmTemplateNameBtn.addEventListener('click', () => {
    const name = templateNameInput.value.trim();
    if (name) {
      // 先保存回调引用，再隐藏弹窗
      const callback = window.templateNameCallback;
      hideTemplateNameModal();
      if (callback) {
        callback(name);
      }
    } else {
      showStatus('请输入模板名称', 'error');
    }
  });

  templateNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      confirmTemplateNameBtn.click();
    }
  });

  // 加载配置
  function loadConfig() {
    chrome.storage.local.get(['aiConfig'], (result) => {
      if (result.aiConfig) {
        currentConfig = { ...currentConfig, ...result.aiConfig };
        // 确保模板相关字段存在
        if (!currentConfig.customTemplates) currentConfig.customTemplates = {};
        if (!currentConfig.presetOverrides) currentConfig.presetOverrides = {};
      }
      applyConfigToUI();
      renderTemplateOptions();
      renderCustomTemplatesList();
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
    }

    if (currentConfig.contextMode) {
      contextModeSelect.value = currentConfig.contextMode;
    }

    // 设置 Prompt 模板
    if (currentConfig.promptTemplate) {
      promptTemplateSelect.value = currentConfig.promptTemplate;
      updateEditButtonState(currentConfig.promptTemplate);
    }
  }

  // 更新模型选项
  function updateModelOptions(provider) {
    if (provider === 'openai') {
      openaiModels.style.display = 'block';
      geminiModels.style.display = 'none';
      glmModels.style.display = 'none';
      modelSelect.value = currentConfig.model.includes('gpt') ? currentConfig.model : 'gpt-4o-mini';
      apiEndpointInput.placeholder = '留空使用 https://api.openai.com/v1';
    } else if (provider === 'gemini') {
      openaiModels.style.display = 'none';
      geminiModels.style.display = 'block';
      glmModels.style.display = 'none';
      modelSelect.value = currentConfig.model.includes('gemini') ? currentConfig.model : 'gemini-1.5-pro';
      apiEndpointInput.placeholder = '留空使用 https://generativelanguage.googleapis.com';
    } else if (provider === 'glm') {
      openaiModels.style.display = 'none';
      geminiModels.style.display = 'none';
      glmModels.style.display = 'block';
      modelSelect.value = currentConfig.model.includes('glm') ? currentConfig.model : 'glm-4.7';
      apiEndpointInput.placeholder = '留空使用 https://open.bigmodel.cn/api/paas/v4';
    }
  }

  // 渲染模板选项
  function renderTemplateOptions() {
    promptTemplateSelect.innerHTML = '';

    // 渲染预设模板分组
    const presetGroup = document.createElement('optgroup');
    presetGroup.label = '预设模板';
    Object.keys(DEFAULT_PRESET_TEMPLATES).forEach(key => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = DEFAULT_PRESET_TEMPLATES[key].name;
      presetGroup.appendChild(option);
    });
    promptTemplateSelect.appendChild(presetGroup);

    // 渲染自定义模板分组
    const customKeys = Object.keys(currentConfig.customTemplates || {});
    if (customKeys.length > 0) {
      const customGroup = document.createElement('optgroup');
      customGroup.label = '自定义模板';
      customKeys.forEach(name => {
        const option = document.createElement('option');
        option.value = `custom:${name}`;
        option.textContent = name;
        customGroup.appendChild(option);
      });
      promptTemplateSelect.appendChild(customGroup);
    }

    // 选中当前模板
    if (currentConfig.promptTemplate) {
      promptTemplateSelect.value = currentConfig.promptTemplate;
    }
  }

  // 更新编辑按钮状态
  function updateEditButtonState(templateKey) {
    const isPreset = templateKey.startsWith('template:');
    const isCustom = templateKey.startsWith('custom:');

    if (isPreset) {
      editTemplateBtn.style.display = 'inline-flex';
      // 检查是否有自定义覆盖
      const hasOverride = currentConfig.presetOverrides && currentConfig.presetOverrides[templateKey];
      resetToDefaultBtn.style.display = 'none';
    } else {
      editTemplateBtn.style.display = 'inline-flex';
    }
  }

  // 渲染自定义模板列表
  function renderCustomTemplatesList() {
    customTemplatesList.innerHTML = '';
    const customKeys = Object.keys(currentConfig.customTemplates || {});

    if (customKeys.length > 0) {
      customTemplatesListGroup.style.display = 'block';

      customKeys.forEach(name => {
        const templateItem = document.createElement('div');
        templateItem.className = 'template-item';

        const templateInfo = document.createElement('div');
        templateInfo.className = 'template-info';

        const templateName = document.createElement('div');
        templateName.className = 'template-name';
        templateName.textContent = name;

        const templatePreview = document.createElement('div');
        templatePreview.className = 'template-preview';
        templatePreview.textContent = currentConfig.customTemplates[name].substring(0, 80) + '...';

        templateInfo.appendChild(templateName);
        templateInfo.appendChild(templatePreview);

        const templateActions = document.createElement('div');
        templateActions.className = 'template-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-small btn-ghost';
        editBtn.title = '编辑';
        editBtn.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        `;
        editBtn.addEventListener('click', () => openEditorForCustomTemplate(name));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-small btn-ghost btn-danger';
        deleteBtn.title = '删除';
        deleteBtn.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        `;
        deleteBtn.addEventListener('click', () => deleteCustomTemplate(name));

        templateActions.appendChild(editBtn);
        templateActions.appendChild(deleteBtn);

        templateItem.appendChild(templateInfo);
        templateItem.appendChild(templateActions);
        customTemplatesList.appendChild(templateItem);
      });
    } else {
      customTemplatesListGroup.style.display = 'none';
    }
  }

  // 打开当前模板的编辑器
  function openEditorForCurrentTemplate() {
    const templateKey = promptTemplateSelect.value;

    if (templateKey.startsWith('template:')) {
      // 预设模板
      isEditingPreset = true;
      currentEditingTemplate = templateKey;
      editorTitle.textContent = `编辑: ${DEFAULT_PRESET_TEMPLATES[templateKey].name}`;

      // 获取模板内容（优先使用自定义覆盖）
      const content = currentConfig.presetOverrides && currentConfig.presetOverrides[templateKey]
        ? currentConfig.presetOverrides[templateKey]
        : DEFAULT_PRESET_TEMPLATES[templateKey].content;

      promptTemplateEditor.value = content;
      resetToDefaultBtn.style.display = 'inline-flex';
    } else if (templateKey.startsWith('custom:')) {
      // 自定义模板
      const name = templateKey.substring(7);
      openEditorForCustomTemplate(name);
      return;
    } else {
      showStatus('请先选择一个模板', 'error');
      return;
    }

    templateEditorGroup.style.display = 'block';
  }

  // 打开自定义模板的编辑器
  function openEditorForCustomTemplate(name) {
    isEditingPreset = false;
    currentEditingTemplate = `custom:${name}`;
    editorTitle.textContent = `编辑: ${name}`;

    promptTemplateEditor.value = currentConfig.customTemplates[name];
    resetToDefaultBtn.style.display = 'none';

    templateEditorGroup.style.display = 'block';
  }

  // 打开新模板的编辑器
  function openEditorForNewTemplate(name) {
    isEditingPreset = false;
    currentEditingTemplate = `custom:${name}`;
    editorTitle.textContent = `新建模板: ${name}`;

    promptTemplateEditor.value = '';
    resetToDefaultBtn.style.display = 'none';

    templateEditorGroup.style.display = 'block';
  }

  // 另存为新模板
  function saveAsNewTemplate() {
    let content;

    if (templateEditorGroup.style.display === 'block') {
      // 编辑器已打开，保存当前内容
      content = promptTemplateEditor.value;
    } else {
      // 编辑器未打开，获取当前选中模板的内容
      const templateKey = promptTemplateSelect.value;

      if (templateKey.startsWith('template:')) {
        content = currentConfig.presetOverrides && currentConfig.presetOverrides[templateKey]
          ? currentConfig.presetOverrides[templateKey]
          : DEFAULT_PRESET_TEMPLATES[templateKey].content;
      } else if (templateKey.startsWith('custom:')) {
        const name = templateKey.substring(7);
        content = currentConfig.customTemplates[name];
      } else {
        showStatus('请先选择一个模板', 'error');
        return;
      }
    }

    if (!content) {
      showStatus('模板内容为空', 'error');
      return;
    }

    showTemplateNameModal('', (name) => {
      if (name) {
        if (currentConfig.customTemplates[name]) {
          if (!confirm(`模板 "${name}" 已存在，是否覆盖？`)) {
            return;
          }
        }

        currentConfig.customTemplates[name] = content;

        // 先保存到存储
        saveTemplateConfig(() => {
          // 保存完成后刷新 UI
          renderTemplateOptions();
          renderCustomTemplatesList();
          showStatus(`模板 "${name}" 已保存`, 'success');
        });
      }
    });
  }

  // 保存当前模板
  function saveCurrentTemplate() {
    const content = promptTemplateEditor.value.trim();

    if (!content) {
      showStatus('模板内容不能为空', 'error');
      return;
    }

    if (isEditingPreset) {
      // 保存预设模板覆盖
      currentConfig.presetOverrides[currentEditingTemplate] = content;

      saveTemplateConfig(() => {
        showStatus(`预设模板已保存自定义版本`, 'success');
      });
    } else {
      // 保存自定义模板
      const name = currentEditingTemplate.substring(7);
      currentConfig.customTemplates[name] = content;

      saveTemplateConfig(() => {
        renderTemplateOptions();
        renderCustomTemplatesList();
        showStatus(`模板 "${name}" 已保存`, 'success');
      });
    }
  }

  // 恢复当前模板为默认
  function resetCurrentTemplateToDefault() {
    if (!isEditingPreset) return;

    if (confirm('确定要恢复到默认模板吗？自定义修改将丢失。')) {
      const templateKey = currentEditingTemplate;
      delete currentConfig.presetOverrides[templateKey];
      promptTemplateEditor.value = DEFAULT_PRESET_TEMPLATES[templateKey].content;
      showStatus('已恢复默认模板', 'success');

      saveTemplateConfig();
    }
  }

  // 删除自定义模板
  function deleteCustomTemplate(name) {
    if (confirm(`确定要删除模板 "${name}" 吗？`)) {
      delete currentConfig.customTemplates[name];

      // 如果当前选中的是被删除的模板，切换到默认
      if (currentConfig.promptTemplate === `custom:${name}`) {
        currentConfig.promptTemplate = 'template:default';
        promptTemplateSelect.value = 'template:default';
        updateEditButtonState('template:default');
      }

      saveTemplateConfig(() => {
        renderTemplateOptions();
        renderCustomTemplatesList();
        showStatus(`模板 "${name}" 已删除`, 'success');
      });
    }
  }

  // 保存模板配置
  function saveTemplateConfig(callback) {
    const configToSave = {
      ...currentConfig,
      customTemplates: currentConfig.customTemplates,
      presetOverrides: currentConfig.presetOverrides
    };

    chrome.storage.local.set({ aiConfig: configToSave }, () => {
      if (callback) callback();
    });
  }

  // 显示模板名称输入弹窗
  function showTemplateNameModal(defaultName, callback) {
    templateNameInput.value = defaultName;
    templateNameModal.style.display = 'flex';
    window.templateNameCallback = callback;
    templateNameInput.focus();
  }

  // 隐藏模板名称输入弹窗
  function hideTemplateNameModal() {
    templateNameModal.style.display = 'none';
    templateNameInput.value = '';
    window.templateNameCallback = null;
  }

  // 预览当前模板
  function previewCurrentTemplate() {
    const template = promptTemplateEditor.value.trim();

    if (!template) {
      showStatus('模板内容不能为空', 'error');
      return;
    }

    previewTemplate(template);
  }

  // 预览模板（通用函数）
  function previewTemplate(template) {
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

    // 收集 Prompt 模板配置
    const promptTemplate = promptTemplateSelect.value;

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
      promptTemplate,
      customTemplates: currentConfig.customTemplates,
      presetOverrides: currentConfig.presetOverrides
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

  // 转义 HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 获取模板内容（供外部使用）
  function getTemplateContent(templateKey) {
    if (templateKey.startsWith('template:')) {
      return currentConfig.presetOverrides && currentConfig.presetOverrides[templateKey]
        ? currentConfig.presetOverrides[templateKey]
        : DEFAULT_PRESET_TEMPLATES[templateKey].content;
    } else if (templateKey.startsWith('custom:')) {
      const name = templateKey.substring(7);
      return currentConfig.customTemplates[name];
    }
    return null;
  }

  // 暴露给外部使用的函数
  window.templateManager = {
    getTemplateContent,
    getAllTemplates: () => {
      return {
        presets: DEFAULT_PRESET_TEMPLATES,
        customs: currentConfig.customTemplates,
        overrides: currentConfig.presetOverrides
      };
    }
  };
});
