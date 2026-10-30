/**
 * Su_AdBlock - Declarative Net Request (DNR) Manager
 * Controls static rulesets, dynamic rules (custom rules & whitelist), and rule matching.
 * Free Forever. Private by Design.
 */

const STATIC_RULESET_IDS = ['ruleset_ads', 'ruleset_trackers', 'ruleset_annoyances'];

class DNRManager {
  /**
   * @param {Object} options
   * @param {SettingsStore} options.settingsStore
   * @param {WhitelistManager} options.whitelistManager
   * @param {CustomRulesManager} options.customRulesManager
   * @param {StatisticsManager} options.statisticsManager
   */
  constructor({ settingsStore, whitelistManager, customRulesManager, statisticsManager }) {
    this.settingsStore = settingsStore;
    this.whitelistManager = whitelistManager;
    this.customRulesManager = customRulesManager;
    this.statisticsManager = statisticsManager;
  }

  /**
   * Synchronizes static and dynamic rules based on current settings and allowlist.
   */
  async syncRules() {
    if (typeof chrome === 'undefined' || !chrome.declarativeNetRequest) {
      return { success: false, reason: 'DNR API unavailable' };
    }

    const settings = await this.settingsStore.getSettings();
    const isProtectionOn = Boolean(settings.protectionEnabled);

    // 1. Sync Static Rulesets
    try {
      const enableRulesetIds = [];
      const disableRulesetIds = [];

      for (const rulesetId of STATIC_RULESET_IDS) {
        const key = rulesetId.replace('ruleset_', '');
        const isRulesetActive = isProtectionOn && (!settings.activeRulesets || settings.activeRulesets[key] !== false);
        if (isRulesetActive) {
          enableRulesetIds.push(rulesetId);
        } else {
          disableRulesetIds.push(rulesetId);
        }
      }

      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds,
        disableRulesetIds
      });
    } catch (err) {
      console.warn('Su_AdBlock DNRManager: static ruleset update warning:', err.message);
    }

    // 2. Sync Dynamic Rules (Whitelist exceptions + Custom rules)
    try {
      const existingDynamicRules = await chrome.declarativeNetRequest.getDynamicRules();
      const removeRuleIds = existingDynamicRules.map(r => r.id);

      let addRules = [];
      if (isProtectionOn) {
        const whitelistRules = this.whitelistManager.toDNRRules();
        const customRules = this.customRulesManager.toDNRRules();
        addRules = [...whitelistRules, ...customRules];
      }

      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds,
        addRules
      });

      return {
        success: true,
        staticRulesetsActive: isProtectionOn,
        dynamicRulesCount: addRules.length
      };
    } catch (err) {
      console.error('Su_AdBlock DNRManager: dynamic rule update failed:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Initializes real debug listener for matched rules to record statistics accurately.
   */
  initMatchedRuleListener() {
    if (typeof chrome === 'undefined' || !chrome.declarativeNetRequest) return;
    if (!chrome.declarativeNetRequest.onRuleMatchedDebug) return;

    try {
      chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
        if (!info || !info.rule) return;
        const ruleId = info.rule.ruleId;
        const rulesetId = info.rule.rulesetId;

        // Classify based on ruleset ID or rule ID ranges
        if (rulesetId === 'ruleset_trackers' || (ruleId >= 10000 && ruleId < 20000)) {
          this.statisticsManager.recordTrackerBlocked(1);
        } else if (rulesetId === 'ruleset_ads' || (ruleId >= 1000 && ruleId < 10000)) {
          this.statisticsManager.recordAdBlocked(1);
        } else if (ruleId >= 100000 && ruleId < 200000) {
          // Custom rule blocked
          this.statisticsManager.recordAdBlocked(1);
        }
      });
    } catch (e) {
      // Debug listener not permitted in non-developer unpacked environments; fail silently
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DNRManager, STATIC_RULESET_IDS };
}
if (typeof globalThis !== 'undefined') {
  globalThis.DNRManager = DNRManager;
  globalThis.STATIC_RULESET_IDS = STATIC_RULESET_IDS;
}
