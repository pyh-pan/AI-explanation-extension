// Content Script - 划词识别和弹窗显示

(function() {
  'use strict';

  // 状态管理
  let explainButton = null;
  let explainPopup = null;
  let currentSelection = null;
  let isPopupVisible = false;
  let currentHighlightRanges = null;  // 上下文高亮范围

  // 创建"AI解释"按钮
  function createExplainButton() {
    const button = document.createElement('div');
    button.id = 'ai-explain-btn';
    button.className = 'ai-explain-button';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
      <span>AI解释</span>
    `;
    button.style.display = 'none';
    document.body.appendChild(button);
    return button;
  }

  // 创建解释弹窗
  function createExplainPopup() {
    const popup = document.createElement('div');
    popup.id = 'ai-explain-popup';
    popup.className = 'ai-explain-popup';
    popup.innerHTML = `
      <div class="ai-explain-popup-content">
        <div class="ai-explain-popup-header">
          <h3>AI 解释</h3>
          <button class="ai-explain-close" title="关闭">×</button>
        </div>
        <div class="ai-explain-popup-body">
          <div class="ai-explain-loading">
            <div class="ai-explain-spinner"></div>
            <p>正在分析...</p>
          </div>
          <div class="ai-explain-result" style="display:none;"></div>
          <div class="ai-explain-error" style="display:none;"></div>
        </div>
        <div class="ai-explain-popup-footer">
          <button class="ai-explain-copy" style="display:none;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            复制
          </button>
        </div>
      </div>
    `;
    popup.style.display = 'none';
    document.body.appendChild(popup);

    // 绑定关闭按钮事件
    const closeBtn = popup.querySelector('.ai-explain-close');
    closeBtn.addEventListener('click', hidePopup);

    // 绑定复制按钮事件
    const copyBtn = popup.querySelector('.ai-explain-copy');
    copyBtn.addEventListener('click', copyResult);

    // 点击外部关闭
    popup.addEventListener('click', (e) => {
      if (e.target === popup) {
        hidePopup();
      }
    });

    return popup;
  }

  // 显示按钮
  function showButton(rect) {
    if (!explainButton) {
      explainButton = createExplainButton();
    }

    const buttonWidth = 90;
    const buttonHeight = 32;
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // 计算按钮位置（选中区域右上方）
    let left = rect.right + scrollX + 8;
    let top = rect.top + scrollY - buttonHeight - 8;

    // 确保不超出视口
    const viewportWidth = window.innerWidth;
    if (left + buttonWidth > viewportWidth + scrollX) {
      left = rect.left + scrollX - buttonWidth - 8;
    }

    explainButton.style.left = `${Math.max(8, left)}px`;
    explainButton.style.top = `${Math.max(8, top)}px`;
    explainButton.style.display = 'flex';

    // 绑定点击事件
    explainButton.onclick = (e) => {
      e.stopPropagation();
      handleExplainClick();
    };
  }

  // 隐藏按钮
  function hideButton() {
    if (explainButton) {
      explainButton.style.display = 'none';
    }
  }

  // 显示弹窗
  function showPopup() {
    if (!explainPopup) {
      explainPopup = createExplainPopup();
    }

    if (!explainButton) return;

    const buttonRect = explainButton.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // 计算弹窗位置
    let left = buttonRect.left + scrollX;
    let top = buttonRect.bottom + scrollY + 8;

    // 确保不超出视口
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupWidth = 400;
    const popupMaxHeight = viewportHeight * 0.6;

    if (left + popupWidth > viewportWidth + scrollX) {
      left = viewportWidth + scrollX - popupWidth - 16;
    }

    if (top + popupMaxHeight > viewportHeight + scrollY) {
      top = buttonRect.top + scrollY - popupMaxHeight - 8;
    }

    explainPopup.style.left = `${Math.max(16, left)}px`;
    explainPopup.style.top = `${Math.max(16, top)}px`;
    explainPopup.style.maxHeight = `${popupMaxHeight}px`;
    explainPopup.style.display = 'block';

    // 重置状态
    explainPopup.querySelector('.ai-explain-loading').style.display = 'block';
    explainPopup.querySelector('.ai-explain-result').style.display = 'none';
    explainPopup.querySelector('.ai-explain-error').style.display = 'none';
    explainPopup.querySelector('.ai-explain-copy').style.display = 'none';

    isPopupVisible = true;

    // 应用上下文高亮
    if (currentHighlightRanges) {
      applyHighlights(currentHighlightRanges);
    }
  }

  // 隐藏弹窗
  function hidePopup() {
    clearHighlights();  // 清除高亮
    if (explainPopup) {
      explainPopup.style.display = 'none';
    }
    isPopupVisible = false;
  }

  // 处理解释按钮点击
  async function handleExplainClick() {
    const selectedText = currentSelection ? currentSelection.toString().trim() : '';

    if (!selectedText) {
      showError('请先选择要解释的文字');
      return;
    }

    hideButton();
    showPopup();

    try {
      // 获取用户配置
      const config = await getConfig();

      // 如果启用了上下文功能，提取页面内容
      let contextData = null;
      let mainContent = null;

      if (config.useContext !== false) {  // 默认启用
        try {
          // 提取页面上下文（懒加载 + 缓存）
          if (!window.contentExtractor) {
            console.error('ContentExtractor not available');
          } else {
            mainContent = await window.contentExtractor.extract(document);
            const position = window.contentExtractor.findSelectionPosition(selectedText);

            // 获取上下文预算
            const maxTokens = getContextMaxTokens(config.contextMode || 'standard');

            // 检查内容是否充足
            if (mainContent && window.contentExtractor.hasSufficientContent(mainContent)) {
              // 距离优先截断
              const context = window.contentExtractor.truncateByDistance(
                mainContent,
                position,
                maxTokens
              );

              // 保存上下文范围用于高亮
              currentHighlightRanges = context.highlightRanges;

              contextData = {
                content: context.content,
                metadata: {
                  paragraphs: context.paragraphs,
                  totalTokens: context.usedTokens,
                  pageTitle: mainContent.title,
                  pageUrl: window.location.href,
                  isFallback: mainContent.isFallback
                }
              };

              console.log('[Content Script] Context extracted:', {
                paragraphs: context.paragraphCount,
                tokens: context.usedTokens,
                mode: config.contextMode || 'standard'
              });
            } else {
              console.log('[Content Script] Insufficient content, using no-context mode');
            }
          }
        } catch (extractorError) {
          console.warn('[Content Script] Context extraction failed:', extractorError);
          // 继续使用无上下文模式
        }
      }

      // 构建请求数据
      const requestData = {
        type: 'EXPLAIN_TEXT',
        text: selectedText
      };

      // 如果有上下文数据，添加到请求中
      if (contextData) {
        requestData.context = contextData.content;
        requestData.contextMetadata = contextData.metadata;
        requestData.promptTemplate = config.promptTemplate || 'default';
      }

      // 发送消息到 background script
      const response = await chrome.runtime.sendMessage(requestData);

      if (response.success) {
        showResult(response.result);
      } else {
        showError(response.error || '获取解释失败');
      }
    } catch (error) {
      showError('网络错误，请检查网络连接');
      console.error('Explain error:', error);
    }
  }

  // 获取配置
  async function getConfig() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['aiConfig'], (result) => {
        const config = result.aiConfig || {};
        resolve({
          useContext: config.useContext !== false,  // 默认启用
          contextMode: config.contextMode || 'standard',  // economic/standard/precise
          enableHighlight: config.enableHighlight !== false,  // 默认启用
          promptTemplate: config.promptTemplate || 'default'
        });
      });
    });
  }

  // 根据模式获取最大 token 数
  function getContextMaxTokens(mode) {
    const modes = {
      economic: 2000,
      standard: 6000,
      precise: 12000
    };
    return modes[mode] || modes.standard;
  }

  // 应用三层级高亮
  function applyHighlights(highlightRanges) {
    if (!highlightRanges || highlightRanges.length === 0) return;

    getConfig().then(config => {
      if (config.enableHighlight === false) return;

      highlightRanges.forEach(range => {
        if (range.element && range.level) {
          range.element.classList.add(`ai-context-level-${range.level}`);
        }
      });

      console.log(`[Content Script] Applied highlights to ${highlightRanges.length} elements`);
    });
  }

  // 清除所有高亮
  function clearHighlights() {
    if (!currentHighlightRanges) return;

    for (let i = 1; i <= 3; i++) {
      document.querySelectorAll(`.ai-context-level-${i}`).forEach(el => {
        el.classList.remove(`ai-context-level-${i}`);
      });
    }

    currentHighlightRanges = null;
    console.log('[Content Script] Cleared highlights');
  }

  // 显示结果
  function showResult(text) {
    if (!explainPopup) return;

    const loadingEl = explainPopup.querySelector('.ai-explain-loading');
    const resultEl = explainPopup.querySelector('.ai-explain-result');
    const errorEl = explainPopup.querySelector('.ai-explain-error');
    const copyBtn = explainPopup.querySelector('.ai-explain-copy');

    loadingEl.style.display = 'none';
    errorEl.style.display = 'none';

    // 使用简单的 Markdown 渲染
    resultEl.innerHTML = renderMarkdown(text);
    resultEl.style.display = 'block';
    copyBtn.style.display = 'flex';
  }

  // 显示错误
  function showError(message) {
    if (!explainPopup) return;

    const loadingEl = explainPopup.querySelector('.ai-explain-loading');
    const resultEl = explainPopup.querySelector('.ai-explain-result');
    const errorEl = explainPopup.querySelector('.ai-explain-error');

    loadingEl.style.display = 'none';
    resultEl.style.display = 'none';

    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }

  // 复制结果
  function copyResult() {
    if (!explainPopup) return;

    const resultEl = explainPopup.querySelector('.ai-explain-result');
    const text = resultEl.textContent;

    navigator.clipboard.writeText(text).then(() => {
      const copyBtn = explainPopup.querySelector('.ai-explain-copy');
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = '✓ 已复制';
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
      }, 2000);
    }).catch(err => {
      console.error('Copy failed:', err);
    });
  }

  // 简单的 Markdown 渲染
  function renderMarkdown(text) {
    if (!text) return '';

    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/^\- (.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }

  // 处理选区变化
  function handleSelection() {
    const selection = window.getSelection();

    // 检查是否在输入框中
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable
    )) {
      hideButton();
      return;
    }

    const selectedText = selection.toString().trim();

    // 检查是否在插件自己的弹窗中
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      if (container.nodeType === Node.TEXT_NODE) {
        const parent = container.parentElement;
        if (parent && (parent.closest('#ai-explain-popup') || parent.closest('#ai-explain-btn'))) {
          return;
        }
      } else if (container.closest) {
        if (container.closest('#ai-explain-popup') || container.closest('#ai-explain-btn')) {
          return;
        }
      }
    }

    if (selectedText.length > 0) {
      currentSelection = selection;
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      showButton(rect);
    } else {
      currentSelection = null;
      hideButton();
    }
  }

  // 监听选区变化
  document.addEventListener('mouseup', (e) => {
    // 延迟执行，确保选区完成
    setTimeout(() => {
      handleSelection();
    }, 10);
  });

  document.addEventListener('keyup', (e) => {
    // 支持 Shift + 方向键选择
    if (e.shiftKey) {
      setTimeout(() => {
        handleSelection();
      }, 10);
    }
  });

  // 监听滚动，隐藏按钮和弹窗
  let scrollTimeout;
  document.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      if (!isPopupVisible) {
        hideButton();
      }
    }, 100);
  }, true);

  // 监听页面点击，关闭弹窗
  document.addEventListener('click', (e) => {
    if (isPopupVisible && !e.target.closest('#ai-explain-popup')) {
      // 如果点击的是新的选区，不关闭
      const selection = window.getSelection();
      if (selection.toString().trim().length === 0) {
        hidePopup();
      }
    }
  });

  // 监听键盘 ESC 关闭弹窗
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isPopupVisible) {
      hidePopup();
    }
  });

  // 监听来自 background 的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CHECK_CONFIG') {
      sendResponse({ configured: true });
    }
  });

  console.log('AI划词解释插件已加载');
})();
