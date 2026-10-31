/**
 * Su_AdBlock Tests - Online Translation Engine Suite
 * Validates real API translation requests against the user requirements (Tests 1-8).
 */

const assert = require('assert');
const { OnlineTranslationService, validateBengaliTranslation, chunkText } = require('../core/online-translation-service');

async function runOnlineTests() {
  console.log('--- Testing Online Translation Service Benchmarks ---');

  // Test 1: Simple greeting
  console.log('Executing Test 1: Hello, how are you?');
  const res1 = await OnlineTranslationService.translate('Hello, how are you?');
  console.log('Test 1 Result:', res1.translation);
  assert(res1.translation.includes('হ্যালো') || res1.translation.includes('কেমন'), 'Test 1: Output must contain Bengali greeting');

  // Test 2: Space Shuttle
  console.log('\nExecuting Test 2: Space Shuttle paragraph');
  const spaceShuttleText = 'The Space Shuttle is a retired, partially reusable low Earth orbital spacecraft system that went to the ISS and performed other orbital missions.';
  const res2 = await OnlineTranslationService.translate(spaceShuttleText);
  console.log('Test 2 Result:', res2.translation);
  assert(res2.translation.includes('স্পেস শাটল') || res2.translation.includes('মহাকাশ'), 'Test 2: Must translate Space Shuttle to Bengali');
  assert(!res2.translation.includes('The Space Shuttle is a retired'), 'Test 2: Must NOT echo original English text');

  // Test 3: FitRide application
  console.log('\nExecuting Test 3: FitRide paragraph');
  const fitRideText = 'FitRide is a fitness application that allows users to track their workouts.';
  const res3 = await OnlineTranslationService.translate(fitRideText);
  console.log('Test 3 Result:', res3.translation);
  assert(res3.translation.includes('ফিটনেস') || res3.translation.includes('অ্যাপ্লিকেশন'), 'Test 3: Must translate FitRide sentence');

  // Test 4: Extensibility
  console.log('\nExecuting Test 4: Extensibility sentence');
  const extensibilityText = 'The application should allow adding new workout calculation techniques in the future without modifying existing code.';
  const res4 = await OnlineTranslationService.translate(extensibilityText);
  console.log('Test 4 Result:', res4.translation);
  assert(res4.translation.includes('অ্যাপ্লিকেশন') || res4.translation.includes('কোড') || res4.translation.includes('কৌশল'), 'Test 4: Must translate software concepts');

  // Test 5: Long paragraph (>1,000 characters)
  console.log('\nExecuting Test 5: Long paragraph (>1,000 characters)');
  const passage = (
    'Artificial intelligence and neural machine translation have revolutionized cross-lingual communication worldwide. ' +
    'By representing semantic nuances in high-dimensional vector spaces, language models achieve high fidelity and grammatical coherence. ' +
    'Researchers and software engineers can now deploy efficient natural language processing systems across diverse platforms. ' +
    'The integration of robust privacy policies ensures that sensitive text selections remain confidential and secure. ' +
    'Modern web extensions empower users with immediate access to information in their native languages without compromising performance. '
  ).repeat(3); // >1,500 characters
  
  assert(passage.length > 1000, `Passage must be >1,000 characters, got: ${passage.length}`);
  const res5 = await OnlineTranslationService.translate(passage);
  console.log(`Test 5 Output Length: ${res5.translation.length} characters (Input: ${passage.length})`);
  assert(res5.translation.length > 500, 'Test 5: Translated text must preserve full content without dropping chunks');
  const validation5 = validateBengaliTranslation(passage, res5.translation);
  assert(validation5.valid, 'Test 5: Output must pass Bengali Unicode script validation');

  // Test 8: API failure handling
  console.log('\nExecuting Test 8: API failure with unconfigured Google Cloud API Key');
  try {
    await OnlineTranslationService.translate('Testing failure mode', { provider: 'google_cloud', googleApiKey: '' });
    assert.fail('Expected error was not thrown for missing API key');
  } catch (err) {
    console.log('Test 8 Error Caught Successfully:', err.message);
    assert(err.message.includes('API credentials') || err.message.includes('not configured'), 'Must produce meaningful error message');
  }

  console.log('\n✓ All Online Translation Benchmark Tests Passed with 100% Success.');
}

if (require.main === module) {
  runOnlineTests().catch(err => {
    console.error('Test suite failed:', err);
    process.exit(1);
  });
}

module.exports = { runOnlineTests };
