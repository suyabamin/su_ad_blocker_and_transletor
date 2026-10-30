/**
 * Su_AdBlock - Master Test Runner
 * Executes all automated unit, integration, and security tests.
 */

const { runTest: testManifest } = require('./manifest.test');
const { runTest: testDNR } = require('./dnr-rules.test');
const { runTest: testFilterValidator } = require('./filter-validator.test');
const { runTest: testWhitelist } = require('./whitelist-custom-rules.test');
const { runTest: testChunker } = require('./text-chunker.test');
const { runTest: testTranslation } = require('./translation.test');
const { runTest: testPrivacy } = require('./privacy-audit.test');

async function main() {
  console.log('====================================================');
  console.log('        Su_AdBlock Extension Test Suite             ');
  console.log('        Free Forever. Private by Design.            ');
  console.log('====================================================\n');

  const results = [];

  const testSuites = [
    { name: 'Manifest V3 Validity', fn: testManifest },
    { name: 'Static DNR Rulesets', fn: testDNR },
    { name: 'Filter Validator & ABP Converter', fn: testFilterValidator },
    { name: 'Whitelist & Custom Rules', fn: testWhitelist },
    { name: 'Text Chunker & Sentence Splitting', fn: testChunker },
    { name: 'Translation & Offline Lexicon', fn: testTranslation },
    { name: 'Privacy & Security Network Audit', fn: testPrivacy }
  ];

  let passedCount = 0;

  for (const suite of testSuites) {
    try {
      await suite.fn();
      results.push({ name: suite.name, status: 'PASSED' });
      passedCount++;
    } catch (err) {
      console.error(`❌ FAILED: ${suite.name}`);
      console.error(err);
      results.push({ name: suite.name, status: 'FAILED', error: err.message });
    }
    console.log('');
  }

  console.log('====================================================');
  console.log('                 TEST SUMMARY REPORT                ');
  console.log('====================================================');
  results.forEach(r => {
    const symbol = r.status === 'PASSED' ? '✓' : '✗';
    console.log(`${symbol} [${r.status}] ${r.name}`);
    if (r.error) console.log(`    Error: ${r.error}`);
  });
  console.log('----------------------------------------------------');
  console.log(`Total: ${results.length} | Passed: ${passedCount} | Failed: ${results.length - passedCount}`);
  console.log('====================================================\n');

  if (passedCount !== results.length) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
