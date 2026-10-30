/**
 * Su_AdBlock - English to Bangla Offline Vocabulary & Phrase Lexicon
 * Provides immediate offline translation without network calls or waiting for neural model download.
 * Free Forever. Private by Design.
 */

const EN_BN_DICTIONARY = {
  // Greetings & Basics
  'hello': 'হ্যালো / নমস্কার',
  'hi': 'হাই / নমস্কার',
  'welcome': 'স্বাগতম',
  'good morning': 'শুভ সকাল',
  'good afternoon': 'শুভ অপরাহ্ন',
  'good evening': 'শুভ সন্ধ্যা',
  'good night': 'শুভ রাত্রি',
  'thank you': 'ধন্যবাদ',
  'thanks': 'ধন্যবাদ',
  'please': 'দয়া করে',
  'sorry': 'দুঃখিত',
  'excuse me': 'মাফ করবেন',
  'yes': 'হ্যাঁ',
  'no': 'না',
  'ok': 'ঠিক আছে',
  'okay': 'ঠিক আছে',
  'goodbye': 'বিদায়',
  'bye': 'বিদায়',
  'see you': 'আবার দেখা হবে',
  'how are you': 'আপনি কেমন আছেন?',
  'i am fine': 'আমি ভালো আছি',
  'help': 'সাহায্য',

  // Pronouns
  'i': 'আমি',
  'me': 'আমাকে',
  'my': 'আমার',
  'mine': 'আমার',
  'we': 'আমরা',
  'us': 'আমাদের',
  'our': 'আমাদের',
  'you': 'আপনি / তুমি',
  'your': 'আপনার / তোমার',
  'he': 'সে / তিনি',
  'him': 'তাকে / তাঁকে',
  'his': 'তার / তাঁর',
  'she': 'সে / তিনি',
  'her': 'তার / তাঁর',
  'it': 'এটি / এটা',
  'its': 'এর',
  'they': 'তারা / তাঁরা',
  'them': 'তাদের / তাঁদের',
  'their': 'তাদের / তাঁদের',
  'this': 'এই / এটি',
  'that': 'ওই / সেটি',
  'these': 'এইগুলো',
  'those': 'ওইগুলো',

  // Common verbs
  'is': 'হয়',
  'am': 'হই',
  'are': 'হয় / হন',
  'was': 'ছিল',
  'were': 'ছিল',
  'have': 'আছে',
  'has': 'আছে',
  'had': 'ছিল',
  'do': 'করা',
  'does': 'করে',
  'did': 'করেছিল',
  'will': 'হবে / করবে',
  'can': 'পারা',
  'could': 'পারত',
  'go': 'যাওয়া',
  'come': 'আসা',
  'read': 'পড়া',
  'write': 'লেখা',
  'speak': 'কথা বলা',
  'translate': 'অনুবাদ করা',
  'translation': 'অনুবাদ',
  'learn': 'শেখা',
  'know': 'জানা',
  'think': 'চিন্তা করা / মনে করা',
  'see': 'দেখা',
  'look': 'তাকানো',
  'hear': 'শোনা',
  'make': 'তৈরি করা',
  'create': 'তৈরি করা',
  'work': 'কাজ করা',
  'play': 'খেলা করা',
  'eat': 'খাওয়া',
  'drink': 'পান করা',
  'sleep': 'ঘুমানো',
  'live': 'বাস করা',
  'open': 'খোলা',
  'close': 'বন্ধ করা',
  'start': 'শুরু করা',
  'stop': 'থামা / বন্ধ করা',
  'save': 'সংরক্ষণ করা',
  'copy': 'অনুলিপি / কপি করা',
  'paste': 'পেস্ট করা',
  'search': 'অনুসন্ধান করা',
  'find': 'খুঁজে পাওয়া',
  'block': 'অবরোধ করা / ব্লক করা',
  'allow': 'অনুমতি দেওয়া',

  // Tech & Web terms
  'computer': 'কম্পিউটার',
  'software': 'সফটওয়্যার',
  'hardware': 'হার্ডওয়্যার',
  'internet': 'ইন্টারনেট',
  'website': 'ওয়েবসাইট',
  'webpage': 'ওয়েবপেজ',
  'browser': 'ব্রাউজার',
  'extension': 'এক্সটেনশন',
  'download': 'ডাউনলোড',
  'upload': 'আপলোড',
  'settings': 'সেটিংস',
  'privacy': 'গোপনীয়তা',
  'security': 'নিরাপত্তা',
  'protection': 'সুরক্ষা',
  'tracker': 'ট্র্যাকার',
  'ad': 'বিজ্ঞাপন',
  'advertisement': 'বিজ্ঞাপন',
  'filter': 'ফিল্টার',
  'rule': 'নিয়ম',
  'data': 'উপাত্ত / তথ্য',
  'file': 'ফাইল',
  'document': 'নথি',
  'page': 'পৃষ্ঠা',
  'text': 'লেখা / টেক্সট',
  'image': 'ছবি',
  'video': 'ভিডিও',
  'audio': 'অডিও',
  'network': 'নেটওয়ার্ক',
  'system': 'সিস্টেম',
  'user': 'ব্যবহারকারী',
  'password': 'পাসওয়ার্ড',
  'email': 'ইমেইল',
  'message': 'বার্তা',
  'history': 'ইতিহাস / রেকর্ড',

  // Question words
  'what': 'কী / কি',
  'who': 'কে',
  'where': 'কোথায়',
  'when': 'কখন',
  'why': 'কেন',
  'how': 'কিভাবে / কেমন',
  'which': 'কোনটি',
  'whose': 'কার',

  // Common adjectives & adverbs
  'free': 'বিনামূল্যে / মুক্ত',
  'forever': 'চিরকাল',
  'private': 'ব্যক্তিগত / গোপনীয়',
  'design': 'নকশা',
  'good': 'ভালো',
  'bad': 'খারাপ',
  'big': 'বড়',
  'small': 'ছোট',
  'new': 'নতুন',
  'old': 'পুরোনো',
  'fast': 'দ্রুত',
  'slow': 'ধীর',
  'easy': 'সহজ',
  'difficult': 'কঠিন',
  'important': 'গুরুত্বপূর্ণ',
  'complete': 'সম্পূর্ণ',
  'active': 'সক্রিয়',
  'disabled': 'নিষ্ক্রিয়',
  'enabled': 'সক্রিয়',
  'all': 'সব / সমস্ত',
  'some': 'কিছু',
  'many': 'অনেক',
  'more': 'আরও',
  'most': 'সবচেয়ে',
  'now': 'এখন',
  'today': 'আজ',
  'tomorrow': 'আগামীকাল',
  'yesterday': 'গতকাল',
  'always': 'সবসময়',
  'never': 'কখনও না',
  'often': 'প্রায়ই',
  'here': 'এখানে',
  'there': 'সেখানে',
  'very': 'খুব',
  'beautiful': 'সুন্দর',
  'happy': 'সুখী / আনন্দিত',
  'true': 'সত্য',
  'false': 'মিথ্যা',

  // Numbers & Quantities
  'one': 'এক',
  'two': 'দুই',
  'three': 'তিন',
  'four': 'চার',
  'five': 'পাঁচ',
  'six': 'ছয়',
  'seven': 'সাত',
  'eight': 'আট',
  'nine': 'নয়',
  'ten': 'দশ',
  'hundred': 'শত',
  'thousand': 'হাজার',
  'million': 'মিলিয়ন'
};

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

