/**
 * Su_AdBlock - Filter Validator and ABP Converter
 * Enforces strict Chrome Manifest V3 DeclarativeNetRequest validation,
 * checksum verification, and safe ABP syntax conversion.
 */

const DNR_RESOURCE_TYPES = [
  'main_frame', 'sub_frame', 'stylesheet', 'script', 'image',
  'font', 'object', 'xmlhttprequest', 'ping', 'csp_report',
  'media', 'websocket', 'other'
];

const DNR_ACTION_TYPES = [
  'block', 'allow', 'allowAllRequests', 'redirect', 'upgradeScheme', 'modifyHeaders'
];

// Chrome Manifest V3 DeclarativeNetRequest limits
const DNR_LIMITS = {
  MAX_DYNAMIC_RULES: 30000,
  MAX_STATIC_RULES_PER_SET: 50000,
  MAX_TOTAL_STATIC_RULES: 300000,
  MAX_FILE_SIZE_BYTES: 15 * 1024 * 1024 // 15MB max file size
};

class FilterValidator {
  /**
   * Validates a single DNR rule object against the MV3 schema.
   * @param {Object} rule 
   * @returns {{ valid: boolean, error?: string }}
   */
  static validateDNRRule(rule) {
    if (!rule || typeof rule !== 'object') {
      return { valid: false, error: 'Rule must be an object' };
    }

    if (!Number.isInteger(rule.id) || rule.id <= 0) {
      return { valid: false, error: `Invalid rule id: ${rule.id}. Must be a positive integer.` };
    }

    if (rule.priority !== undefined) {
      if (!Number.isInteger(rule.priority) || rule.priority < 1) {
        return { valid: false, error: `Rule ${rule.id}: priority must be a positive integer >= 1` };
      }
    }

    if (!rule.action || typeof rule.action !== 'object') {
      return { valid: false, error: `Rule ${rule.id}: action must be an object` };
    }

    if (!DNR_ACTION_TYPES.includes(rule.action.type)) {
      return { valid: false, error: `Rule ${rule.id}: invalid action type "${rule.action.type}"` };
    }

    if (!rule.condition || typeof rule.condition !== 'object') {
      return { valid: false, error: `Rule ${rule.id}: condition must be an object` };
    }

    const { urlFilter, regexFilter, requestDomains, initiatorDomains, resourceTypes } = rule.condition;

    if (!urlFilter && !regexFilter && (!requestDomains || !requestDomains.length)) {
      return { valid: false, error: `Rule ${rule.id}: condition must define urlFilter, regexFilter, or requestDomains` };
    }

    if (regexFilter) {
      try {
        new RegExp(regexFilter);
      } catch (e) {
        return { valid: false, error: `Rule ${rule.id}: invalid regexFilter syntax (${e.message})` };
      }
    }

    if (resourceTypes && Array.isArray(resourceTypes)) {
      for (const rt of resourceTypes) {
        if (!DNR_RESOURCE_TYPES.includes(rt)) {
          return { valid: false, error: `Rule ${rule.id}: unknown resourceType "${rt}"` };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Validates an array of DNR rules for uniqueness, limits, and schema.
   * @param {Array<Object>} rules 
   * @param {Object} options 
   * @returns {{ valid: boolean, errors: string[], ruleCount: number, duplicateIds: number[] }}
   */
  static validateRuleset(rules, options = {}) {
    const maxLimit = options.maxLimit || DNR_LIMITS.MAX_STATIC_RULES_PER_SET;
    const errors = [];
    const seenIds = new Set();
    const duplicateIds = [];

    if (!Array.isArray(rules)) {
      return {
        valid: false,
        errors: ['Ruleset must be an array of rule objects'],
        ruleCount: 0,
        duplicateIds: []
      };
    }

    if (rules.length > maxLimit) {
      errors.push(`Ruleset size (${rules.length}) exceeds browser limit of ${maxLimit}`);
    }

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const result = this.validateDNRRule(rule);
      if (!result.valid) {
        errors.push(`[Index ${i}] ${result.error}`);
      } else {
        if (seenIds.has(rule.id)) {
          duplicateIds.push(rule.id);
          errors.push(`Duplicate rule ID detected: ${rule.id}`);
        } else {
          seenIds.add(rule.id);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      ruleCount: rules.length,
      duplicateIds
    };
  }

  /**
   * Simple deterministic FNV-1a hash calculation for string/JSON checksum verification.
   * @param {string} str 
   * @returns {string} Hexadecimal hash
   */
  static computeChecksum(str) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  }

  /**
   * Converts ABP / EasyList format lines into DeclarativeNetRequest JSON format.
   * Reports converted, unsupported, skipped, and cosmetic rules.
   * @param {string} text Raw filter list content
   * @param {number} startId Starting integer for deterministic rule IDs
   * @returns {{ rules: Object[], cosmeticSelectors: string[], report: Object }}
   */
  static convertAbpList(text, startId = 50000) {
    const lines = text.split(/\r?\n/);
    const rules = [];
    const cosmeticSelectors = [];
    let currentId = startId;

    const report = {
      totalLines: lines.length,
      convertedRules: 0,
      cosmeticRules: 0,
      skippedComments: 0,
      unsupportedRules: 0,
      invalidSyntax: 0
    };

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      // Skip comments and headers
      if (line.startsWith('!') || line.startsWith('[Adblock')) {
        report.skippedComments++;
        continue;
      }

      // Check for cosmetic rules (## or #?#)
      if (line.includes('##') || line.includes('#?#')) {
        const parts = line.split(/##|#\?#/);
        const selector = parts[1] ? parts[1].trim() : '';
        if (selector && !selector.includes(':has(') && !selector.includes(':-abp-')) {
          cosmeticSelectors.push(selector);
          report.cosmeticRules++;
        } else {
          report.unsupportedRules++;
        }
        continue;
      }

      // Exception rules @@||domain^
      const isException = line.startsWith('@@');
      const cleanLine = isException ? line.slice(2) : line;

      // Lines with special options like $websocket, $domain, etc.
      if (cleanLine.includes('$')) {
        report.unsupportedRules++;
        continue;
      }

      // Handle simple domain or path rules
      if (cleanLine.startsWith('||') && cleanLine.includes('^')) {
        const domainEnd = cleanLine.indexOf('^');
        const domain = cleanLine.slice(2, domainEnd);

        if (domain && !domain.includes('*') && !domain.includes('/')) {
          const rule = {
            id: currentId++,
            priority: isException ? 2 : 1,
            action: { type: isException ? 'allow' : 'block' },
            condition: {
              urlFilter: `||${domain}^`,
              resourceTypes: ['script', 'image', 'xmlhttprequest', 'sub_frame', 'ping', 'other']
            }
          };
          rules.push(rule);
          report.convertedRules++;
          continue;
        }
      }

      // If it has unsupported patterns or wildcards
      if (line.includes('/') || line.includes('*')) {
        report.unsupportedRules++;
      } else {
        report.invalidSyntax++;
      }
    }

    return {
      rules,
      cosmeticSelectors,
      report
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FilterValidator, DNR_LIMITS, DNR_RESOURCE_TYPES, DNR_ACTION_TYPES };
}
if (typeof globalThis !== 'undefined') {
  globalThis.FilterValidator = FilterValidator;
  globalThis.DNR_LIMITS = DNR_LIMITS;
}
