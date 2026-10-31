/**
 * Su_AdBlock - Settings Store
 * Manages configuration and persistent state using chrome.storage.local.
 * Free Forever. Private by Design.
 */

const DEFAULT_SETTINGS = {
  protectionEnabled: true,
  cosmeticEnabled: true,
  selectionFloatingEnabled: true,
  autoCopyTranslation: false,
  historyEnabled: false,
  historyMaxItems: 100,
  autoUpdateFilters: true,
  filterUpdateIntervalHours: 48,
  deviceType: 'auto',
  theme: 'dark-emerald',
  translationProvider: 'google_cloud', // 'google_cloud' | 'google_free' | 'libretranslate'
  googleApiKey: '',
  libreTranslateEndpoint: 'https://libretranslate.com',
  libreTranslateApiKey: '',
  sourceLanguage: 'en',
  targetLanguage: 'bn',
  activeRulesets: {
    ads: true,
    trackers: true,
    annoyances: true
  }
};

class SettingsStore {
  constructor() {
    this._cache = null;
  }

  /**
   * Retrieves all settings, merged with defaults.
   * @returns {Promise<Object>}
   */
  async getSettings() {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        return resolve({ ...DEFAULT_SETTINGS });
      }
      chrome.storage.local.get(['settings'], (result) => {
        const stored = result && result.settings ? result.settings : {};
        const merged = { ...DEFAULT_SETTINGS, ...stored };
        merged.activeRulesets = { ...DEFAULT_SETTINGS.activeRulesets, ...(stored.activeRulesets || {}) };
        this._cache = merged;
        resolve(merged);
      });
    });
  }

  /**
   * Retrieves a single setting by key.
   * @param {string} key 
   * @param {*} defaultValue 
   * @returns {Promise<*>}
   */
  async get(key, defaultValue = undefined) {
    const settings = await this.getSettings();
    if (key in settings) {
      return settings[key];
    }
    return defaultValue !== undefined ? defaultValue : DEFAULT_SETTINGS[key];
  }

  /**
   * Updates partial settings and persists them to chrome.storage.local.
   * @param {Object} partial 
   * @returns {Promise<Object>}
   */
  async update(partial) {
    const current = await this.getSettings();
    const updated = { ...current, ...partial };
    if (partial.activeRulesets) {
      updated.activeRulesets = { ...current.activeRulesets, ...partial.activeRulesets };
    }

    return new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        this._cache = updated;
        return resolve(updated);
      }
      chrome.storage.local.set({ settings: updated }, () => {
        if (chrome.runtime && chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        this._cache = updated;
        resolve(updated);
      });
    });
  }

  /**
   * Resets all settings to their factory defaults.
   * @returns {Promise<Object>}
   */
  async resetToDefaults() {
    return this.update(DEFAULT_SETTINGS);
  }
}

// Support both ES Module, CommonJS, and Browser globals
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SettingsStore, DEFAULT_SETTINGS };
}
if (typeof globalThis !== 'undefined') {
  globalThis.SettingsStore = SettingsStore;
  globalThis.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
}
