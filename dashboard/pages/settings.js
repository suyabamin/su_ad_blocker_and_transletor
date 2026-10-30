/**
 * Su_AdBlock Dashboard - Settings & Statistics Controller
 * Free Forever. Private by Design.
 */

window.initSettingsPage = function () {
  const floatingToggle = document.getElementById('setting-floating-toggle');
  const autoCopyToggle = document.getElementById('setting-autocopy-toggle');
  const autoUpdateToggle = document.getElementById('setting-autoupdate-toggle');
  const resetStatsBtn = document.getElementById('reset-stats-btn');

  // Load Settings
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }, (res) => {
      if (!res || !res.success) return;
      const s = res.settings;
      if (floatingToggle) floatingToggle.checked = s.selectionFloatingEnabled !== false;
      if (autoCopyToggle) autoCopyToggle.checked = Boolean(s.autoCopyTranslation);
      if (autoUpdateToggle) autoUpdateToggle.checked = s.autoUpdateFilters !== false;
    });

    // Load detailed statistics
    loadDetailedStats();
  }

  function loadDetailedStats() {
    chrome.runtime.sendMessage({ action: 'GET_STATISTICS' }, (res) => {
      if (!res || !res.success || !res.stats) return;
      const st = res.stats;
      const allAds = document.getElementById('stat-alltime-ads');
      const allTrackers = document.getElementById('stat-alltime-trackers');
      const allElements = document.getElementById('stat-alltime-elements');
      const sessionAds = document.getElementById('stat-session-ads');

      if (allAds) allAds.textContent = (st.allTime && st.allTime.adsBlocked) || 0;
      if (allTrackers) allTrackers.textContent = (st.allTime && st.allTime.trackersBlocked) || 0;
      if (allElements) allElements.textContent = (st.allTime && st.allTime.elementsHidden) || 0;
      if (sessionAds) sessionAds.textContent = (st.session && st.session.adsBlocked) || 0;
    });
  }

  if (floatingToggle) {
    floatingToggle.addEventListener('change', () => {
      chrome.runtime.sendMessage({
        action: 'UPDATE_SETTINGS',
        payload: { selectionFloatingEnabled: floatingToggle.checked }
      });
    });
  }

  if (autoCopyToggle) {
    autoCopyToggle.addEventListener('change', () => {
      chrome.runtime.sendMessage({
        action: 'UPDATE_SETTINGS',
        payload: { autoCopyTranslation: autoCopyToggle.checked }
      });
    });
  }

  if (autoUpdateToggle) {
    autoUpdateToggle.addEventListener('change', () => {
      chrome.runtime.sendMessage({
        action: 'UPDATE_SETTINGS',
        payload: { autoUpdateFilters: autoUpdateToggle.checked }
      });
    });
  }

  if (resetStatsBtn) {
    resetStatsBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all blocking statistics counters?')) {
        chrome.runtime.sendMessage({ action: 'RESET_STATISTICS' }, () => {
          loadDetailedStats();
        });
      }
    });
  }
};
