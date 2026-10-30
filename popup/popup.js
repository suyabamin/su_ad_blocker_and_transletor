/**
 * Su_AdBlock - Popup Controller
 * Connects popup UI elements to background service worker messages.
 * Free Forever. Private by Design.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const globalToggle = document.getElementById('global-toggle');
  const statusDot = document.getElementById('status-dot');
  const statusTitle = document.getElementById('status-title');
  const statusDesc = document.getElementById('status-desc');

  const siteDomainText = document.getElementById('site-domain-text');
  const siteAllowBtn = document.getElementById('site-allow-btn');

  const statAds = document.getElementById('stat-ads');
  const statTrackers = document.getElementById('stat-trackers');
  const statElements = document.getElementById('stat-elements');

  const dashboardBtn = document.getElementById('dashboard-btn');
  const openPdfBtn = document.getElementById('open-pdf-btn');
  const openTranslatorBtn = document.getElementById('open-translator-btn');
  const footerVersion = document.getElementById('footer-version');

  let currentDomain = '';
  let isSiteWhitelisted = false;

  /**
   * Updates UI state based on global protection setting.
   */
  function updateProtectionUI(isActive) {
    globalToggle.checked = isActive;
    if (isActive) {
      statusDot.className = 'status-indicator active';
      statusTitle.textContent = 'Protection Active';
      statusDesc.textContent = 'Ads and trackers are blocked';
    } else {
      statusDot.className = 'status-indicator inactive';
      statusTitle.textContent = 'Protection Paused';
      statusDesc.textContent = 'Filtering is globally disabled';
    }
  }

  /**
   * Updates site allowlist button state.
   */
  function updateSiteButton(isPaused) {
    isSiteWhitelisted = isPaused;
    if (isPaused) {
      siteAllowBtn.textContent = 'Resume filtering';
      siteAllowBtn.classList.add('paused');
    } else {
      siteAllowBtn.textContent = 'Pause on this site';
      siteAllowBtn.classList.remove('paused');
    }
  }

  /**
   * Queries active tab to detect current website domain.
   */
  async function detectCurrentSite() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs && tabs[0];
        if (!tab || !tab.url) {
          siteDomainText.textContent = 'Restricted page';
          siteAllowBtn.disabled = true;
          return resolve('');
        }

        try {
          const urlObj = new URL(tab.url);
          if (urlObj.protocol === 'chrome:' || urlObj.protocol === 'edge:' || urlObj.protocol === 'chrome-extension:') {
            siteDomainText.textContent = 'Internal Chrome page';
            siteAllowBtn.disabled = true;
            return resolve('');
          }
          currentDomain = urlObj.hostname;
          siteDomainText.textContent = currentDomain;
          siteAllowBtn.disabled = false;
          resolve(currentDomain);
        } catch {
          siteDomainText.textContent = 'Unknown site';
          siteAllowBtn.disabled = true;
          resolve('');
        }
      });
    });
  }

  // Load Status
  chrome.runtime.sendMessage({ action: 'GET_STATUS' }, async (res) => {
    if (!res || !res.success) return;

    const data = res.data;
    updateProtectionUI(data.protectionEnabled);

    // Update stats
    if (data.stats && data.stats.allTime) {
      statAds.textContent = data.stats.allTime.adsBlocked || 0;
      statTrackers.textContent = data.stats.allTime.trackersBlocked || 0;
      statElements.textContent = data.stats.allTime.elementsHidden || 0;
    }

    if (data.filterVersion) {
      footerVersion.textContent = `v${data.filterVersion}`;
    }

    // Check current domain whitelist status
    const domain = await detectCurrentSite();
    if (domain) {
      chrome.runtime.sendMessage({
        action: 'CHECK_SITE_WHITELISTED',
        payload: { url: domain }
      }, (checkRes) => {
        if (checkRes && checkRes.success) {
          updateSiteButton(checkRes.isWhitelisted);
        }
      });
    }
  });

  // Global Toggle Handler
  globalToggle.addEventListener('change', () => {
    chrome.runtime.sendMessage({ action: 'TOGGLE_PROTECTION' }, (res) => {
      if (res && res.success) {
        updateProtectionUI(res.protectionEnabled);
      }
    });
  });

  // Site Whitelist Button Handler
  siteAllowBtn.addEventListener('click', () => {
    if (!currentDomain) return;
    chrome.runtime.sendMessage({
      action: 'TOGGLE_SITE_WHITELIST',
      payload: { domain: currentDomain }
    }, (res) => {
      if (res && res.success) {
        updateSiteButton(res.whitelisted);
        // Reload active tab so user sees change immediately
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0] && tabs[0].id) {
            chrome.tabs.reload(tabs[0].id);
          }
        });
      }
    });
  });

  // Action links
  dashboardBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'OPEN_DASHBOARD' });
    window.close();
  });

  openPdfBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'OPEN_PDF_READER' });
    window.close();
  });

  openTranslatorBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'OPEN_DASHBOARD',
      payload: { page: 'translation' }
    });
    window.close();
  });
});
