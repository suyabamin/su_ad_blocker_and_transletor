/**
 * Su_AdBlock - Selection Translation Content Script
 * Displays a non-intrusive floating translation badge on English text selection.
 * Free Forever. Private by Design.
 */

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__SU_ADBLOCK_SELECTION_INITIALIZED__) return;
  window.__SU_ADBLOCK_SELECTION_INITIALIZED__ = true;

  let triggerEl = null;
  let popoverEl = null;
  let currentSelectionText = '';
  let floatingEnabled = true;

  // Load initial settings
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }, (res) => {
      if (res && res.settings && res.settings.selectionFloatingEnabled !== undefined) {
        floatingEnabled = Boolean(res.settings.selectionFloatingEnabled);
      }
    });
  }

  // Create and inject SVG icons
  const SHIELD_SVG = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  `;

  /**
   * Checks if an element is an editable input or form control.
   */
  function isEditableElement(el) {
    if (!el) return false;
    const tagName = el.tagName ? el.tagName.toLowerCase() : '';
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
      return true;
    }
    if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
      return true;
    }
    return false;
  }

  /**
   * Validates whether the text contains English alphabetical letters.
   */
  function isEnglishText(text) {
    if (!text || typeof text !== 'string') return false;
    const clean = text.trim();
    if (clean.length < 2) return false;
    // At least one English letter (A-Z, a-z)
    return /[a-zA-Z]/.test(clean);
  }

  /**
   * Cleans up both trigger and popover elements from DOM.
   */
  function removeUI() {
    if (triggerEl && triggerEl.parentNode) {
      triggerEl.parentNode.removeChild(triggerEl);
    }
    triggerEl = null;

    if (popoverEl && popoverEl.parentNode) {
      popoverEl.parentNode.removeChild(popoverEl);
    }
    popoverEl = null;
  }

  /**
   * Cleans up only the trigger badge, leaving popover open if active.
   */
  function removeTrigger() {
    if (triggerEl && triggerEl.parentNode) {
      triggerEl.parentNode.removeChild(triggerEl);
    }
    triggerEl = null;
  }

  /**
   * Positions the floating badge near the selection bounding rectangle.
   */
  function showTrigger(rect, text) {
    removeUI();
    if (!floatingEnabled) return;

    currentSelectionText = text;

    triggerEl = document.createElement('div');
    triggerEl.id = 'su-translate-trigger';
    triggerEl.innerHTML = `
      ${SHIELD_SVG}
      <span>Translate to বাংলা</span>
    `;

    // Position above or below selection with scroll offsets
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    let top = rect.bottom + scrollY + 8;
    let left = rect.left + scrollX;

    // Prevent overflowing right edge
    if (left + 180 > window.innerWidth + scrollX) {
      left = window.innerWidth + scrollX - 190;
    }
    if (left < scrollX + 10) left = scrollX + 10;

    triggerEl.style.top = `${top}px`;
    triggerEl.style.left = `${left}px`;

    // Click handler to initiate translation
    triggerEl.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      executeTranslation(currentSelectionText, rect);
    });

    document.body.appendChild(triggerEl);
  }

  /**
   * Renders the translation popover dialog and requests translation from background.
   */
  function executeTranslation(text, rect) {
    removeTrigger();

    if (!text || !text.trim()) return;

    popoverEl = document.createElement('div');
    popoverEl.id = 'su-translate-popover';

    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    let top = (rect ? rect.bottom : 100) + scrollY + 8;
    let left = (rect ? rect.left : 100) + scrollX;

    if (left + 330 > window.innerWidth + scrollX) {
      left = window.innerWidth + scrollX - 340;
    }
    if (left < scrollX + 10) left = scrollX + 10;

    popoverEl.style.top = `${top}px`;
    popoverEl.style.left = `${left}px`;

    popoverEl.innerHTML = `
      <div class="su-popover-header">
        <div class="su-popover-title">
          ${SHIELD_SVG}
          <span>English → বাংলা</span>
        </div>
        <button class="su-popover-close" id="su-popover-close-btn" title="Close">✕</button>
      </div>
      <div class="su-popover-body">
        <div>
          <div class="su-text-label">Original (English)</div>
          <div class="su-source-box" id="su-source-content"></div>
        </div>
        <div>
          <div class="su-text-label">Translation (বাংলা)</div>
          <div class="su-target-box" id="su-target-content">
            <span class="su-loading-spinner"></span> Translating locally...
          </div>
        </div>
      </div>
      <div class="su-popover-footer">
        <div class="su-footer-left">
          <button class="su-btn su-btn-copy" id="su-copy-btn">Copy</button>
          <button class="su-btn su-btn-expand" id="su-expand-btn">Dashboard</button>
        </div>
      </div>
    `;

    // Prevent clicks inside popover from dismissing it
    popoverEl.addEventListener('mousedown', (e) => e.stopPropagation());

    document.body.appendChild(popoverEl);

    // Safely set original text using textContent
    const sourceEl = popoverEl.querySelector('#su-source-content');
    if (sourceEl) sourceEl.textContent = text;

    const closeBtn = popoverEl.querySelector('#su-popover-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => removeUI());
    }

    const copyBtn = popoverEl.querySelector('#su-copy-btn');
    const targetEl = popoverEl.querySelector('#su-target-content');
    const expandBtn = popoverEl.querySelector('#su-expand-btn');

    let translatedResult = '';

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        if (!translatedResult) return;
        navigator.clipboard.writeText(translatedResult).then(() => {
          copyBtn.textContent = 'Copied!';
          copyBtn.classList.add('su-copied');
          setTimeout(() => {
            copyBtn.textContent = 'Copy';
            copyBtn.classList.remove('su-copied');
          }, 1500);
        });
      });
    }

    if (expandBtn) {
      expandBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({
          action: 'OPEN_DASHBOARD',
          payload: { page: `translation?text=${encodeURIComponent(text)}` }
        });
        removeUI();
      });
    }

    // Request translation from background service worker
    chrome.runtime.sendMessage({
      action: 'TRANSLATE_TEXT',
      payload: { text }
    }, (res) => {
      if (chrome.runtime.lastError || !res || !res.success) {
        if (targetEl) {
          targetEl.textContent = res && res.error
            ? `Translation error: ${res.error}`
            : 'Translation currently unavailable offline.';
        }
        return;
      }

      translatedResult = res.translation || '';
      if (targetEl) {
        targetEl.textContent = translatedResult;
      }
    });
  }

  // Handle selection on mouseup
  document.addEventListener('mouseup', (e) => {
    // If click inside our UI, ignore
    if (triggerEl && triggerEl.contains(e.target)) return;
    if (popoverEl && popoverEl.contains(e.target)) return;

    // Do not interfere with form fields
    if (isEditableElement(e.target)) {
      removeUI();
      return;
    }

    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        removeTrigger();
        return;
      }

      const text = selection.toString().trim();
      if (!text || !isEnglishText(text)) {
        removeTrigger();
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        showTrigger(rect, text);
      }
    }, 20);
  });

  // Dismiss on clicking outside
  document.addEventListener('mousedown', (e) => {
    if (triggerEl && !triggerEl.contains(e.target)) {
      removeTrigger();
    }
    if (popoverEl && !popoverEl.contains(e.target)) {
      removeUI();
    }
  });

  // Dismiss on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      removeUI();
    }
  });

  // Reposition on scroll or resize
  window.addEventListener('scroll', () => {
    if (triggerEl) removeTrigger();
  }, { passive: true });

  // Listen for messages from background (Context menu & shortcuts)
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'SHOW_SELECTION_TRANSLATION') {
      const text = message.payload && message.payload.text;
      const selection = window.getSelection();
      let rect = null;
      if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
        rect = selection.getRangeAt(0).getBoundingClientRect();
      }
      executeTranslation(text, rect);
      sendResponse({ success: true });
    } else if (message.action === 'TRIGGER_SELECTION_TRANSLATE') {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        const text = selection.toString().trim();
        if (text) {
          executeTranslation(text, selection.getRangeAt(0).getBoundingClientRect());
        }
      }
      sendResponse({ success: true });
    }
  });
})();
