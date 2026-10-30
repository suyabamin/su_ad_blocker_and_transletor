/**
 * Su_AdBlock Dashboard - Overview Page Controller
 * Free Forever. Private by Design.
 */

window.initOverviewPage = function () {
  const masterToggle = document.getElementById('overview-master-toggle');
  const adsCount = document.getElementById('overview-ads-count');
  const trackersCount = document.getElementById('overview-trackers-count');
  const elementsCount = document.getElementById('overview-elements-count');
  const statusBadge = document.getElementById('overview-status-badge');

  function updateStatus(isProtected) {
    if (masterToggle) masterToggle.checked = isProtected;
    if (statusBadge) {
      if (isProtected) {
        statusBadge.textContent = 'Protected';
        statusBadge.className = 'metric-value badge-active';
      } else {
        statusBadge.textContent = 'Paused';
        statusBadge.className = 'metric-value';
        statusBadge.style.color = '#ef4444';
      }
    }
  }

  // Load initial status
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({ action: 'GET_STATUS' }, (res) => {
      if (!res || !res.success) return;
      const data = res.data;
      updateStatus(data.protectionEnabled);

      if (data.stats && data.stats.allTime) {
        if (adsCount) adsCount.textContent = data.stats.allTime.adsBlocked || 0;
        if (trackersCount) trackersCount.textContent = data.stats.allTime.trackersBlocked || 0;
        if (elementsCount) elementsCount.textContent = data.stats.allTime.elementsHidden || 0;
      }
    });
  }

  // Master Toggle Change
  if (masterToggle) {
    masterToggle.addEventListener('change', () => {
      chrome.runtime.sendMessage({ action: 'TOGGLE_PROTECTION' }, (res) => {
        if (res && res.success) {
          updateStatus(res.protectionEnabled);
        }
      });
    });
  }
};
