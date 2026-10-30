/**
 * Su_AdBlock - Whitelist Manager
 * Handles user-allowed websites, precise domain/subdomain matching,
 * and DNR dynamic rule generation for allowlist exceptions.
 * Free Forever. Private by Design.
 */

const WHITELIST_RULE_BASE_ID = 200000;

class WhitelistManager {
  constructor() {
    this._whitelist = new Set();
  }

  /**
   * Sanitizes a URL or domain string into a clean lowercase hostname.
   * @param {string} input 
   * @returns {string} Sanitized hostname or empty string if invalid
   */
  static cleanHostname(input) {
    if (!input || typeof input !== 'string') return '';
    let raw = input.trim().toLowerCase();

    // Remove leading protocols if present
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      try {
        const parsed = new URL(raw);
        raw = parsed.hostname;
      } catch {
        raw = raw.replace(/^https?:\/\//, '');
      }
    }

    // Strip trailing slashes, paths, and ports
    raw = raw.split('/')[0].split(':')[0].split('?')[0].split('#')[0];

    // Remove leading wildcards like *.example.com -> example.com
    if (raw.startsWith('*.')) {
      raw = raw.slice(2);
    } else if (raw.startsWith('.')) {
      raw = raw.slice(1);
    }

    // Basic domain validation
    if (!raw.includes('.') || raw.length < 3 || /[^a-z0-9.-]/.test(raw)) {
      return '';
    }

    return raw;
  }

  /**
   * Checks whether a target hostname matches an allowed domain.
   * Implements strict exact match or subdomain match.
   * e.g., 'example.com' matches 'example.com' and 'sub.example.com',
   * but does NOT match 'notexample.com' or 'example.com.org'.
   * @param {string} targetHostname 
   * @param {string} allowedDomain 
   * @returns {boolean}
   */
  static isMatch(targetHostname, allowedDomain) {
    const target = WhitelistManager.cleanHostname(targetHostname);
    const allowed = WhitelistManager.cleanHostname(allowedDomain);

    if (!target || !allowed) return false;
    if (target === allowed) return true;

    // Subdomain matching: target must end with '.' + allowed
    return target.endsWith('.' + allowed);
  }

  /**
   * Loads the current allowlist from chrome.storage.local.
   * @returns {Promise<string[]>}
   */
  async load() {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        return resolve(Array.from(this._whitelist));
      }
      chrome.storage.local.get(['whitelist'], (result) => {
        const list = Array.isArray(result && result.whitelist) ? result.whitelist : [];
        this._whitelist = new Set(list.map(WhitelistManager.cleanHostname).filter(Boolean));
        resolve(Array.from(this._whitelist));
      });
    });
  }

  /**
   * Returns whether a URL or hostname is currently whitelisted.
   * @param {string} urlOrHostname 
   * @returns {boolean}
   */
  isWhitelisted(urlOrHostname) {
    const host = WhitelistManager.cleanHostname(urlOrHostname);
    if (!host) return false;

    for (const allowed of this._whitelist) {
      if (WhitelistManager.isMatch(host, allowed)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Adds a domain to the allowlist.
   * @param {string} domainOrUrl 
   * @returns {Promise<{ success: boolean, domain: string, error?: string }>}
   */
  async add(domainOrUrl) {
    const domain = WhitelistManager.cleanHostname(domainOrUrl);
    if (!domain) {
      return { success: false, domain: '', error: 'Invalid domain name or hostname' };
    }

    this._whitelist.add(domain);
    await this._save();
    return { success: true, domain };
  }

  /**
   * Removes a domain from the allowlist.
   * @param {string} domainOrUrl 
   * @returns {Promise<{ success: boolean, domain: string }>}
   */
  async remove(domainOrUrl) {
    const domain = WhitelistManager.cleanHostname(domainOrUrl);
    this._whitelist.delete(domain);
    await this._save();
    return { success: true, domain };
  }

  /**
   * Toggles the allowlist state of a domain.
   * @param {string} domainOrUrl 
   * @returns {Promise<{ whitelisted: boolean, domain: string }>}
   */
  async toggle(domainOrUrl) {
    const domain = WhitelistManager.cleanHostname(domainOrUrl);
    if (!domain) return { whitelisted: false, domain: '' };

    if (this.isWhitelisted(domain)) {
      await this.remove(domain);
      return { whitelisted: false, domain };
    } else {
      await this.add(domain);
      return { whitelisted: true, domain };
    }
  }

  /**
   * Clears the entire allowlist.
   * @returns {Promise<void>}
   */
  async clear() {
    this._whitelist.clear();
    await this._save();
  }

  /**
   * Exports the list as an array.
   * @returns {string[]}
   */
  getList() {
    return Array.from(this._whitelist).sort();
  }

  /**
   * Converts the allowlist into Chrome DeclarativeNetRequest dynamic rules.
   * Uses high priority (priority: 2) and 'allowAllRequests' to unblock all frames/requests initiated on allowed sites.
   * @returns {Object[]} Array of DNR rules
   */
  toDNRRules() {
    const list = this.getList();
    return list.map((domain, index) => ({
      id: WHITELIST_RULE_BASE_ID + index,
      priority: 2,
      action: { type: 'allowAllRequests' },
      condition: {
        initiatorDomains: [domain],
        resourceTypes: ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'font', 'object', 'xmlhttprequest', 'ping', 'csp_report', 'media', 'websocket', 'other']
      }
    }));
  }

  async _save() {
    const list = Array.from(this._whitelist);
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        return resolve();
      }
      chrome.storage.local.set({ whitelist: list }, () => resolve());
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WhitelistManager, WHITELIST_RULE_BASE_ID };
}
if (typeof globalThis !== 'undefined') {
  globalThis.WhitelistManager = WhitelistManager;
  globalThis.WHITELIST_RULE_BASE_ID = WHITELIST_RULE_BASE_ID;
}
