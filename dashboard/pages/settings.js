/**
 * Su_AdBlock Dashboard - Settings & Statistics Controller
 * Free Forever. Private by Design.
 */

window.initSettingsPage = function () {
  const floatingToggle = document.getElementById('setting-floating-toggle');
  const autoCopyToggle = document.getElementById('setting-autocopy-toggle');
  const autoUpdateToggle = document.getElementById('setting-autoupdate-toggle');
  const resetStatsBtn = document.getElementById('reset-stats-btn');

  const providerSelect = document.getElementById('setting-translation-provider');
  const googleKeyInput = document.getElementById('setting-google-api-key');
  const toggleGoogleKeyBtn = document.getElementById('toggle-google-key-btn');
  const clearGoogleKeyBtn = document.getElementById('clear-google-key-btn');
  const googleCloudRow = document.getElementById('google-cloud-config-row');
  const libreRow = document.getElementById('libretranslate-config-row');
  const libreEndpointInput = document.getElementById('setting-libre-endpoint');
  const libreKeyInput = document.getElementById('setting-libre-key');
  const saveTranslationBtn = document.getElementById('save-translation-settings-btn');
  const testTranslationBtn = document.getElementById('test-translation-api-btn');
  const translationStatus = document.getElementById('save-translation-status');

  // Load Settings
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }, (res) => {
      if (!res || !res.success) return;
      const s = res.settings;
      if (floatingToggle) floatingToggle.checked = s.selectionFloatingEnabled !== false;
      if (autoCopyToggle) autoCopyToggle.checked = Boolean(s.autoCopyTranslation);
      if (autoUpdateToggle) autoUpdateToggle.checked = s.autoUpdateFilters !== false;

      // Translation settings
      if (providerSelect) {
        providerSelect.value = s.translationProvider || 'google_cloud';
        updateProviderVisibility(providerSelect.value);
      }
      if (googleKeyInput && s.googleApiKey) {
        googleKeyInput.value = s.googleApiKey;
      }
      if (libreEndpointInput && s.libreTranslateEndpoint) {
        libreEndpointInput.value = s.libreTranslateEndpoint;
      }
      if (libreKeyInput && s.libreTranslateApiKey) {
        libreKeyInput.value = s.libreTranslateApiKey;
      }
    });

    // Load detailed statistics
    loadDetailedStats();
  }

  function updateProviderVisibility(provider) {
    if (googleCloudRow) {
      googleCloudRow.style.display = provider === 'google_cloud' ? 'block' : 'none';
    }
    if (libreRow) {
      libreRow.style.display = provider === 'libretranslate' ? 'block' : 'none';
    }
  }

  if (providerSelect) {
    providerSelect.addEventListener('change', () => {
      updateProviderVisibility(providerSelect.value);
    });
  }

  if (toggleGoogleKeyBtn && googleKeyInput) {
    toggleGoogleKeyBtn.addEventListener('click', () => {
      if (googleKeyInput.type === 'password') {
        googleKeyInput.type = 'text';
        toggleGoogleKeyBtn.textContent = 'Hide';
      } else {
        googleKeyInput.type = 'password';
        toggleGoogleKeyBtn.textContent = 'Show';
      }
    });
  }

  if (clearGoogleKeyBtn && googleKeyInput) {
    clearGoogleKeyBtn.addEventListener('click', () => {
      googleKeyInput.value = '';
      chrome.runtime.sendMessage({
        action: 'UPDATE_SETTINGS',
        payload: { googleApiKey: '' }
      }, () => {
        showStatus('Google Cloud API Key removed.', '#1e8e3e');
      });
    });
  }

  function showStatus(msg, color) {
    if (!translationStatus) return;
    translationStatus.textContent = msg;
    translationStatus.style.color = color || '#1e8e3e';
    setTimeout(() => {
      translationStatus.textContent = '';
    }, 4000);
  }

  if (saveTranslationBtn) {
    saveTranslationBtn.addEventListener('click', () => {
      const provider = providerSelect ? providerSelect.value : 'google_cloud';
      const googleApiKey = googleKeyInput ? googleKeyInput.value.trim() : '';
      const libreEndpoint = libreEndpointInput ? libreEndpointInput.value.trim() : 'https://libretranslate.com';
      const libreKey = libreKeyInput ? libreKeyInput.value.trim() : '';

      chrome.runtime.sendMessage({
        action: 'UPDATE_SETTINGS',
        payload: {
          translationProvider: provider,
          googleApiKey,
          libreTranslateEndpoint: libreEndpoint,
          libreTranslateApiKey: libreKey
        }
      }, (res) => {
        if (res && res.success) {
          showStatus('Translation provider settings saved successfully!', '#1e8e3e');
        } else {
          showStatus('Failed to save settings: ' + (res?.error || 'Unknown error'), '#d93025');
        }
      });
    });
  }

  if (testTranslationBtn) {
    testTranslationBtn.addEventListener('click', async () => {
      testTranslationBtn.disabled = true;
      testTranslationBtn.textContent = 'Testing connection...';
      showStatus('Sending test translation request...', '#5f6368');

      chrome.runtime.sendMessage({
        action: 'TRANSLATE_TEXT',
        payload: { text: 'Hello, how are you?' }
      }, (res) => {
        testTranslationBtn.disabled = false;
        testTranslationBtn.textContent = 'Test Connection';

        if (res && res.success && res.translation) {
          showStatus(`✓ Connection successful! Translated: "${res.translation}"`, '#1e8e3e');
        } else {
          showStatus(`✗ Connection failed: ${res?.error || 'No response from translation provider.'}`, '#d93025');
        }
      });
    });
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
