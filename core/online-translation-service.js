/**
 * Su_AdBlock - Online Translation Service
 * Modular translation provider supporting Google Cloud Translation API (v2),
 * LibreTranslate, and Google Translation endpoints.
 * Free Forever. Private by Design.
 */

// Helper to decode HTML entities returned by cloud translation APIs
function decodeHtmlEntities(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&apos;/g, "'");
}

/**
 * Validates that the output contains authentic Bengali Unicode script (U+0980–U+09FF).
 * Rejects untranslated English echo.
 */
function validateBengaliTranslation(input, translated) {
  if (!translated || typeof translated !== 'string') {
    return { valid: false, error: 'Empty or invalid response from translation provider.' };
  }
  const cleanInput = input.trim();
  const cleanTranslated = translated.trim();

  if (!cleanTranslated) {
    return { valid: false, error: 'Translation provider returned empty text.' };
  }

  // Reject identical echo
  if (cleanTranslated.toLowerCase() === cleanInput.toLowerCase()) {
    return { valid: false, error: 'Translation failed: The provider returned untranslated English text.' };
  }

  // Count Bengali Unicode characters
  const bengaliChars = (cleanTranslated.match(/[\u0980-\u09FF]/g) || []).length;
  const nonSpaceChars = cleanTranslated.replace(/\s/g, '').length;

  if (nonSpaceChars === 0) {
    return { valid: false, error: 'Translation output has no valid characters.' };
  }

  const ratio = bengaliChars / nonSpaceChars;
  // Require at least 15% Bengali characters (allows technical terms, URLs, brand names to stay in English)
  if (ratio < 0.15) {
    return {
      valid: false,
      error: `Translation verification failed: Only ${Math.round(ratio * 100)}% Bengali script detected. Provider returned English echo.`
    };
  }

  return { valid: true, ratio };
}

/**
 * Splits large text into safe paragraphs/sentences (< 2,000 characters) preserving order.
 */
