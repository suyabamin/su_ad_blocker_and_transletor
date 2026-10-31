/**
 * Su_AdBlock - Translation Manager
 * Bridges background routing with the unified TranslationEngine and OnlineTranslationService.
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
    this._cache = new Map();
  }

  async translate(text, options = {}) {
    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new Error('Text to translate must be a non-empty string.');
    }

    const trimmed = text.trim();
    const requestId = options.requestId || null;

    // Check memory cache first
    if (this._cache.has(trimmed)) {
      const cached = this._cache.get(trimmed);
      return {
        requestId,
        original: trimmed,
        translation: cached.translation,
        engine: cached.engine,
        provider: cached.provider,
        cached: true
      };
    }

    // 1. Get user configuration
    let settings = {};
    if (this.settingsStore) {
      settings = await this.settingsStore.getSettings();
    }

    let provider = settings.translationProvider || 'google_free';
    const googleApiKey = settings.googleApiKey || '';
    const libreTranslateEndpoint = settings.libreTranslateEndpoint || 'https://libretranslate.com';
    const libreTranslateApiKey = settings.libreTranslateApiKey || '';
    const sourceLanguage = options.sourceLanguage || settings.sourceLanguage || 'en';
    const targetLanguage = options.targetLanguage || settings.targetLanguage || 'bn';

    // If user configured google_cloud without an API key, gracefully fallback to google_free
    if (provider === 'google_cloud' && (!googleApiKey || !googleApiKey.trim())) {
      console.warn('[TranslationManager] Google Cloud API key not provided; falling back to Google Free Translation.');
      provider = 'google_free';
    }

    // 2. Perform online translation via OnlineTranslationService
    const OnlineService = (typeof OnlineTranslationService !== 'undefined')
      ? OnlineTranslationService
      : (typeof require !== 'undefined' ? require('./online-translation-service').OnlineTranslationService : null);

    if (OnlineService) {
      try {
        const result = await OnlineService.translate(trimmed, {
          provider,
          googleApiKey,
          libreTranslateEndpoint,
          libreTranslateApiKey,
          sourceLanguage,
          targetLanguage
        });

        // Record history if enabled
        if (this.engine && typeof this.engine._recordHistory === 'function') {
          await this.engine._recordHistory(trimmed, result.translation, result.engine);
        }

        // Cache in-memory
        this._cache.set(trimmed, {
          translation: result.translation,
          engine: result.engine,
          provider: result.provider
        });
        if (this._cache.size > 500) {
          const oldestKey = this._cache.keys().next().value;
          this._cache.delete(oldestKey);
        }

        return {
          requestId,
          original: trimmed,
          translation: result.translation,
          engine: result.engine,
          provider: result.provider,
          cached: false
        };
      } catch (err) {
        // If online service threw and local engine is available, attempt fallback
        if (this.engine) {
          console.warn('[TranslationManager] Online service error; falling back to local engine:', err.message);
          const localRes = await this.engine.translate(trimmed);
          return { requestId, ...localRes };
        }
        throw err;
      }
    }

    // 3. Fallback to local engine if OnlineService is not loaded
    if (this.engine) {
      const localRes = await this.engine.translate(trimmed);
      return { requestId, ...localRes };
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
