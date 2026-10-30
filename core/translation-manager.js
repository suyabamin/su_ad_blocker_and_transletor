/**
 * Su_AdBlock - Translation Manager
 * Bridges background routing with the unified TranslationEngine.
 * Free Forever. Private by Design.
 */

class TranslationManager {
  /**
   * @param {Object} options
   * @param {SettingsStore} options.settingsStore
   * @param {TranslationEngine} [options.engine]
   */
  constructor({ settingsStore, engine = null }) {
    this.settingsStore = settingsStore;
    const EngineClass = (typeof TranslationEngine !== 'undefined')
      ? TranslationEngine
      : (typeof require !== 'undefined' ? require('./translation-engine').TranslationEngine : null);

    this.engine = engine || (EngineClass ? new EngineClass({ settingsStore }) : null);
  }

  async translate(text) {
    if (this.engine) {
      return this.engine.translate(text);
    }
    throw new Error('Translation Engine unavailable.');
  }

  async loadHistory() {
    if (this.engine) return this.engine.loadHistory();
    return [];
  }

  async deleteHistoryItem(id) {
    if (this.engine) return this.engine.deleteHistoryItem(id);
  }

  async clearHistory() {
    if (this.engine) return this.engine.clearHistory();
  }

  getHistory() {
    if (this.engine) return this.engine.getHistory();
    return [];
  }

  getState() {
    if (this.engine) return this.engine.getState();
    return {};
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TranslationManager };
}
if (typeof globalThis !== 'undefined') {
  globalThis.TranslationManager = TranslationManager;
}
