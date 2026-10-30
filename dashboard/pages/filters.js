/**
 * Su_AdBlock Dashboard - Filters Page Controller
 * Free Forever. Private by Design.
 */

window.initFiltersPage = function () {
  const adsToggle = document.getElementById('ruleset-ads-toggle');
  const trackersToggle = document.getElementById('ruleset-trackers-toggle');
  const cosmeticToggle = document.getElementById('cosmetic-toggle');
  const checkUpdateBtn = document.getElementById('check-filter-update-btn');
  const filterVersionText = document.getElementById('filter-version-text');
  const filterStatusMsg = document.getElementById('filter-status-message');

  // Load filter status and settings
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }, (res) => {
      if (!res || !res.success) return;
      const s = res.settings;
      if (adsToggle && s.activeRulesets) adsToggle.checked = s.activeRulesets.ads !== false;
      if (trackersToggle && s.activeRulesets) trackersToggle.checked = s.activeRulesets.trackers !== false;
      if (cosmeticToggle) cosmeticToggle.checked = s.cosmeticEnabled !== false;
    });

    chrome.runtime.sendMessage({ action: 'GET_FILTER_UPDATE_STATUS' }, (res) => {
      if (res && res.success && res.status) {
        if (filterVersionText && res.status.version) filterVersionText.textContent = res.status.version;
        if (filterStatusMsg && res.status.message) filterStatusMsg.textContent = res.status.message;
      }
    });
  }

  // Handle Static Ruleset toggles
  if (adsToggle) {
    adsToggle.addEventListener('change', () => {
      chrome.runtime.sendMessage({
        action: 'UPDATE_SETTINGS',
        payload: { activeRulesets: { ads: adsToggle.checked } }
      });
    });
  }

  if (trackersToggle) {
    trackersToggle.addEventListener('change', () => {
      chrome.runtime.sendMessage({
        action: 'UPDATE_SETTINGS',
        payload: { activeRulesets: { trackers: trackersToggle.checked } }
      });
    });
  }

  if (cosmeticToggle) {
    cosmeticToggle.addEventListener('change', () => {
      chrome.runtime.sendMessage({
        action: 'UPDATE_SETTINGS',
        payload: { cosmeticEnabled: cosmeticToggle.checked }
      });
    });
  }

  // Handle Manual Update Check
  if (checkUpdateBtn) {
    checkUpdateBtn.addEventListener('click', () => {
      checkUpdateBtn.disabled = true;
      checkUpdateBtn.textContent = 'Checking...';
      if (filterStatusMsg) filterStatusMsg.textContent = 'Connecting to filter provider...';

      chrome.runtime.sendMessage({ action: 'CHECK_FILTER_UPDATES' }, (res) => {
        checkUpdateBtn.disabled = false;
        checkUpdateBtn.textContent = 'Check for Updates';

        if (res && res.message) {
          if (filterStatusMsg) filterStatusMsg.textContent = res.message;
          if (res.details && filterVersionText) {
            filterVersionText.textContent = res.details.version || '1.0.0';
          }
        }
      });
    });
  }
};