function chunkText(text, maxChunkLength = 1500) {
  if (!text || text.length <= maxChunkLength) return [text];

  const chunks = [];
  const paragraphs = text.split(/\n\s*\n/);
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) continue;

    if (paragraph.length > maxChunkLength) {
      // Split long paragraph by sentences
      const sentences = paragraph.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [paragraph];
      for (const sentence of sentences) {
        if ((currentChunk + ' ' + sentence).length > maxChunkLength && currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
        }
      }
    } else {
      if ((currentChunk + '\n\n' + paragraph).length > maxChunkLength && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk = currentChunk ? currentChunk + '\n\n' + paragraph : paragraph;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

class OnlineTranslationService {
  /**
   * Translates English text to Bengali using configured provider.
   * @param {string} text - Source text
   * @param {Object} options - Provider config options
   * @returns {Promise<{ original: string, translation: string, engine: string, provider: string }>}
   */
  static async translate(text, options = {}) {
    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new Error('Text to translate must be a non-empty string.');
    }

    const trimmed = text.trim();
    const provider = options.provider || 'google_free';
    const sourceLang = options.sourceLanguage || 'en';
    const targetLang = options.targetLanguage || 'bn';

    // Chunk text if long
    const chunks = chunkText(trimmed, 1500);
    const translatedChunks = [];

    for (const chunk of chunks) {
      let chunkResult = '';
      if (provider === 'google_cloud') {
        if (!options.googleApiKey || !options.googleApiKey.trim()) {
          throw new Error('Google Cloud Translation API is not configured. Add your API credentials in Settings.');
        }
        chunkResult = await this._translateGoogleCloud(chunk, options.googleApiKey, sourceLang, targetLang);
      } else if (provider === 'libretranslate') {
        chunkResult = await this._translateLibreTranslate(chunk, options.libreTranslateEndpoint, options.libreTranslateApiKey, sourceLang, targetLang);
      } else {
        // Default: Reliable Google Translation Engine
        chunkResult = await this._translateGoogleFree(chunk, sourceLang, targetLang);
      }
      translatedChunks.push(chunkResult);
    }

    const finalTranslation = translatedChunks.join('\n\n');

    // Validate Bengali Output
    const validation = validateBengaliTranslation(trimmed, finalTranslation);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    let engineName = 'Google Translation';
    if (provider === 'google_cloud') {
      engineName = 'Google Cloud Translation API';
    } else if (provider === 'libretranslate') {
      engineName = 'LibreTranslate API';
    }

    return {
      original: trimmed,
      translation: finalTranslation,
      engine: engineName,
      provider
    };
  }

  /**
   * Google Cloud Translation API v2
   * https://translation.googleapis.com/language/translate/v2
   */
  static async _translateGoogleCloud(text, apiKey, source = 'en', target = 'bn') {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey.trim())}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: text,
          source,
          target,
          format: 'text'
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errorDetail = `HTTP ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.error && errData.error.message) {
            errorDetail = errData.error.message;
          }
        } catch (_) {}

        if (response.status === 400) throw new Error(`Google Cloud API 400: Invalid request (${errorDetail})`);
        if (response.status === 401 || response.status === 403) throw new Error(`Google Cloud API: Invalid API Key or Billing Disabled (${errorDetail})`);
        if (response.status === 429) throw new Error(`Google Cloud API: Rate limit exceeded (HTTP 429)`);
        if (response.status >= 500) throw new Error(`Google Cloud API: Service error (HTTP ${response.status})`);
        throw new Error(`Google Cloud API Error: ${errorDetail}`);
      }

      const data = await response.json();
      if (
        data &&
        data.data &&
        Array.isArray(data.data.translations) &&
        data.data.translations[0] &&
        data.data.translations[0].translatedText
      ) {
        return decodeHtmlEntities(data.data.translations[0].translatedText);
      }

      throw new Error('Invalid response structure from Google Cloud Translation API.');
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('Google Cloud Translation API request timed out (15s).');
      }
      throw err;
    }
  }

  /**
   * High-accuracy Google Translation Endpoint
   */
  static async _translateGoogleFree(text, source = 'en', target = 'bn') {
    const query = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${query}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        if (response.status === 429) throw new Error('Translation rate limit reached (HTTP 429). Please retry in a few moments.');
        throw new Error(`Translation service returned HTTP ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translatedParts = data[0].map(item => (item && item[0] ? item[0] : '')).filter(Boolean);
        if (translatedParts.length > 0) {
          return decodeHtmlEntities(translatedParts.join(''));
        }
      }

      throw new Error('Translation service returned an unrecognized response format.');
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('Translation request timed out (12s).');
      }
      throw err;
    }
  }

  /**
   * LibreTranslate API
   */
  static async _translateLibreTranslate(text, endpoint = 'https://libretranslate.com', apiKey = '', source = 'en', target = 'bn') {
    let cleanEndpoint = (endpoint || 'https://libretranslate.com').trim().replace(/\/+$/, '');
    const url = `${cleanEndpoint}/translate`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const bodyPayload = {
      q: text,
      source,
      target,
      format: 'text'
    };
    if (apiKey && apiKey.trim()) {
      bodyPayload.api_key = apiKey.trim();
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        if (response.status === 400) throw new Error('LibreTranslate: Invalid parameters or unsupported language pair.');
        if (response.status === 403) throw new Error('LibreTranslate: Invalid API Key or authentication required.');
        if (response.status === 429) throw new Error('LibreTranslate: Rate limit exceeded.');
        throw new Error(`LibreTranslate endpoint returned HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data && data.translatedText) {
        return decodeHtmlEntities(data.translatedText);
      }

      throw new Error('Unrecognized response format from LibreTranslate.');
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('LibreTranslate request timed out (15s).');
      }
      throw err;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    OnlineTranslationService,
    validateBengaliTranslation,
    decodeHtmlEntities,
    chunkText
  };
}
if (typeof globalThis !== 'undefined') {
  globalThis.OnlineTranslationService = OnlineTranslationService;
  globalThis.validateBengaliTranslation = validateBengaliTranslation;
  globalThis.decodeHtmlEntities = decodeHtmlEntities;
  globalThis.chunkText = chunkText;
}
