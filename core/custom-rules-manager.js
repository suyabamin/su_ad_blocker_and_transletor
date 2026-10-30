/**
 * Su_AdBlock - Custom Rules Manager
 * Enables users to create, toggle, and manage custom DeclarativeNetRequest rules.
 * Free Forever. Private by Design.
 */

const CUSTOM_RULE_BASE_ID = 100000;

class CustomRulesManager {
  constructor() {
    this._rules = [];
  }

  /**
   * Loads custom rules from chrome.storage.local.
   * @returns {Promise<Array>}
   */
  async load() {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        return resolve(this._rules);
      }
      chrome.storage.local.get(['customRules'], (result) => {
        this._rules = Array.isArray(result && result.customRules) ? result.customRules : [];
        resolve(this._rules);
      });
    });
  }

  /**
   * Adds a new custom rule.
   * @param {Object} param0
   * @param {string} param0.pattern URL pattern or domain
   * @param {'block'|'allow'} [param0.action='block']
   * @param {string} [param0.note='']
   * @returns {Promise<{ success: boolean, rule?: Object, error?: string }>}
   */
  async addRule({ pattern, action = 'block', note = '' }) {
    if (!pattern || typeof pattern !== 'string' || !pattern.trim()) {
      return { success: false, error: 'Rule pattern is required' };
    }

    const trimmed = pattern.trim().toLowerCase();
    const cleanPattern = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed.replace(/^https?:\/\//, '')
      : trimmed;

    // Build URL filter: if domain-like without paths or wildcards, prepend || and append ^
    let urlFilter = cleanPattern;
    if (!cleanPattern.includes('/') && !cleanPattern.includes('*') && !cleanPattern.startsWith('||')) {
      urlFilter = `||${cleanPattern}^`;
    }

    // Determine unique next ID
    const maxExistingId = this._rules.reduce((max, r) => Math.max(max, r.id || 0), CUSTOM_RULE_BASE_ID - 1);
    const newId = maxExistingId + 1;

    const newRule = {
      id: newId,
      rawPattern: pattern.trim(),
      urlFilter,
      action: action === 'allow' ? 'allow' : 'block',
      priority: action === 'allow' ? 2 : 1,
      enabled: true,
      note: note.trim(),
      createdAt: new Date().toISOString()
    };

    this._rules.push(newRule);
    await this._save();
    return { success: true, rule: newRule };
  }

  /**
   * Toggles a custom rule's enabled state.
   * @param {number} ruleId 
   * @returns {Promise<boolean>}
   */
  async toggleRule(ruleId) {
    const rule = this._rules.find(r => r.id === ruleId);
    if (!rule) return false;

    rule.enabled = !rule.enabled;
    await this._save();
    return rule.enabled;
  }

  /**
   * Deletes a custom rule by ID.
   * @param {number} ruleId 
   * @returns {Promise<boolean>}
   */
  async deleteRule(ruleId) {
    const initialLen = this._rules.length;
    this._rules = this._rules.filter(r => r.id !== ruleId);
    if (this._rules.length !== initialLen) {
      await this._save();
      return true;
    }
    return false;
  }

  /**
   * Returns all stored custom rules.
   * @returns {Array<Object>}
   */
  getRules() {
    return [...this._rules];
  }

  /**
   * Converts enabled custom rules to Chrome DNR rule specifications.
   * @returns {Array<Object>}
   */
  toDNRRules() {
    return this._rules
      .filter(r => r.enabled)
      .map(r => ({
        id: r.id,
        priority: r.priority || (r.action === 'allow' ? 2 : 1),
        action: { type: r.action },
        condition: {
          urlFilter: r.urlFilter,
          resourceTypes: ['script', 'image', 'xmlhttprequest', 'sub_frame', 'ping', 'other']
        }
      }));
  }

  async _save() {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        return resolve();
      }
      chrome.storage.local.set({ customRules: this._rules }, () => resolve());
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CustomRulesManager, CUSTOM_RULE_BASE_ID };
}
if (typeof globalThis !== 'undefined') {
  globalThis.CustomRulesManager = CustomRulesManager;
  globalThis.CUSTOM_RULE_BASE_ID = CUSTOM_RULE_BASE_ID;
}
