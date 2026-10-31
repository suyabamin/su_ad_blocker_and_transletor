/**
 * Su_AdBlock Tests - Translation Engine & Lexicon
 */

const assert = require('assert');
const { LexiconTranslator } = require('../translator/lexicon');
const { TranslationManager } = require('../core/translation-manager');
const { SettingsStore } = require('../core/settings-store');

async function runTest() {
  console.log('--- Testing Translation & Lexicon ---');

  // Test 1: Direct word translation
  const resHello = LexiconTranslator.translate('hello');
  assert(resHello.includes('হ্যালো'), `Expected Bengali translation for hello, got: ${resHello}`);

  const resPrivacy = LexiconTranslator.translate('privacy');
  assert(resPrivacy.includes('গোপনীয়তা'), `Expected Bengali translation for privacy, got: ${resPrivacy}`);

  // Test 2: Phrase translation
  const resPhrase = LexiconTranslator.translate('Thank you very much');
  assert(resPhrase.includes('ধন্যবাদ'), `Expected ধন্যবাদ in translation, got: ${resPhrase}`);

  // Test 3: Number translation
  const resNum = LexiconTranslator.translate('123');
  assert.strictEqual(resNum, '১২৩');

  // Test 4: Translation Manager pipeline
  const settingsStore = new SettingsStore();
  const tm = new TranslationManager({ settingsStore });

  const res = await tm.translate('Welcome to private web browsing');
  assert(res.translation.length > 0, 'Must produce translated output');
  assert(res.engine && (res.engine.includes('NMT') || res.engine.includes('lexicon') || res.engine.includes('Translation') || res.engine.includes('Google')), 'Must return recognized engine name');
  assert.strictEqual(res.cached, false);

  // Test 5: Cache hit
  const cachedRes = await tm.translate('Welcome to private web browsing');
  assert.strictEqual(cachedRes.cached, true, 'Subsequent request must hit cache');

  console.log('✓ Translation and Lexicon tests passed.');
}

if (require.main === module) {
  runTest();
}

module.exports = { runTest };
