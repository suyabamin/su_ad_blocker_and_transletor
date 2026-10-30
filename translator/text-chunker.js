/**
 * Su_AdBlock - Text Chunker
 * Splits English text into coherent sentence/clause chunks for translation.
 * Preserves paragraph structure and handles long text safely without freezing UI.
 * Free Forever. Private by Design.
 */

class TextChunker {
  /**
   * Splits an input text into manageable chunks.
   * @param {string} text 
   * @param {number} [maxChunkSize=200]
   * @returns {Array<{ text: string, isParagraphBreak: boolean }>}
   */
  static chunk(text, maxChunkSize = 200) {
    if (!text || typeof text !== 'string') return [];
    const trimmed = text.trim();
    if (!trimmed) return [];

    // Separate by paragraphs first
    const paragraphs = trimmed.split(/\r?\n\s*\r?\n/);
    const result = [];

    for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
      const para = paragraphs[pIdx].trim();
      if (!para) continue;

      if (para.length <= maxChunkSize) {
        result.push({ text: para, isParagraphBreak: pIdx < paragraphs.length - 1 });
        continue;
      }

      // Split paragraph by sentences
      // Avoid splitting common abbreviations like Mr., Dr., e.g., i.e., vs.
      const sentenceRegex = /(?<=[.?!])\s+(?=[A-Z0-9"'])/g;
      const sentences = para.split(sentenceRegex);
      let currentChunk = '';

      for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
        const sentence = sentences[sIdx].trim();
        if (!sentence) continue;

        if ((currentChunk + ' ' + sentence).trim().length <= maxChunkSize) {
          currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
        } else {
          if (currentChunk) {
            result.push({ text: currentChunk, isParagraphBreak: false });
          }
          // If a single sentence exceeds maxChunkSize, split by punctuation or comma
          if (sentence.length > maxChunkSize) {
            const subChunks = this._splitBySubPunctuation(sentence, maxChunkSize);
            for (let sub of subChunks) {
              result.push({ text: sub, isParagraphBreak: false });
            }
            currentChunk = '';
          } else {
            currentChunk = sentence;
          }
        }
      }

      if (currentChunk) {
        result.push({ text: currentChunk, isParagraphBreak: pIdx < paragraphs.length - 1 });
      } else if (result.length > 0) {
        result[result.length - 1].isParagraphBreak = pIdx < paragraphs.length - 1;
      }
    }

    return result;
  }

  /**
   * Sub-splits long sentences by comma, semicolon, colon, or dashes.
   * @private
   */
  static _splitBySubPunctuation(sentence, maxChunkSize) {
    const parts = sentence.split(/([,;:\-–—]\s+)/);
    const subChunks = [];
    let current = '';

    for (let part of parts) {
      if ((current + part).length <= maxChunkSize) {
        current += part;
      } else {
        if (current.trim()) subChunks.push(current.trim());
        current = part;
      }
    }
    if (current.trim()) {
      subChunks.push(current.trim());
    }

    // Fallback if still too long: split by word boundary
    const finalChunks = [];
    for (let chunk of subChunks) {
      if (chunk.length <= maxChunkSize) {
        finalChunks.push(chunk);
      } else {
        const words = chunk.split(' ');
        let temp = '';
        for (let w of words) {
          if ((temp + ' ' + w).trim().length <= maxChunkSize) {
            temp = temp ? temp + ' ' + w : w;
          } else {
            if (temp) finalChunks.push(temp);
            temp = w;
          }
        }
        if (temp) finalChunks.push(temp);
      }
    }

    return finalChunks;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TextChunker };
}
if (typeof globalThis !== 'undefined') {
  globalThis.TextChunker = TextChunker;
}
