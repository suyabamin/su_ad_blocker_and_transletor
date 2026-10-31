/**
 * Su_AdBlock - Message Router
 * Validates message schemas and routes requests between UI components,
 * content scripts, and background services.
 * Free Forever. Private by Design.
 */

class MessageRouter {
  /**
   * @param {Object} services
   * @param {SettingsStore} services.settingsStore
   * @param {WhitelistManager} services.whitelistManager
   * @param {CustomRulesManager} services.customRulesManager
   * @param {StatisticsManager} services.statisticsManager
   * @param {DNRManager} services.dnrManager
   * @param {FilterUpdateManager} services.filterUpdateManager
   * @param {TranslationManager} services.translationManager
   */
  constructor(services) {
    this.services = services;
  }

  /**
   * Dispatches incoming extension messages.
   * @param {Object} message 
   * @param {chrome.runtime.MessageSender} sender 
   * @returns {Promise<Object>}
   */
  async handleMessage(message, sender) {
    if (!message || typeof message !== 'object' || !message.action) {
      return { success: false, error: 'Malformed message: action is required' };
    }

    const { action, payload } = message;

    try {
      switch (action) {
        case 'GET_STATUS': {
          const settings = await this.services.settingsStore.getSettings();
          const stats = this.services.statisticsManager.getStats();
          const whitelist = this.services.whitelistManager.getList();
          const customRules = this.services.customRulesManager.getRules();
          const updateStatus = this.services.filterUpdateManager.getStatus();

          return {
            success: true,
            data: {
              protectionEnabled: settings.protectionEnabled,
              cosmeticEnabled: settings.cosmeticEnabled,
              selectionFloatingEnabled: settings.selectionFloatingEnabled,
              activeRulesets: settings.activeRulesets,
              stats,
              whitelistCount: whitelist.length,
              customRulesCount: customRules.length,
              filterVersion: updateStatus.version || '1.0.0'
            }
          };
        }

        case 'TOGGLE_PROTECTION': {
          const current = await this.services.settingsStore.get('protectionEnabled', true);
          const next = !current;
          await this.services.settingsStore.update({ protectionEnabled: next });
          await this.services.dnrManager.syncRules();
          return { success: true, protectionEnabled: next };
        }

        case 'CHECK_SITE_WHITELISTED': {
          const url = (payload && payload.url) || (sender && sender.tab && sender.tab.url);
          const isWhitelisted = this.services.whitelistManager.isWhitelisted(url);
          return { success: true, isWhitelisted };
        }

        case 'TOGGLE_SITE_WHITELIST': {
          const domain = payload && payload.domain;
          if (!domain) return { success: false, error: 'Domain is required' };
          const result = await this.services.whitelistManager.toggle(domain);
          await this.services.dnrManager.syncRules();
          return { success: true, ...result };
        }

        case 'GET_WHITELIST': {
          const list = this.services.whitelistManager.getList();
          return { success: true, whitelist: list };
        }

        case 'ADD_WHITELIST_DOMAIN': {
          const res = await this.services.whitelistManager.add(payload.domain);
          if (res.success) {
            await this.services.dnrManager.syncRules();
          }
          return res;
        }

        case 'REMOVE_WHITELIST_DOMAIN': {
          const res = await this.services.whitelistManager.remove(payload.domain);
          await this.services.dnrManager.syncRules();
          return res;
        }

        case 'GET_CUSTOM_RULES': {
          const rules = this.services.customRulesManager.getRules();
          return { success: true, rules };
        }

        case 'ADD_CUSTOM_RULE': {
          const res = await this.services.customRulesManager.addRule(payload);
          if (res.success) {
            await this.services.dnrManager.syncRules();
          }
          return res;
        }

        case 'TOGGLE_CUSTOM_RULE': {
          const enabled = await this.services.customRulesManager.toggleRule(payload.ruleId);
          await this.services.dnrManager.syncRules();
          return { success: true, enabled };
        }

        case 'DELETE_CUSTOM_RULE': {
          const deleted = await this.services.customRulesManager.deleteRule(payload.ruleId);
          if (deleted) {
            await this.services.dnrManager.syncRules();
          }
          return { success: true, deleted };
        }

        case 'GET_STATISTICS': {
          const stats = this.services.statisticsManager.getStats();
          return { success: true, stats };
        }

        case 'RESET_STATISTICS': {
          const stats = await this.services.statisticsManager.reset();
          return { success: true, stats };
        }

        case 'RECORD_ELEMENTS_HIDDEN': {
          const count = (payload && payload.count) || 1;
          await this.services.statisticsManager.recordElementsHidden(count);
          return { success: true };
        }

        case 'GET_COSMETIC_SELECTORS': {
          try {
            const url = chrome.runtime.getURL('cosmetic/selectors.json');
            const res = await fetch(url);
            if (!res.ok) {
              return { success: false, error: `Failed to load selectors: HTTP ${res.status}` };
            }
            const data = await res.json();
            return { success: true, data };
          } catch (err) {
            return { success: false, error: err.message };
          }
        }

        case 'TRANSLATE_TEXT': {
          if (!payload || !payload.text) {
            return { success: false, error: 'Text to translate is missing' };
          }
          const result = await this.services.translationManager.translate(payload.text);
          return { success: true, ...result };
        }

        case 'GET_TRANSLATION_MODEL_STATUS': {
          const state = this.services.translationManager.getState();
          return { success: true, state };
        }

        case 'GET_TRANSLATION_HISTORY': {
          await this.services.translationManager.loadHistory();
          const history = this.services.translationManager.getHistory();
          return { success: true, history };
        }

        case 'DELETE_TRANSLATION_HISTORY_ITEM': {
          await this.services.translationManager.deleteHistoryItem(payload.id);
          return { success: true };
        }

        case 'CLEAR_TRANSLATION_HISTORY': {
          await this.services.translationManager.clearHistory();
          return { success: true };
        }

        case 'CHECK_FILTER_UPDATES': {
          const updateRes = await this.services.filterUpdateManager.checkForUpdates(true);
          return updateRes;
        }

        case 'GET_FILTER_UPDATE_STATUS': {
          const status = this.services.filterUpdateManager.getStatus();
          return { success: true, status };
        }

        case 'GET_SETTINGS': {
          const settings = await this.services.settingsStore.getSettings();
          return { success: true, settings };
        }

        case 'UPDATE_SETTINGS': {
          const updated = await this.services.settingsStore.update(payload || {});
          await this.services.dnrManager.syncRules();
          return { success: true, settings: updated };
        }

        case 'OPEN_DASHBOARD': {
          const url = chrome.runtime.getURL('dashboard/dashboard.html');
          if (payload && payload.page) {
            chrome.tabs.create({ url: `${url}#${payload.page}` });
          } else {
            chrome.tabs.create({ url });
          }
          return { success: true };
        }

        case 'OPEN_PDF_READER': {
          const url = chrome.runtime.getURL('translator/pdf-reader/reader.html');
          chrome.tabs.create({ url });
          return { success: true };
        }

        default:
          return { success: false, error: `Unknown action: "${action}"` };
      }
    } catch (err) {
      console.error(`Su_AdBlock MessageRouter error on action "${action}":`, err);
      return { success: false, error: err.message };
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MessageRouter };
}
if (typeof globalThis !== 'undefined') {
  globalThis.MessageRouter = MessageRouter;
}
