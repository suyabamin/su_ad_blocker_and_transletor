/**
 * Su_AdBlock - Premium Floating Translation Popup Component
 * Uses Shadow DOM to isolate styles from host webpages and PDF viewer.
 * Provides a Google-Translate-inspired floating card with zero page interference.
 * Free Forever. Private by Design.
 */

(function (global) {
  'use strict';

  // SVG Icons
  const ICONS = {
    translate: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>`,
    copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>`,
    retry: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    expand: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
    shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
  };

  const SHADOW_CSS = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Kalpurush", "SolaimanLipi", sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    /* Floating Pill Button */
    .su-pill-trigger {
      position: absolute;
      z-index: 2147483647;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: #1a73e8;
      color: #ffffff;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(26, 115, 232, 0.35), 0 1px 3px rgba(0, 0, 0, 0.12);
      border: 1px solid #1557b0;
      user-select: none;
      animation: suPillPop 0.18s cubic-bezier(0.18, 0.89, 0.32, 1.28);
      transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
    }

    .su-pill-trigger:hover {
      background: #1557b0;
      transform: translateY(-1px) scale(1.02);
      box-shadow: 0 6px 16px rgba(26, 115, 232, 0.45);
    }

    .su-pill-trigger svg {
      flex-shrink: 0;
    }

    /* Floating Translation Card */
    .su-card-container {
      position: absolute;
      z-index: 2147483647;
      width: 360px;
      max-width: calc(100vw - 24px);
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #dadce0;
      box-shadow: 0 12px 28px 0 rgba(0, 0, 0, 0.18), 0 2px 6px 0 rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: suCardFade 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      transition: width 0.2s, max-height 0.2s;
    }

    .su-card-container.expanded {
      width: 480px;
    }

    /* Header */
    .su-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: #f8f9fa;
      border-bottom: 1px solid #e8eaed;
    }

    .su-card-brand {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 13px;
      font-weight: 600;
      color: #1a73e8;
    }

    .su-card-controls {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .su-icon-btn {
      background: transparent;
      border: none;
      color: #5f6368;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }

    .su-icon-btn:hover {
      background: #e8eaed;
      color: #202124;
    }

    /* Language Banner */
    .su-lang-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 14px;
      background: #ffffff;
      border-bottom: 1px solid #f1f3f4;
      font-size: 12px;
      color: #5f6368;
    }

    .su-lang-tags {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
    }

    .su-lang-source {
      color: #3c4043;
    }

    .su-lang-target {
      color: #1a73e8;
    }

    .su-engine-badge {
      font-size: 10px;
      font-weight: 600;
      background: #e8f0fe;
      color: #1967d2;
      padding: 2px 7px;
      border-radius: 10px;
    }

    /* Body */
    .su-card-body {
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 380px;
      overflow-y: auto;
    }

    .su-text-box {
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 13px;
      line-height: 1.5;
    }

    .su-source-box {
      background: #f8f9fa;
      border: 1px solid #e8eaed;
      color: #3c4043;
      max-height: 90px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .su-target-box {
      background: #ffffff;
      border: 1px solid #dadce0;
      color: #202124;
      font-size: 15px;
      font-weight: 500;
      min-height: 60px;
      max-height: 180px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.6;
    }

    .su-loading-row {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #5f6368;
      font-size: 13px;
    }

    .su-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #e8f0fe;
      border-top-color: #1a73e8;
      border-radius: 50%;
      animation: suSpin 0.7s linear infinite;
    }

    /* Footer */
    .su-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: #f8f9fa;
      border-top: 1px solid #e8eaed;
    }

    .su-actions-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .su-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 6px;
      border: 1px solid #dadce0;
      background: #ffffff;
      color: #3c4043;
      cursor: pointer;
      transition: all 0.15s;
    }

    .su-action-btn:hover {
      background: #f1f3f4;
      border-color: #c6c9cc;
    }

    .su-action-btn.primary {
      background: #1a73e8;
      border-color: #1557b0;
      color: #ffffff;
    }

    .su-action-btn.primary:hover {
      background: #1557b0;
    }

    .su-action-btn.copied {
      background: #e6f4ea;
      color: #137333;
      border-color: #ceead6;
    }

    .su-footer-info {
      font-size: 11px;
      color: #70757a;
    }

    @keyframes suPillPop {
      0% { opacity: 0; transform: scale(0.85) translateY(4px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }

    @keyframes suCardFade {
      0% { opacity: 0; transform: scale(0.96) translateY(4px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }

    @keyframes suSpin {
      to { transform: rotate(360deg); }
    }
  `;

  class FloatingTranslationPopup {
    constructor() {
      this.hostEl = null;
      this.shadowRoot = null;
      this.pillEl = null;
      this.cardEl = null;
      this.currentSelectionText = '';
      this.lastRect = null;
      this.isExpanded = false;
      this.activeTranslation = '';
      this._init();
    }

    _init() {
      if (document.getElementById('su-adblock-translate-host')) {
        this.hostEl = document.getElementById('su-adblock-translate-host');
        this.shadowRoot = this.hostEl.shadowRoot;
        return;
      }

      this.hostEl = document.createElement('div');
      this.hostEl.id = 'su-adblock-translate-host';
      this.hostEl.style.all = 'initial';
      this.hostEl.style.position = 'absolute';
      this.hostEl.style.top = '0';
      this.hostEl.style.left = '0';
      this.hostEl.style.zIndex = '2147483647';
      this.hostEl.style.pointerEvents = 'none';

      this.shadowRoot = this.hostEl.attachShadow({ mode: 'open' });

      const style = document.createElement('style');
      style.textContent = SHADOW_CSS;
      this.shadowRoot.appendChild(style);

      document.documentElement.appendChild(this.hostEl);
    }

    /**
     * Shows floating pill near the selected text.
     */
    showPill(rect, text) {
      this.removeUI();
      if (!text || text.length < 2) return;

      this.currentSelectionText = text;
      this.lastRect = rect;

      this.pillEl = document.createElement('div');
      this.pillEl.className = 'su-pill-trigger';
      this.pillEl.style.pointerEvents = 'auto';
      this.pillEl.innerHTML = `
        ${ICONS.translate}
        <span>Translate to বাংলা</span>
      `;

      // Position pill
      const pos = this._calculatePosition(rect, 170, 36);
      this.pillEl.style.top = `${pos.top}px`;
      this.pillEl.style.left = `${pos.left}px`;

      this.pillEl.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openCard(this.currentSelectionText, rect);
      });

      this.shadowRoot.appendChild(this.pillEl);
    }

    /**
     * Opens the floating Google-Translate-inspired card.
     */
    openCard(text, rect) {
      if (this.pillEl && this.pillEl.parentNode) {
        this.pillEl.parentNode.removeChild(this.pillEl);
        this.pillEl = null;
      }

      if (!text) return;
      this.currentSelectionText = text;
      this.lastRect = rect;

      if (this.cardEl && this.cardEl.parentNode) {
        this.cardEl.parentNode.removeChild(this.cardEl);
      }

      this.cardEl = document.createElement('div');
      this.cardEl.className = 'su-card-container' + (this.isExpanded ? ' expanded' : '');
      this.cardEl.style.pointerEvents = 'auto';

      this.cardEl.innerHTML = `
        <div class="su-card-header">
          <div class="su-card-brand">
            ${ICONS.shield}
            <span>Su_AdBlock Translate</span>
          </div>
          <div class="su-card-controls">
            <button class="su-icon-btn" id="su-expand-btn" title="Expand / Collapse">${ICONS.expand}</button>
            <button class="su-icon-btn" id="su-close-btn" title="Close (Esc)">${ICONS.close}</button>
          </div>
        </div>

        <div class="su-lang-bar">
          <div class="su-lang-tags">
            <span class="su-lang-source">English</span>
            <span>→</span>
            <span class="su-lang-target">বাংলা (Bengali)</span>
          </div>
          <span class="su-engine-badge" id="su-engine-badge">Local Engine</span>
        </div>

        <div class="su-card-body">
          <div class="su-source-box su-text-box" id="su-source-content"></div>
          <div class="su-target-box su-text-box" id="su-target-content">
            <div class="su-loading-row">
              <div class="su-spinner"></div>
              <span>Translating locally...</span>
            </div>
          </div>
        </div>

        <div class="su-card-footer">
          <div class="su-actions-left">
            <button class="su-action-btn primary" id="su-copy-btn">${ICONS.copy} <span>Copy</span></button>
            <button class="su-action-btn" id="su-retry-btn">${ICONS.retry} <span>Retry</span></button>
          </div>
          <span class="su-footer-info">Private & Offline</span>
        </div>
      `;

      // Set source content safely
      const sourceBox = this.cardEl.querySelector('#su-source-content');
      sourceBox.textContent = text;

      // Position card
      const width = this.isExpanded ? 480 : 360;
      const height = 280;
      const pos = this._calculatePosition(rect, width, height);
      this.cardEl.style.top = `${pos.top}px`;
      this.cardEl.style.left = `${pos.left}px`;

      // Prevent clicks inside card from propagating
      this.cardEl.addEventListener('mousedown', (e) => e.stopPropagation());

      this._bindCardEvents();
      this.shadowRoot.appendChild(this.cardEl);

      // Execute translation request
      this._requestTranslation(text);
    }

    _bindCardEvents() {
      const closeBtn = this.cardEl.querySelector('#su-close-btn');
      closeBtn.addEventListener('click', () => this.removeUI());

      const expandBtn = this.cardEl.querySelector('#su-expand-btn');
      expandBtn.addEventListener('click', () => {
        this.isExpanded = !this.isExpanded;
        this.cardEl.classList.toggle('expanded', this.isExpanded);
      });

      const copyBtn = this.cardEl.querySelector('#su-copy-btn');
      copyBtn.addEventListener('click', () => {
        if (!this.activeTranslation) return;
        navigator.clipboard.writeText(this.activeTranslation).then(() => {
          copyBtn.classList.add('copied');
          copyBtn.innerHTML = `${ICONS.check} <span>Copied!</span>`;
          setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = `${ICONS.copy} <span>Copy</span>`;
          }, 1500);
        });
      });

      const retryBtn = this.cardEl.querySelector('#su-retry-btn');
      retryBtn.addEventListener('click', () => {
        this._requestTranslation(this.currentSelectionText);
      });
    }

    _requestTranslation(text) {
      const targetBox = this.cardEl.querySelector('#su-target-content');
      const engineBadge = this.cardEl.querySelector('#su-engine-badge');

      targetBox.innerHTML = `
        <div class="su-loading-row">
          <div class="su-spinner"></div>
          <span>Translating locally...</span>
        </div>
      `;

      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          action: 'TRANSLATE_TEXT',
          payload: { text }
        }, (res) => {
          if (chrome.runtime.lastError || !res || !res.success) {
            targetBox.textContent = res && res.error ? res.error : 'Translation unavailable offline.';
            return;
          }
          this.activeTranslation = res.translation || '';
          targetBox.textContent = this.activeTranslation;
          if (engineBadge && res.engine) {
            engineBadge.textContent = res.engine;
          }
        });
      } else {
        // Fallback for direct standalone contexts (PDF reader)
        if (typeof TranslationEngine !== 'undefined') {
          const engine = new TranslationEngine();
          engine.translate(text).then(res => {
            this.activeTranslation = res.translation;
            targetBox.textContent = res.translation;
            if (engineBadge) engineBadge.textContent = res.engine;
          });
        }
      }
    }

    _calculatePosition(rect, width, height) {
      const scrollX = window.scrollX || window.pageXOffset || 0;
      const scrollY = window.scrollY || window.pageYOffset || 0;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = 0;
      let left = 0;

      if (!rect) {
        return { top: scrollY + 100, left: scrollX + (viewportWidth - width) / 2 };
      }

      // Check vertical space: place below selection if space, otherwise place above
      if (rect.bottom + height + 16 <= viewportHeight) {
        top = rect.bottom + scrollY + 8;
      } else if (rect.top - height - 16 >= 0) {
        top = rect.top + scrollY - height - 8;
      } else {
        top = scrollY + Math.max(10, (viewportHeight - height) / 2);
      }

      // Check horizontal bounds
      left = rect.left + scrollX;
      if (left + width > scrollX + viewportWidth - 16) {
        left = scrollX + viewportWidth - width - 16;
      }
      if (left < scrollX + 12) {
        left = scrollX + 12;
      }

      return { top: Math.round(top), left: Math.round(left) };
    }

    removeUI() {
      if (this.pillEl && this.pillEl.parentNode) {
        this.pillEl.parentNode.removeChild(this.pillEl);
      }
      this.pillEl = null;

      if (this.cardEl && this.cardEl.parentNode) {
        this.cardEl.parentNode.removeChild(this.cardEl);
      }
      this.cardEl = null;
    }
  }

  global.SuTranslateFloatingPopup = FloatingTranslationPopup;
})(typeof globalThis !== 'undefined' ? globalThis : window);
