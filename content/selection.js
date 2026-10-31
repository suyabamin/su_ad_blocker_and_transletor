/**
 * Su_AdBlock - Selection Translation Content Script
 * Listens for user text selections and summons the Shadow DOM floating translation card.
 * Free Forever. Private by Design.
 */

(function () {
  'use strict';

  if (window.__SU_ADBLOCK_SELECTION_INITIALIZED__) return;
  window.__SU_ADBLOCK_SELECTION_INITIALIZED__ = true;

  let popup = null;
  let floatingEnabled = true;

  function getPopup() {
    if (!popup && typeof SuTranslateFloatingPopup !== 'undefined') {
      popup = new SuTranslateFloatingPopup();
    }
    return popup;
  }

  // Load user settings
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }, (res) => {
      if (res && res.settings && res.settings.selectionFloatingEnabled !== undefined) {
        floatingEnabled = Boolean(res.settings.selectionFloatingEnabled);
      }
    });
  }

  function isEditableElement(el) {
    if (!el) return false;
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') return true;
    return false;
  }

  function isEnglishText(text) {
    if (!text || typeof text !== 'string') return false;
    const clean = text.trim();
    if (clean.length < 2) return false;
    return /[a-zA-Z]/.test(clean);
  }

  function handleSelectionTrigger(targetEl) {
    const host = document.getElementById('su-adblock-translate-host');
    if (host && targetEl && host.contains(targetEl)) return;

    if (isEditableElement(targetEl)) {
      if (popup) popup.removeUI();
      return;
    }

    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        return;
      }

      const text = selection.toString().trim();
      if (!text || !isEnglishText(text)) {
        return;
      }

      if (!floatingEnabled) return;

      if (selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      let rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        const clientRects = range.getClientRects();
        if (clientRects.length > 0) {
          rect = clientRects[0];
        }
      }

      if (rect.width > 0 || rect.height > 0) {
        const p = getPopup();
        if (p) p.showPill(rect, text);
      }
    }, 20);
  }

  // Mouseup listener for mouse selection
  document.addEventListener('mouseup', (e) => {
    handleSelectionTrigger(e.target);
  });

  // Keyup listener for keyboard selection (Shift + arrows, Home, End)
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Escape') {
      if (popup) popup.removeUI();
      return;
    }
    if (e.shiftKey || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
      handleSelectionTrigger(e.target);
    }
  });

  // Dismiss on clicking outside
  document.addEventListener('mousedown', (e) => {
    const host = document.getElementById('su-adblock-translate-host');
    if (host && host.contains(e.target)) return;
    if (popup) popup.removeUI();
  });

  // Dismiss on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (popup) popup.removeUI();
    }
  });

  // Reposition on scroll
  window.addEventListener('scroll', () => {
    if (popup && popup.pillEl) popup.removeUI();
  }, { passive: true });

  // Handle context menu and shortcuts from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'SHOW_SELECTION_TRANSLATION') {
      const text = message.payload && message.payload.text;
      const selection = window.getSelection();
      let rect = null;
      if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
        rect = selection.getRangeAt(0).getBoundingClientRect();
      }
      const p = getPopup();
      if (p) p.openCard(text, rect);
      sendResponse({ success: true });
    } else if (message.action === 'TRIGGER_SELECTION_TRANSLATE') {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        const text = selection.toString().trim();
        if (text) {
          const rect = selection.getRangeAt(0).getBoundingClientRect();
          const p = getPopup();
          if (p) p.openCard(text, rect);
        }
      }
      sendResponse({ success: true });
    }
  });
})();
