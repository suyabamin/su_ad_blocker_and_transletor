/**
 * Su_AdBlock Tests - Premium Translation Quality & NMT Benchmarks
 * Verifies that the translation engine produces fluent Bengali sentences
 * and eliminates mixed-language word-by-word substitution bugs.
 */

const assert = require('assert');
const { TranslationEngine, MODEL_STATES } = require('../core/translation-engine');

async function runTest() {
  console.log('--- Testing Premium Translation Quality & NMT Benchmarks ---');

  const engine = new TranslationEngine();

  // Test 1: Conversational benchmark
  const test1Input = 'Hello, how are you?';
  const res1 = await engine.translate(test1Input);
  console.log('Test 1 Input: ', test1Input);
  console.log('Test 1 Output:', res1.translation);
  assert(res1.translation.includes('হ্যালো'), 'Must include হ্যালো');
  assert(res1.translation.includes('কেমন আছেন'), 'Must include কেমন আছেন');
  assert(!res1.translation.includes('Hello'), 'Should not leave English words behind');

  // Test 2: Multi-sentence technical paragraph (The FitRide problem statement)
  const test2Input = 'FitRide is a fitness application that allows users to track their workouts. The app supports various workout calculation techniques, including calorie-based, time-based, and distance-based workouts.';
  const res2 = await engine.translate(test2Input);
  console.log('Test 2 Input: ', test2Input);
  console.log('Test 2 Output:', res2.translation);

  // Critical Assertion: Verify that the old broken output is completely eradicated!
  const brokenPattern = /FitRide হয় a fitness application ওই/i;
  assert(!brokenPattern.test(res2.translation), 'CRITICAL BUG RE-DETECTED: Must never output mixed words like "FitRide হয় a fitness application ওই"');
  assert(res2.translation.includes('ফিটনেস অ্যাপ্লিকেশন'), 'Must translate fitness application properly');
  assert(res2.translation.includes('ওয়ার্কআউট'), 'Must translate workouts');
  assert(res2.translation.includes('ক্যালোরি-ভিত্তিক'), 'Must translate calorie-based');

  // Test 3: Runtime technique switch
  const test3Input = 'A user can switch between these workout calculation techniques at runtime depending on their fitness goal.';
  const res3 = await engine.translate(test3Input);
  console.log('Test 3 Input: ', test3Input);
  console.log('Test 3 Output:', res3.translation);
  assert(res3.translation.includes('ব্যবহারকারী'), 'Must translate user');
  assert(res3.translation.includes('রানটাইমে'), 'Must translate runtime');
  assert(!res3.translation.includes('switch between'), 'Must not leave raw English phrases');

  // Test 4: Extensibility without code modification
  const test4Input = 'The application should allow adding new workout calculation techniques in the future without modifying existing code.';
  const res4 = await engine.translate(test4Input);
  console.log('Test 4 Input: ', test4Input);
  console.log('Test 4 Output:', res4.translation);
  assert(res4.translation.includes('বিদ্যমান কোড') || res4.translation.includes('পরিবর্তন না করে'), 'Must preserve software engineering meaning');
  assert(!res4.translation.includes('existing code'), 'Must translate code concepts');

  // Test 5: Space Shuttle Benchmark (from user bug report)
  const test5Input = 'The Space Shuttle is a retired, partially reusable low Earth orbital spacecraft system that went to the ISS and performed other orbital missions.';
  const res5 = await engine.translate(test5Input);
  console.log('Test 5 Input: ', test5Input);
  console.log('Test 5 Output:', res5.translation);
  assert(res5.translation.includes('স্পেস শাটল'), 'Must translate Space Shuttle');
  assert(res5.translation.includes('মহাকাশযান'), 'Must translate spacecraft');
  assert(!res5.translation.includes('The Space Shuttle is a retired'), 'Must NOT echo original English sentence');

  // Test 6: Cache efficiency
  const resCached = await engine.translate(test1Input);
  assert.strictEqual(resCached.cached, true, 'Repeated translation must hit memory cache');

  // Test 7: Model Lifecycle States
  const state = engine.getState();
  assert(state.status, 'Must have defined model status');
  console.log('Engine state:', state.status, '| Device:', state.device);

  console.log('✓ Premium Translation Quality and NMT benchmark tests passed with 100% success.');
}

if (require.main === module) {
  runTest();
}

module.exports = { runTest };
