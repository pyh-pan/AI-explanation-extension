/**
 * Content Extractor Module
 * Extracts main content from web pages using Readability algorithm
 * Implements lazy loading, caching, and intelligent truncation
 */

(function(window) {
  'use strict';

  /**
   * ContentExtractor class
   * Handles content extraction, caching, and context management
   */
  class ContentExtractor {
    constructor() {
      this.cache = null;
      this.cacheUrl = null;
      this.cacheTimestamp = null;
      this.isLoading = false;
      this.loadPromise = null;
    }

    /**
     * Extract main content from document
     * Uses caching and lazy loading for performance
     */
    async extract(document) {
      // Check if we have valid cache
      if (this.isValidCache()) {
        console.log('[ContentExtractor] Using cached content');
        return this.cache;
      }

      // If already loading, wait for it
      if (this.isLoading && this.loadPromise) {
        console.log('[ContentExtractor] Already loading, waiting...');
        return await this.loadPromise;
      }

      // Start loading
      this.isLoading = true;
      this.loadPromise = this.performExtraction(document);

      try {
        const content = await this.loadPromise;
        this.cache = content;
        this.cacheUrl = window.location.href;
        this.cacheTimestamp = Date.now();
        return content;
      } finally {
        this.isLoading = false;
        this.loadPromise = null;
      }
    }

    /**
     * Check if cached content is still valid
     */
    isValidCache() {
      if (!this.cache || !this.cacheUrl || !this.cacheTimestamp) {
        return false;
      }

      // Cache valid for 5 minutes
      const cacheAge = Date.now() - this.cacheTimestamp;
      const sameUrl = this.cacheUrl === window.location.href;

      return sameUrl && cacheAge < 5 * 60 * 1000;
    }

    /**
     * Perform the actual extraction
     */
    async performExtraction(document) {
      try {
        // Check for PDF
        if (this.isPDFDocument(document)) {
          return this.extractPDFContent(document);
        }

        // Wait for dynamic content
        await this.waitForContent(document);

        // Clone document for Readability
        const documentClone = document.cloneNode(true);

        // Use Readability to extract
        if (typeof Readability !== 'undefined') {
          const article = new Readability(documentClone).parse();

          if (article && article.content) {
            console.log('[ContentExtractor] Readability extraction successful');
            return this.processArticle(article, document);
          }
        }

        throw new Error('Readability extraction failed');
      } catch (error) {
        console.warn('[ContentExtractor] Extraction failed:', error);
        return this.fallbackExtraction(document);
      }
    }

    /**
     * Process extracted article and add structure
     */
    processArticle(article, document) {
      // Parse HTML content to extract paragraphs
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = article.content;

      const paragraphs = this.extractParagraphs(tempDiv);

      return {
        title: article.title || document.title,
        content: article.textContent,
        htmlContent: article.content,
        paragraphs: paragraphs,
        excerpt: article.excerpt || '',
        length: article.textContent.length,
        estimatedTokens: this.estimateTokens(article.textContent),
        byline: article.byline || '',
        dir: article.dir || '',
        isFallback: false
      };
    }

    /**
     * Extract paragraphs from HTML content
     */
    extractParagraphs(container) {
      const paragraphs = [];
      const elements = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, code');

      elements.forEach((el, index) => {
        const text = el.textContent.trim();
        if (text.length > 0) {
          paragraphs.push({
            index: index,
            text: text,
            element: el,
            tagName: el.tagName.toLowerCase(),
            length: text.length
          });
        }
      });

      return paragraphs;
    }

    /**
     * Find selection position in content
     */
    findSelectionPosition(selectedText) {
      if (!this.cache || !this.cache.paragraphs) {
        return { paragraphIndex: -1, found: false };
      }

      const searchText = selectedText.trim().toLowerCase();

      // Find the paragraph containing the selected text
      for (let i = 0; i < this.cache.paragraphs.length; i++) {
        const para = this.cache.paragraphs[i];
        if (para.text.toLowerCase().includes(searchText)) {
          console.log(`[ContentExtractor] Found selection in paragraph ${i}`);
          return { paragraphIndex: i, found: true, paragraph: para };
        }
      }

      console.warn('[ContentExtractor] Selection not found in extracted content');
      return { paragraphIndex: -1, found: false };
    }

    /**
     * Truncate context by distance from selection
     * Implements three-level priority system
     */
    truncateByDistance(mainContent, position, maxTokens) {
      const paragraphs = mainContent.paragraphs;
      const selectionIndex = position.found ? position.paragraphIndex : Math.floor(paragraphs.length / 2);

      console.log(`[ContentExtractor] Truncating to ${maxTokens} tokens, selection at index ${selectionIndex}`);

      // Define level ranges
      const ranges = {
        level1: { start: selectionIndex - 3, end: selectionIndex + 3, priority: 1 },
        level2: { start: selectionIndex - 5, end: selectionIndex + 5, priority: 2 },
        level3: { start: 0, end: paragraphs.length - 1, priority: 3 }
      };

      let totalTokens = 0;
      const includedParagraphs = [];

      // Add paragraphs by priority level
      for (let level = 1; level <= 3; level++) {
        const range = ranges[`level${level}`];
        const start = Math.max(0, range.start);
        const end = Math.min(paragraphs.length - 1, range.end);

        for (let i = start; i <= end; i++) {
          if (!includedParagraphs.includes(i)) {
            const para = paragraphs[i];
            const paraTokens = this.estimateTokens(para.text);

            if (totalTokens + paraTokens <= maxTokens) {
              includedParagraphs.push(i);
              totalTokens += paraTokens;
            } else {
              // Budget exceeded, stop
              break;
            }
          }
        }

        if (includedParagraphs.length === paragraphs.length) {
          break;
        }
      }

      // Sort included paragraphs by index
      includedParagraphs.sort((a, b) => a - b);

      // Build result
      const result = {
        content: includedParagraphs.map(i => paragraphs[i].text).join('\n\n'),
        paragraphs: includedParagraphs.map(i => ({
          index: i,
          text: paragraphs[i].text,
          level: this.getHighlightLevel(i, selectionIndex)
        })),
        highlightRanges: includedParagraphs.map(i => ({
          element: paragraphs[i].element,
          level: this.getHighlightLevel(i, selectionIndex)
        })),
        usedTokens: totalTokens,
        paragraphCount: includedParagraphs.length,
        totalParagraphs: paragraphs.length
      };

      console.log(`[ContentExtractor] Truncated to ${result.paragraphCount}/${result.totalParagraphs} paragraphs, ${result.usedTokens} tokens`);

      return result;
    }

    /**
     * Get highlight level for a paragraph
     */
    getHighlightLevel(paraIndex, selectionIndex) {
      const distance = Math.abs(paraIndex - selectionIndex);
      if (distance <= 3) return 1;
      if (distance <= 5) return 2;
      return 3;
    }

    /**
     * Estimate token count for text
     * Handles Chinese and English differently
     */
    estimateTokens(text) {
      if (!text) return 0;

      // Chinese: 1 char ≈ 1.5 tokens
      const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;

      // English: 1 word ≈ 1.3 tokens
      const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;

      // Other characters
      const otherChars = text.length - chineseChars - englishWords * 5;

      return Math.ceil(chineseChars * 1.5 + englishWords * 1.3 + otherChars * 0.5);
    }

    /**
     * Check if document is a PDF
     */
    isPDFDocument(document) {
      return document.contentType === 'application/pdf' ||
             document.body.classList.contains('pdf-viewer') ||
             window.location.href.toLowerCase().endsWith('.pdf') ||
             window.location.href.toLowerCase().includes('.pdf?');
    }

    /**
     * Extract content from PDF
     */
    extractPDFContent(document) {
      console.log('[ContentExtractor] Extracting PDF content');

      // Try to find text layer (PDF.js)
      const textLayer = document.querySelector('.textLayer');
      if (textLayer) {
        const paragraphs = this.extractParagraphs(textLayer);
        return {
          title: document.title || 'PDF 文档',
          content: textLayer.textContent,
          htmlContent: textLayer.innerHTML,
          paragraphs: paragraphs,
          length: textLayer.textContent.length,
          estimatedTokens: this.estimateTokens(textLayer.textContent),
          isPDF: true,
          isFallback: false
        };
      }

      throw new Error('无法提取 PDF 内容');
    }

    /**
     * Fallback extraction for when Readability fails
     */
    fallbackExtraction(document) {
      console.log('[ContentExtractor] Using fallback extraction');

      const clone = document.cloneNode(true);

      // Remove unwanted elements
      const unwantedSelectors = [
        'script', 'style', 'nav', 'footer', 'header',
        'aside', '.sidebar', '.advertisement', '.ads',
        '.navigation', '.menu', '.cookie-banner'
      ];

      unwantedSelectors.forEach(selector => {
        clone.querySelectorAll(selector).forEach(el => el.remove());
      });

      const paragraphs = this.extractParagraphs(clone.body);
      const content = clone.body.textContent.trim();

      return {
        title: document.title,
        content: content,
        htmlContent: clone.body.innerHTML,
        paragraphs: paragraphs,
        length: content.length,
        estimatedTokens: this.estimateTokens(content),
        isFallback: true
      };
    }

    /**
     * Wait for dynamic content to load
     */
    async waitForContent(document, timeout = 5000) {
      const startTime = Date.now();

      while (Date.now() - startTime < timeout) {
        const textLength = document.body.textContent.length;
        const paragraphCount = document.querySelectorAll('p').length;

        if (textLength > 500 && paragraphCount >= 3) {
          console.log('[ContentExtractor] Content loaded');
          return true;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.warn('[ContentExtractor] Wait for content timeout');
      return false;
    }

    /**
     * Check if content has sufficient text
     */
    hasSufficientContent(content) {
      const minLength = 100;
      const minParagraphs = 2;

      return content &&
             content.length > minLength &&
             content.paragraphs &&
             content.paragraphs.length >= minParagraphs;
    }

    /**
     * Clear cache
     */
    clearCache() {
      console.log('[ContentExtractor] Clearing cache');
      this.cache = null;
      this.cacheUrl = null;
      this.cacheTimestamp = null;
    }
  }

  // Export singleton instance
  window.ContentExtractor = ContentExtractor;

  // Create global singleton
  window.contentExtractor = new ContentExtractor();

})(typeof window !== 'undefined' ? window : global);
