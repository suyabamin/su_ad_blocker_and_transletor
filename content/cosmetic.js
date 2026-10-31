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
   * Loads cosmetic selectors safely via background message and applies them.
   */
  function loadAndApplySelectors() {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
      console.warn('Su_AdBlock: chrome.runtime is unavailable in cosmetic content script.');
      return;
    }

    console.log('Su_AdBlock: Requesting cosmetic selectors from extension background...');

    chrome.runtime.sendMessage({ action: 'GET_COSMETIC_SELECTORS' }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('Su_AdBlock: Background message error while fetching selectors:', chrome.runtime.lastError.message);
        return;
      }

      if (!response || !response.success || !response.data) {
        console.warn('Su_AdBlock: Received invalid selectors response from background:', response?.error || 'Empty response');
        return;
      }

      const data = response.data;
      console.log('Su_AdBlock: Selector resource loading completed. Processing rules...');

      const validSelectors = [];
      let invalidCount = 0;

      // Validate and extract global selectors
      if (Array.isArray(data.global)) {
        for (const sel of data.global) {
          if (typeof sel === 'string' && isValidCssSelector(sel)) {
            validSelectors.push(sel);
          } else {
            invalidCount++;
          }
        }
      }

      // Validate and extract domain-specific selectors
      if (data.domains && typeof data.domains === 'object') {
        for (const [domain, selectors] of Object.entries(data.domains)) {
          if (typeof domain === 'string' && (currentHostname === domain.toLowerCase() || currentHostname.endsWith('.' + domain.toLowerCase()))) {
            if (Array.isArray(selectors)) {
              for (const sel of selectors) {
                if (typeof sel === 'string' && isValidCssSelector(sel)) {
                  validSelectors.push(sel);
                } else {
                  invalidCount++;
                }
              }
            }
          }
        }
      }

      console.log(`Su_AdBlock: Diagnostic - Valid selectors: ${validSelectors.length}, Invalid ignored: ${invalidCount}`);

      if (validSelectors.length === 0) {
        console.log('Su_AdBlock: No cosmetic selectors applicable to this page.');
        return;
      }

      // Deduplicate selectors to prevent redundant DOM rules
      const uniqueSelectors = Array.from(new Set(validSelectors));

      // Inject combined stylesheet
      injectCosmeticStyle(uniqueSelectors);

      // Run initial scan
      hideMatchingElements(uniqueSelectors);

      // Setup restrained MutationObserver
      setupObserver(uniqueSelectors);

      console.log(`Su_AdBlock: Cosmetic selector application completed for ${currentHostname}`);
    });
  }

  /**
   * Safely checks if a string is a valid CSS selector without throwing exceptions.
   * @param {string} selector 
   * @returns {boolean}
   */
  function isValidCssSelector(selector) {
    if (!selector || typeof selector !== 'string' || !selector.trim()) return false;
    try {
      document.createDocumentFragment().querySelector(selector);
      return true;
    } catch {
      return false;
    }
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
    if (!selectors || selectors.length === 0) return;
    let count = 0;

    for (const sel of selectors) {
      try {
        const elements = document.querySelectorAll(sel);
        for (const el of elements) {
          if (!el.classList.contains('su-adblock-hidden')) {
            el.classList.add('su-adblock-hidden');
            count++;
          }
        }
      } catch {
        // Individual selector error will not break other selectors
      }
    }

    if (count > 0 && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      hiddenElementsCount += count;
      chrome.runtime.sendMessage({
        action: 'RECORD_ELEMENTS_HIDDEN',
        payload: { count }
      }).catch(() => {});
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
