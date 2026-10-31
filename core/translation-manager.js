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
  }

  async translate(text) {
    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new Error('Text to translate must be a non-empty string.');
    }

    const trimmed = text.trim();

    // 1. Get user configuration
    let settings = {};
    if (this.settingsStore) {
      settings = await this.settingsStore.getSettings();
    }

    const provider = settings.translationProvider || 'google_cloud';
    const googleApiKey = settings.googleApiKey || '';
    const libreTranslateEndpoint = settings.libreTranslateEndpoint || 'https://libretranslate.com';
    const libreTranslateApiKey = settings.libreTranslateApiKey || '';
    const sourceLanguage = settings.sourceLanguage || 'en';
    const targetLanguage = settings.targetLanguage || 'bn';

    // 2. Perform online translation via OnlineTranslationService
    const OnlineService = (typeof OnlineTranslationService !== 'undefined')
      ? OnlineTranslationService
      : (typeof require !== 'undefined' ? require('./online-translation-service').OnlineTranslationService : null);

    if (OnlineService) {
      // If user selected google_cloud and has key OR selected google_free or libretranslate
      if (provider !== 'google_cloud' || (googleApiKey && googleApiKey.trim())) {
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

          return {
            original: trimmed,
            translation: result.translation,
            engine: result.engine,
            provider: result.provider,
            cached: false
          };
        } catch (err) {
          throw err;
        }
      } else if (provider === 'google_cloud' && !googleApiKey) {
        // Fall back to local structured engine or inform user
        if (this.engine) {
          return this.engine.translate(trimmed);
        }
        throw new Error('Google Cloud Translation API is not configured. Add your API credentials in Settings.');
      }
    }

    // 3. Fallback to local engine if OnlineService is not loaded
    if (this.engine) {
      return this.engine.translate(trimmed);
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
