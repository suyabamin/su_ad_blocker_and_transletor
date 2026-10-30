/**
 * Su_AdBlock - Filter Update Manager
 * Safely checks and downloads updated filter definitions via HTTPS.
 * Validates integrity, schema, and limits before updating. Preserves existing rules on failure.
 * Free Forever. Private by Design.
 */

const FILTER_ALARM_NAME = 'su_adblock_filter_check';
const DEFAULT_UPDATE_METADATA_URL = 'https://raw.githubusercontent.com/su-adblock/filters/main/version.json';

class FilterUpdateManager {
  /**
   * @param {Object} options
   * @param {SettingsStore} options.settingsStore
   * @param {FilterValidator} options.filterValidator
   * @param {DNRManager} options.dnrManager
   */
  constructor({ settingsStore, filterValidator, dnrManager }) {
    this.settingsStore = settingsStore;
    this.filterValidator = filterValidator;
    this.dnrManager = dnrManager;
    this._status = {
      lastChecked: null,
      lastUpdated: null,
      status: 'idle', // 'idle' | 'checking' | 'downloading' | 'updated' | 'error'
      message: 'Baseline offline filters active.'
    };
  }

  /**
   * Initializes periodic alarms using chrome.alarms.
   */
  async initPeriodicAlarm() {
    if (typeof chrome === 'undefined' || !chrome.alarms) return;

    chrome.alarms.get(FILTER_ALARM_NAME, async (alarm) => {
      const settings = await this.settingsStore.getSettings();
      const intervalHours = settings.filterUpdateIntervalHours || 48;
      const periodInMinutes = intervalHours * 60;

      if (!alarm) {
        chrome.alarms.create(FILTER_ALARM_NAME, {
          delayInMinutes: 30, // First check after 30 min of installation
          periodInMinutes
        });
      }
    });

    // Load persisted status
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['filterUpdateStatus'], (res) => {
        if (res && res.filterUpdateStatus) {
          this._status = { ...this._status, ...res.filterUpdateStatus };
        }
      });
    }
  }

  /**
   * Checks for updates and applies validated changes.
   * Atomic rollback: old rules are preserved if validation or download fails.
   * @param {boolean} isManual 
   * @returns {Promise<{ success: boolean, message: string, details?: Object }>}
   */
  async checkForUpdates(isManual = false) {
    this._status.status = 'checking';
    this._status.lastChecked = new Date().toISOString();
    this._status.message = 'Checking for filter updates...';
    await this._saveStatus();

    try {
      // 1. Fetch metadata (never append query parameters, user tokens, or history)
      const res = await fetch(DEFAULT_UPDATE_METADATA_URL, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-cache'
      }).catch((err) => {
        throw new Error(`Network unreachable (${err.message}). Using local baseline filters.`);
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const meta = await res.json();
      if (!meta || !meta.version) {
        throw new Error('Invalid metadata format received');
      }

      // Check version against current stored version
      const currentVersion = this._status.version || '1.0.0';
      if (meta.version === currentVersion && !isManual) {
        this._status.status = 'idle';
        this._status.message = `Filters are already up to date (v${currentVersion}).`;
        await this._saveStatus();
        return { success: true, message: this._status.message };
      }

      // 2. Validate URL endpoints (must strictly be HTTPS)
      if (meta.rulesUrl && !meta.rulesUrl.startsWith('https://')) {
        throw new Error('Insecure rules URL rejected. Only HTTPS sources are permitted.');
      }

      // 3. Download rules
      this._status.status = 'downloading';
      this._status.message = `Downloading filter rules v${meta.version}...`;
      await this._saveStatus();

      const rulesRes = await fetch(meta.rulesUrl);
      if (!rulesRes.ok) {
        throw new Error(`Rules download returned HTTP ${rulesRes.status}`);
      }

      const contentLength = rulesRes.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > 15 * 1024 * 1024) {
        throw new Error('Downloaded filter exceeds maximum allowed size (15MB)');
      }

      const rawText = await rulesRes.text();

      // 4. Verify checksum if provided
      if (meta.checksum) {
        const computed = this.filterValidator.computeChecksum(rawText);
        if (computed !== meta.checksum) {
          throw new Error(`Checksum mismatch: expected ${meta.checksum}, got ${computed}`);
        }
      }

      const parsedRules = JSON.parse(rawText);

      // 5. Validate schema, unique IDs, and rule limits
      const validation = this.filterValidator.validateRuleset(parsedRules);
      if (!validation.valid) {
        throw new Error(`Rules validation failed: ${validation.errors.slice(0, 3).join(', ')}`);
      }

      // 6. Apply rules safely
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await new Promise((resolve) => {
          chrome.storage.local.set({ downloadedFilters: parsedRules }, () => resolve());
        });
      }

      this._status.status = 'updated';
      this._status.version = meta.version;
      this._status.lastUpdated = new Date().toISOString();
      this._status.message = `Filters successfully updated to v${meta.version} (${validation.ruleCount} rules).`;
      await this._saveStatus();

      return { success: true, message: this._status.message, details: validation };
    } catch (err) {
      // Preserve existing valid baseline rules on any failure
      this._status.status = 'idle';
      this._status.message = `Update check completed: ${err.message}`;
      await this._saveStatus();
      return { success: false, message: this._status.message };
    }
  }

  /**
   * Returns current update status.
   * @returns {Object}
   */
  getStatus() {
    return { ...this._status };
  }

  async _saveStatus() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ filterUpdateStatus: this._status });
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FilterUpdateManager, FILTER_ALARM_NAME, DEFAULT_UPDATE_METADATA_URL };
}
if (typeof globalThis !== 'undefined') {
  globalThis.FilterUpdateManager = FilterUpdateManager;
}
