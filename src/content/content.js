/**
 * AI Explanation Extension - Content Script
 * Handles text selection, UI creation, and communication with background service
 */

(function() {
  'use strict';

  // State variables
  let button = null;
  let popup = null;
  let selectedText = '';
  let isDragging = false;
  let isResizing = false;
  let resizeDirection = null;
  let dragOffset = { x: 0, y: 0 };
  let originalRect = null;
  var cachedConfig = null;

  // Resize edge threshold (pixels)
  const RESIZE_THRESHOLD = 8;

  // Context mode limits (characters)
  const CONTEXT_LIMITS = {
    'economic': 2000,   // ~2000 tokens
    'standard': 6000,   // ~6000 tokens
    'precise': 12000    // ~12000 tokens
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    createButton();
    createPopup();
    setupEventListeners();
    setupStorageListener();
  }

  // Create the AI explain button
  function createButton() {
    button = document.createElement('div');
    button.className = 'ai-explain-button';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span>AI 解释</span>
    `;
    button.style.display = 'none';
    document.body.appendChild(button);

    button.addEventListener('click', handleExplainClick);
  }

  // Create the popup element
  function createPopup() {
    popup = document.createElement('div');
    popup.className = 'ai-explain-popup';
    popup.innerHTML = `
      <div class="ai-explain-popup-header">
        <h3>AI 解释</h3>
        <button class="ai-explain-close" title="关闭">&times;</button>
      </div>
      <div class="ai-explain-popup-body">
        <div class="ai-explain-loading">
          <p>正在分析...</p>
        </div>
        <div class="ai-explain-result"></div>
      </div>
      <div class="ai-explain-popup-footer">
        <button class="ai-explain-copy" title="复制解释">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          <span>复制</span>
        </button>
      </div>
    `;
    popup.style.display = 'none';
    document.body.appendChild(popup);

    // Setup popup event listeners
    const closeBtn = popup.querySelector('.ai-explain-close');
    closeBtn.addEventListener('click', hidePopup);

    const copyBtn = popup.querySelector('.ai-explain-copy');
    copyBtn.addEventListener('click', copyResult);

    // Make header draggable
    const header = popup.querySelector('.ai-explain-popup-header');
    header.addEventListener('mousedown', startDrag);
  }

  // Setup document event listeners
  function setupEventListeners() {
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Add resize detection on popup
    popup.addEventListener('mousemove', handlePopupMouseMove);
    popup.addEventListener('mousedown', handlePopupMouseDown);
  }

  function setupStorageListener() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.aiConfig) {
        console.log('[Content] Config changed, invalidating cache');
        cachedConfig = null;
      }
    });
  }

  // Get resize direction based on mouse position
  function getResizeDirection(e) {
    if (!popup) return null;

    const rect = popup.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    const onRightEdge = x >= rect.right - RESIZE_THRESHOLD;
    const onLeftEdge = x <= rect.left + RESIZE_THRESHOLD;
    const onBottomEdge = y >= rect.bottom - RESIZE_THRESHOLD;
    const onTopEdge = y <= rect.top + RESIZE_THRESHOLD;

    if (onBottomEdge && onRightEdge) return 'se'; // Southeast
    if (onBottomEdge && onLeftEdge) return 'sw'; // Southwest
    if (onTopEdge && onRightEdge) return 'ne'; // Northeast
    if (onTopEdge && onLeftEdge) return 'nw'; // Northwest
    if (onRightEdge) return 'e'; // East
    if (onLeftEdge) return 'w'; // West
    if (onBottomEdge) return 's'; // South
    if (onTopEdge) return 'n'; // North

    return null;
  }

  // Set cursor based on resize direction
  function setResizeCursor(direction) {
    const cursors = {
      'n': 'n-resize',
      's': 's-resize',
      'e': 'e-resize',
      'w': 'w-resize',
      'ne': 'ne-resize',
      'nw': 'nw-resize',
      'se': 'se-resize',
      'sw': 'sw-resize'
    };
    popup.style.cursor = cursors[direction] || 'default';
  }

  // Handle mouse move over popup
  function handlePopupMouseMove(e) {
    if (isDragging || isResizing) return;

    const direction = getResizeDirection(e);
    if (direction) {
      setResizeCursor(direction);
    } else {
      const header = popup.querySelector('.ai-explain-popup-header');
      if (header && header.contains(e.target)) {
        popup.style.cursor = 'move';
      } else {
        popup.style.cursor = 'default';
      }
    }
  }

  // Handle mouse down on popup for resize
  function handlePopupMouseDown(e) {
    const direction = getResizeDirection(e);
    if (direction) {
      isResizing = true;
      resizeDirection = direction;
      originalRect = popup.getBoundingClientRect();
      dragOffset.x = e.clientX;
      dragOffset.y = e.clientY;
      e.preventDefault();
    }
  }

  // Handle text selection
  function handleTextSelection(e) {
    // Ignore if clicking on button or popup
    if (button && button.contains(e.target)) return;
    if (popup && popup.contains(e.target)) return;

    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection.toString().trim();

      if (text.length > 0) {
        selectedText = text;
        showButton();
      } else {
        hideButton();
      }
    }, 10);
  }

  // Show button near selection
  function showButton() {
    if (!button) return;

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Calculate position - show button above or below selection
      let top = rect.top - 48; // Above selection
      let left = rect.left + (rect.width / 2) - 60; // Center horizontally

      // If above selection would be off screen, show below
      if (top < 16) {
        top = rect.bottom + 8;
      }

      // Keep button within viewport
      const buttonWidth = 120;
      const buttonHeight = 40;

      if (left + buttonWidth > window.innerWidth - 16) {
        left = window.innerWidth - buttonWidth - 16;
      }
      if (left < 16) {
        left = 16;
      }
      if (top + buttonHeight > window.innerHeight - 16) {
        top = window.innerHeight - buttonHeight - 16;
      }
      if (top < 16) {
        top = 16;
      }

      button.style.left = left + 'px';
      button.style.top = top + 'px';
      button.style.display = 'flex';
    }
  }

  // Hide button
  function hideButton() {
    if (button) {
      button.style.display = 'none';
    }
  }

  // Handle explain button click
  async function handleExplainClick() {
    if (!selectedText) return;

    hideButton();
    showPopup();
    await fetchExplanation(selectedText);
  }

  // Show popup
  function showPopup() {
    if (!popup) return;

    // Get selection position
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Position popup on the right side of selection, vertically centered
      let left = rect.right + 16;
      let top = rect.top + (rect.height / 2) - 200; // Center vertically (assuming 400px height)

      // Ensure popup doesn't go off screen
      const popupWidth = 480;
      const popupHeight = 400;

      if (left + popupWidth > window.innerWidth) {
        left = rect.left - popupWidth - 16;
      }
      if (left < 0) {
        left = 16;
      }
      if (top + popupHeight > window.innerHeight) {
        top = window.innerHeight - popupHeight - 16;
      }
      if (top < 0) {
        top = 16;
      }

      popup.style.left = left + 'px';
      popup.style.top = top + 'px';
    }

    popup.style.display = 'flex';

    // Reset popup content
    const loading = popup.querySelector('.ai-explain-loading');
    const result = popup.querySelector('.ai-explain-result');
    const copyBtn = popup.querySelector('.ai-explain-copy');

    loading.style.display = 'flex';
    result.style.display = 'none';
    copyBtn.style.display = 'none';
  }

  // Hide popup
  function hidePopup() {
    if (popup) {
      popup.style.display = 'none';
    }
  }

  // Fetch explanation from background service
  async function fetchExplanation(text) {
    const loading = popup.querySelector('.ai-explain-loading');
    const result = popup.querySelector('.ai-explain-result');
    const copyBtn = popup.querySelector('.ai-explain-copy');

    try {
      // Get page context
      const context = await getPageContext();

      // Send message to background service - use correct message type
      const message = {
        type: 'EXPLAIN_TEXT',
        text: text,
        pageUrl: window.location.href,
        pageTitle: document.title
      };

      // Only add context if it's not empty
      if (context) {
        message.context = context;
        message.contextMetadata = {
          pageTitle: document.title,
          pageUrl: window.location.href
        };
      }

      console.log('[Content] Sending message to background:', JSON.stringify({
        type: message.type,
        textLength: text.length,
        hasContext: !!context,
        contextLength: context ? context.length : 0
      }, null, 2));

      const response = await chrome.runtime.sendMessage(message);

      loading.style.display = 'none';

      if (response && response.success) {
        result.innerHTML = formatResult(response.result);
        result.style.display = 'block';
        copyBtn.style.display = 'flex';
      } else {
        result.innerHTML = `<div class="ai-explain-error">${response?.error || '解释失败，请重试'}</div>`;
        result.style.display = 'block';
      }
    } catch (error) {
      loading.style.display = 'none';
      result.innerHTML = `<div class="ai-explain-error">发生错误: ${error.message}</div>`;
      result.style.display = 'block';
    }
  }

  // Get page context
  async function getPageContext() {
    // Get config to check if context is enabled and get mode
    const config = await getConfig();

    console.log('[Content] getPageContext called. Full config:', JSON.stringify(config, null, 2));

    // If context is disabled, return empty
    if (!config.useContext) {
      console.log('[Content] Context disabled, returning empty string');
      return '';
    }

    console.log('[Content] useContext:', config.useContext, 'contextMode:', config.contextMode);
    console.log('[Content] CONTEXT_LIMITS:', CONTEXT_LIMITS);

    // Get main content from the page
    const article = document.querySelector('article') ||
                    document.querySelector('main') ||
                    document.querySelector('.content') ||
                    document.body;

    // Get text content, limit based on context mode
    let context = article.innerText || article.textContent || '';

    // Get limit based on context mode
    const limit = CONTEXT_LIMITS[config.contextMode] || CONTEXT_LIMITS['standard'];
    context = context.substring(0, limit);

    console.log('[Content] Final - mode:', config.contextMode, 'limit:', limit, 'context length:', context.length);

    return context;
  }

  // Get config from storage
  async function getConfig() {
    if (cachedConfig) {
      console.log('[Content] Using cached config:', cachedConfig);
      return cachedConfig;
    }

    return new Promise((resolve) => {
      chrome.storage.local.get(['aiConfig'], (result) => {
        cachedConfig = result.aiConfig || {};
        console.log('[Content] Loaded config from storage:', JSON.stringify(cachedConfig, null, 2));
        resolve(cachedConfig);
      });
    });
  }

  // Format result with markdown-like styling
  function formatResult(text) {
    if (!text) return '';

    // Convert markdown-style formatting
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    text = text.replace(/`(.+?)`/g, '<code>$1</code>');
    text = text.replace(/\n/g, '<br>');

    return text;
  }

  // Copy result to clipboard
  async function copyResult() {
    const result = popup.querySelector('.ai-explain-result');
    const text = result.innerText;

    try {
      await navigator.clipboard.writeText(text);

      // Show feedback
      const copyBtn = popup.querySelector('.ai-explain-copy');
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>已复制</span>
      `;
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
      }, 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }

  // Handle document click
  function handleDocumentClick(e) {
    if (isDragging || isResizing) return;

    // Hide popup if clicking outside
    if (popup && popup.style.display !== 'none') {
      if (!popup.contains(e.target) && !button.contains(e.target)) {
        const selection = window.getSelection();
        if (!selection.toString().trim()) {
          hidePopup();
        }
      }
    }
  }

  // Drag functionality
  function startDrag(e) {
    if (e.target.classList.contains('ai-explain-close')) return;
    isDragging = true;
    const rect = popup.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    e.preventDefault();
  }

  function handleMouseMove(e) {
    if (isDragging) {
      let newLeft = e.clientX - dragOffset.x;
      let newTop = e.clientY - dragOffset.y;

      // Keep popup within viewport
      const rect = popup.getBoundingClientRect();
      const maxLeft = window.innerWidth - rect.width;
      const maxTop = window.innerHeight - rect.height;

      newLeft = Math.max(0, Math.min(newLeft, maxLeft));
      newTop = Math.max(0, Math.min(newTop, maxTop));

      popup.style.left = newLeft + 'px';
      popup.style.top = newTop + 'px';
    } else if (isResizing && resizeDirection) {
      const dx = e.clientX - dragOffset.x;
      const dy = e.clientY - dragOffset.y;
      const rect = originalRect;
      const minWidth = 400;
      const minHeight = 200;

      let newWidth = rect.width;
      let newHeight = rect.height;
      let newLeft = rect.left;
      let newTop = rect.top;

      // Handle resize based on direction
      if (resizeDirection.includes('e')) {
        newWidth = Math.max(minWidth, rect.width + dx);
      }
      if (resizeDirection.includes('w')) {
        const widthDelta = Math.min(dx, rect.width - minWidth);
        newWidth = rect.width - widthDelta;
        newLeft = rect.left + widthDelta;
      }
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(minHeight, rect.height + dy);
      }
      if (resizeDirection.includes('n')) {
        const heightDelta = Math.min(dy, rect.height - minHeight);
        newHeight = rect.height - heightDelta;
        newTop = rect.top + heightDelta;
      }

      // Apply new size and position
      popup.style.width = newWidth + 'px';
      popup.style.height = newHeight + 'px';
      popup.style.left = newLeft + 'px';
      popup.style.top = newTop + 'px';
    }
  }

  function handleMouseUp(e) {
    isDragging = false;
    isResizing = false;
    resizeDirection = null;
    originalRect = null;
  }

})();