class LexiconTranslator {
  /**
   * Translates English text to Bangla using local vocabulary and phrase rules.
   * @param {string} text 
   * @returns {string} Translated Bengali text
   */
  static translate(text) {
    if (!text || typeof text !== 'string') return '';
    const trimmed = text.trim();
    if (!trimmed) return '';

    // Direct match check (case-insensitive)
    const lower = trimmed.toLowerCase();
    if (EN_BN_DICTIONARY[lower]) {
      return EN_BN_DICTIONARY[lower];
    }

    // Process line by line / sentence by sentence
    const lines = trimmed.split('\n');
    const translatedLines = lines.map(line => {
      if (!line.trim()) return '';

      // Check for multi-word phrases first
      let processed = line;
      // Sort dictionary keys by length descending to match longest phrases first
      const phrases = Object.keys(EN_BN_DICTIONARY).filter(k => k.includes(' '));
      for (const phrase of phrases) {
        const regex = new RegExp('\\b' + phrase + '\\b', 'gi');
        if (regex.test(processed)) {
          processed = processed.replace(regex, `__BN_${phrase.replace(/ /g, '_')}__`);
        }
      }

      // Word-by-word token replacement
      const tokens = processed.split(/(\s+|[.,!?;:()[\]"'\-])/);
      const translatedTokens = tokens.map(token => {
        if (!token.trim()) return token;

        // Check phrase placeholder
        if (token.startsWith('__BN_') && token.endsWith('__')) {
          const originalPhrase = token.slice(5, -2).replace(/_/g, ' ');
          return EN_BN_DICTIONARY[originalPhrase] || originalPhrase;
        }

        // Convert digits to Bengali digits
        if (/^\d+$/.test(token)) {
          return token.split('').map(d => BN_DIGITS[parseInt(d, 10)] || d).join('');
        }

        const cleanToken = token.toLowerCase();
        if (EN_BN_DICTIONARY[cleanToken]) {
          const bn = EN_BN_DICTIONARY[cleanToken];
          // Take first synonym if multiple provided with slash
          return bn.includes('/') ? bn.split('/')[0].trim() : bn;
        }

        return token;
      });

      return translatedTokens.join('');
    });

    return translatedLines.join('\n');
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LexiconTranslator, EN_BN_DICTIONARY };
}
if (typeof globalThis !== 'undefined') {
  globalThis.LexiconTranslator = LexiconTranslator;
  globalThis.EN_BN_DICTIONARY = EN_BN_DICTIONARY;
}
