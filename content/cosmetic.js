/**
 * Su_AdBlock - Cosmetic Filtering Content Script
 * Applies CSS selector element hiding for ad banners and placeholders.
 * Enforces restrained MutationObserver and respects allowlist.
 * Free Forever. Private by Design.
 */

(function () {
  'use strict';

  if (window.__SU_ADBLOCK_COSMETIC_INITIALIZED__) return;
  window.__SU_ADBLOCK_COSMETIC_INITIALIZED__ = true;

  const currentHostname = window.location.hostname.toLowerCase();
  let observer = null;
  let hiddenElementsCount = 0;
  let debounceTimer = null;

  /**
   * Initializes cosmetic engine after checking allowlist and settings.
   */
  async function initCosmetic() {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) return;

    // 1. Check if site is whitelisted
    chrome.runtime.sendMessage({
      action: 'CHECK_SITE_WHITELISTED',
      payload: { url: window.location.href }
    }, (whitelistRes) => {
      if (whitelistRes && whitelistRes.isWhitelisted) {
        console.log('Su_AdBlock: Site is whitelisted. Cosmetic filtering paused.');
        return;
      }

      // 2. Check settings
      chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }, (settingsRes) => {
        const settings = settingsRes && settingsRes.settings;
        if (!settings || !settings.protectionEnabled || !settings.cosmeticEnabled) {
          return;
        }

        // 3. Load selectors
        loadAndApplySelectors();
      });
    });
  }

  /**
   * Loads cosmetic selectors from selectors.json and applies them safely.
   */
  function loadAndApplySelectors() {
    const selectorsUrl = chrome.runtime.getURL('cosmetic/selectors.json');
    fetch(selectorsUrl)
      .then(res => res.json())
      .then(data => {
        const selectorsToApply = [];

        // Global selectors
        if (Array.isArray(data.global)) {
          selectorsToApply.push(...data.global);
        }

        // Domain-specific selectors
        if (data.domains) {
          for (const [domain, selectors] of Object.entries(data.domains)) {
            if (currentHostname === domain || currentHostname.endsWith('.' + domain)) {
              if (Array.isArray(selectors)) {
                selectorsToApply.push(...selectors);
              }
            }
          }
        }

        if (selectorsToApply.length === 0) return;

        // Inject combined stylesheet
        injectCosmeticStyle(selectorsToApply);

        // Run initial scan
        hideMatchingElements(selectorsToApply);

        // Setup restrained MutationObserver
        setupObserver(selectorsToApply);
      })
      .catch(err => {
        console.warn('Su_AdBlock: Failed to load cosmetic selectors:', err);
      });
  }

  /**
   * Injects CSS rule directly into document head.
   */
  function injectCosmeticStyle(selectors) {
    const existing = document.getElementById('su-cosmetic-style');
    if (existing) return;

    const style = document.createElement('style');
    style.id = 'su-cosmetic-style';
    style.textContent = `
      ${selectors.join(',\n')} {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        min-height: 0 !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `;

    const target = document.head || document.documentElement;
    if (target) {
      target.appendChild(style);
    }
  }

  /**
   * Scans document for matching elements and tallies counts.
   */
  function hideMatchingElements(selectors) {
    let count = 0;
    const combinedSelector = selectors.join(',');

    try {
      const elements = document.querySelectorAll(combinedSelector);
      for (const el of elements) {
        if (!el.classList.contains('su-adblock-hidden')) {
          el.classList.add('su-adblock-hidden');
          count++;
        }
      }
    } catch {
      // In case of selector syntax issues
    }

    if (count > 0) {
      hiddenElementsCount += count;
      chrome.runtime.sendMessage({
        action: 'RECORD_ELEMENTS_HIDDEN',
        payload: { count }
      });
    }
  }

  /**
   * Restrained MutationObserver to catch dynamically injected ad containers.
   */
  function setupObserver(selectors) {
    if (observer) return;

    observer = new MutationObserver((mutations) => {
      if (debounceTimer) return;

      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        let hasAddedNodes = false;
        for (const mutation of mutations) {
          if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            hasAddedNodes = true;
            break;
          }
        }

        if (hasAddedNodes) {
          hideMatchingElements(selectors);
        }
      }, 500); // Debounce by 500ms to preserve page performance
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCosmetic);
  } else {
    initCosmetic();
  }
})();
