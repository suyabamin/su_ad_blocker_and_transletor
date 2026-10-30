/**
 * Su_AdBlock - Translation Manager
 * Manages translation execution, chunking, local history, and engine fallback.
 * Free Forever. Private by Design.
 */

class TranslationManager {
  /**
   * @param {Object} options
   * @param {SettingsStore} options.settingsStore
   * @param {ModelLoader} [options.modelLoader]
   */
  constructor({ settingsStore, modelLoader = null }) {
    this.settingsStore = settingsStore;
    this.modelLoader = modelLoader;
    this._history = [];
    this._cache = new Map(); // In-memory cache for duplicate requests
  }

  /**
   * Translates English text to Bengali.
   * Uses neural model if loaded/ready, otherwise falls back gracefully to offline lexicon.
   * @param {string} text 
   * @returns {Promise<{ original: string, translation: string, engine: 'neural'|'lexicon', cached: boolean }>}
   */
  async translate(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Input text must be a valid string');
    }
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error('Empty text provided for translation');
    }

    // Check memory cache
    if (this._cache.has(trimmed)) {
      return {
        original: trimmed,
        translation: this._cache.get(trimmed),
        engine: 'neural',
        cached: true
      };
    }

    // Chunk text for smooth processing
    const Chunker = (typeof TextChunker !== 'undefined')
      ? TextChunker
      : (typeof require !== 'undefined' ? require('../translator/text-chunker').TextChunker : null);

    const chunks = Chunker ? Chunker.chunk(trimmed, 200) : [{ text: trimmed, isParagraphBreak: false }];

    let translatedChunks = [];
    let engineUsed = 'lexicon';

    // Check if neural model is ready
    if (this.modelLoader && this.modelLoader.status === 'ready') {
      try {
        for (const item of chunks) {
          const res = await this.modelLoader.translate(item.text);
          translatedChunks.push(res + (item.isParagraphBreak ? '\n\n' : ' '));
        }
        engineUsed = 'neural';
      } catch (e) {
        console.warn('Neural model inference error, using lexicon fallback:', e.message);
        translatedChunks = [];
      }
    }

    // If neural translation was not used or failed, use fast offline lexicon translator
    if (translatedChunks.length === 0) {
      const Lexicon = (typeof LexiconTranslator !== 'undefined')
        ? LexiconTranslator
        : (typeof require !== 'undefined' ? require('../translator/lexicon').LexiconTranslator : null);

      if (Lexicon) {
        for (const item of chunks) {
          const res = Lexicon.translate(item.text);
          translatedChunks.push(res + (item.isParagraphBreak ? '\n\n' : ' '));
        }
        engineUsed = 'lexicon';
      } else {
        translatedChunks.push(trimmed);
      }
    }

    const finalTranslation = translatedChunks.join('').trim();

    // Cache result
    this._cache.set(trimmed, finalTranslation);
    if (this._cache.size > 200) {
      const firstKey = this._cache.keys().next().value;
      this._cache.delete(firstKey);
    }

    // Record opt-in history
    await this._recordHistory(trimmed, finalTranslation, engineUsed);

    return {
      original: trimmed,
      translation: finalTranslation,
      engine: engineUsed,
      cached: false
    };
  }

  /**
   * Loads opt-in history from chrome.storage.local.
   */
  async loadHistory() {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        return resolve(this._history);
      }
      chrome.storage.local.get(['translationHistory'], (result) => {
        this._history = Array.isArray(result && result.translationHistory) ? result.translationHistory : [];
        resolve(this._history);
      });
    });
  }

  /**
   * Records a translation entry if history is opted-in.
   * Never stores full page URLs.
   * @private
   */
  async _recordHistory(original, translation, engine) {
    const isEnabled = await this.settingsStore.get('historyEnabled', false);
    if (!isEnabled) return;

    await this.loadHistory();
    const maxItems = await this.settingsStore.get('historyMaxItems', 100);

    const entry = {
      id: Date.now() + Math.random().toString(36).substring(2, 6),
      original: original.length > 300 ? original.slice(0, 300) + '...' : original,
      translation: translation.length > 300 ? translation.slice(0, 300) + '...' : translation,
      engine,
      timestamp: new Date().toISOString()
    };

    this._history.unshift(entry);
    if (this._history.length > maxItems) {
      this._history = this._history.slice(0, maxItems);
    }

    await this._saveHistory();
  }

  /**
   * Deletes a single history item by id.
   * @param {string} id 
   */
  async deleteHistoryItem(id) {
    this._history = this._history.filter(item => item.id !== id);
    await this._saveHistory();
  }

  /**
   * Clears the entire translation history.
   */
  async clearHistory() {
    this._history = [];
    await this._saveHistory();
  }

  /**
   * Returns copy of current history.
   */
  getHistory() {
    return [...this._history];
  }

  async _saveHistory() {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        return resolve();
      }
      chrome.storage.local.set({ translationHistory: this._history }, () => resolve());
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TranslationManager };
}
if (typeof globalThis !== 'undefined') {
  globalThis.TranslationManager = TranslationManager;
}
