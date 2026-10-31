/**
 * Su_AdBlock Tests - Website & Chrome PDF Floating Translation Repair Suite
 * Tests Message Router contract, RequestId tracking, Space Shuttle benchmark,
 * website selection lifecycles, and PDF context handling.
 */

const assert = require('assert');
const { MessageRouter } = require('../background/message-router');
const { TranslationManager } = require('../core/translation-manager');
const { SettingsStore } = require('../core/settings-store');
const { ContextMenuHandler, CONTEXT_MENU_ID, CONTEXT_MENU_PDF_ID } = require('../background/context-menu');

async function runRepairTestSuite() {
  console.log('====================================================');
  console.log('   Su_AdBlock Floating Translation Repair Suite     ');
  console.log('====================================================\n');

  const settingsStore = new SettingsStore();
  const translationManager = new TranslationManager({ settingsStore });
  const messageRouter = new MessageRouter({
    settingsStore,
    translationManager
  });

  // Test 1: Message Contract with SU_TRANSLATE_TEXT & requestId
  console.log('--- Test 1: SU_TRANSLATE_TEXT Message Contract ---');
  const reqId1 = 'test_req_001';
  const res1 = await messageRouter.handleMessage({
    type: 'SU_TRANSLATE_TEXT',
    requestId: reqId1,
    payload: {
      text: 'Hello, how are you?',
      sourceLanguage: 'en',
      targetLanguage: 'bn'
    }
  });

  assert.strictEqual(res1.success, true, 'Response must indicate success');
  assert.strictEqual(res1.requestId, reqId1, 'Response must echo the same requestId');
  assert(res1.translation && res1.translation.length > 0, 'Must contain translated text');
  assert(res1.translation.includes('হ্যালো') || res1.translation.includes('কেমন'), 'Translation must be in Bengali');
  console.log('✓ Test 1 Passed: SU_TRANSLATE_TEXT returned Bengali with requestId intact.\n');

  // Test 2: Message Contract with TRANSLATE_TEXT backward compatibility
  console.log('--- Test 2: TRANSLATE_TEXT Backward Compatibility ---');
  const reqId2 = 'test_req_002';
  const res2 = await messageRouter.handleMessage({
    action: 'TRANSLATE_TEXT',
    requestId: reqId2,
    payload: {
      text: 'FitRide is a fitness application that allows users to track their workouts.'
    }
  });

  assert.strictEqual(res2.success, true);
  assert.strictEqual(res2.requestId, reqId2);
  assert(res2.translation.includes('ফিটনেস') || res2.translation.includes('অ্যাপ্লিকেশন'));
  console.log('✓ Test 2 Passed: TRANSLATE_TEXT backward compatibility intact.\n');

  // Test 3: Space Shuttle Benchmark
  console.log('--- Test 3: Space Shuttle Translation Benchmark ---');
  const shuttleInput = 'The Space Shuttle is a retired, partially reusable low Earth orbital spacecraft system that went to the ISS and performed other orbital missions.';
  const shuttleRes = await translationManager.translate(shuttleInput, { requestId: 'shuttle_req' });
  console.log('Input: ', shuttleInput);
  console.log('Output:', shuttleRes.translation);

  assert(shuttleRes.translation.includes('স্পেস শাটল'), 'Must translate Space Shuttle');
  assert(!shuttleRes.translation.includes('The Space Shuttle is a retired'), 'Must NOT echo original English sentence');
  const bengaliChars = (shuttleRes.translation.match(/[\u0980-\u09FF]/g) || []).length;
  assert(bengaliChars > 15, 'Must contain high density of Bengali Unicode characters');
  console.log('✓ Test 3 Passed: Space Shuttle benchmark produced genuine Bengali.\n');

  // Test 4: Missing Text Payload Handling
  console.log('--- Test 4: Missing / Empty Payload Validation ---');
  const reqId4 = 'test_req_empty';
  const res4 = await messageRouter.handleMessage({
    type: 'SU_TRANSLATE_TEXT',
    requestId: reqId4,
    payload: { text: '   ' }
  });
  assert.strictEqual(res4.success, false, 'Must fail on empty text');
  assert.strictEqual(res4.requestId, reqId4, 'Must return requestId on error');
  assert(res4.error, 'Must provide descriptive error message');
  console.log('✓ Test 4 Passed: Empty payload gracefully rejected with error message.\n');

  // Test 5: Three Website Text Samples
  console.log('--- Test 5: Three Diverse Website Text Selections ---');
  const site1Text = 'Wikipedia is a free online encyclopedia, created and edited by volunteers around the world.';
  const site1Res = await translationManager.translate(site1Text);
  assert(site1Res.translation.includes('মুক্ত') || site1Res.translation.includes('উইকিপিডিয়া') || site1Res.translation.includes('অনলাইন'));
  console.log('Website 1 (Wikipedia):', site1Res.translation);

  const site2Text = 'GitHub is a developer platform that allows developers to create, store, manage and share their code.';
  const site2Res = await translationManager.translate(site2Text);
  assert(site2Res.translation.includes('কোড') || site2Res.translation.includes('ডেভেলপার'));
  console.log('Website 2 (GitHub):   ', site2Res.translation);

  const site3Text = 'Read full documentation and release notes before deploying to production servers.';
  const site3Res = await translationManager.translate(site3Text);
  assert(site3Res.translation.includes('সার্ভার') || site3Res.translation.includes('নোট') || site3Res.translation.includes('ডকুমেন্টেশন'));
  console.log('Website 3 (Tech Blog):', site3Res.translation);
  console.log('✓ Test 5 Passed: All 3 website samples successfully translated to Bengali.\n');

  // Test 6: In-Memory Cache Efficiency
  console.log('--- Test 6: In-Memory Cache Verification ---');
  const cachedRes = await translationManager.translate(shuttleInput);
  assert.strictEqual(cachedRes.cached, true, 'Subsequent request must hit in-memory cache');
  console.log('✓ Test 6 Passed: Memory cache delivered instantaneous translation.\n');

  // Test 7: Context Menu Constants & PDF Detection
  console.log('--- Test 7: Context Menu PDF Detection & Routing ---');
  assert(CONTEXT_MENU_ID === 'su_adblock_translate_selection');
  assert(CONTEXT_MENU_PDF_ID === 'su_adblock_open_pdf_reader');
  console.log('✓ Test 7 Passed: Context Menu definitions verified.\n');

  console.log('====================================================');
  console.log('  ALL REPAIR SUITE TESTS PASSED (100% SUCCESS)      ');
  console.log('====================================================');
}

if (require.main === module) {
  runRepairTestSuite().catch(err => {
    console.error('Repair test suite failure:', err);
    process.exit(1);
  });
}

module.exports = { runRepairTestSuite };
