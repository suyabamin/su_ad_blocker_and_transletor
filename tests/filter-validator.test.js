/**
 * Su_AdBlock Tests - Filter Validator & ABP Converter
 */

const assert = require('assert');
const { FilterValidator } = require('../core/filter-validator');

function runTest() {
  console.log('--- Testing Filter Validator & ABP Converter ---');

  // Test 1: Validate valid rule
  const validRule = {
    id: 101,
    priority: 1,
    action: { type: 'block' },
    condition: {
      urlFilter: '||example.com^',
      resourceTypes: ['script', 'image']
    }
  };
  const res1 = FilterValidator.validateDNRRule(validRule);
  assert.strictEqual(res1.valid, true, 'Valid rule should pass');

  // Test 2: Validate invalid rule (missing action)
  const invalidRule = {
    id: 102,
    condition: { urlFilter: '||bad.com^' }
  };
  const res2 = FilterValidator.validateDNRRule(invalidRule);
  assert.strictEqual(res2.valid, false, 'Invalid rule should fail');

  // Test 3: Duplicate IDs detection
  const duplicateSet = [
    { id: 201, action: { type: 'block' }, condition: { urlFilter: '||a.com^' } },
    { id: 201, action: { type: 'block' }, condition: { urlFilter: '||b.com^' } }
  ];
  const setRes = FilterValidator.validateRuleset(duplicateSet);
  assert.strictEqual(setRes.valid, false, 'Duplicate set should be marked invalid');
  assert.strictEqual(setRes.duplicateIds.length, 1);

  // Test 4: ABP syntax conversion
  const sampleAbp = `
    ! Checksum: 1234abcd
    ! Title: Sample List
    ||adnetwork.com^
    @@||whitelisted-partner.com^
    example.com##.ad-banner
    ||tracker.com^$websocket
  `;
  const converted = FilterValidator.convertAbpList(sampleAbp, 5000);
  assert.strictEqual(converted.rules.length, 2, 'Should convert 2 domain rules (1 block, 1 allow)');
  assert.strictEqual(converted.cosmeticSelectors.length, 1, 'Should extract 1 cosmetic selector');
  assert.strictEqual(converted.report.convertedRules, 2);
  assert.strictEqual(converted.report.cosmeticRules, 1);
  assert(converted.report.skippedComments >= 2);

  // Test 5: Checksum computation
  const hash1 = FilterValidator.computeChecksum('test string');
  const hash2 = FilterValidator.computeChecksum('test string');
  const hash3 = FilterValidator.computeChecksum('different string');
  assert.strictEqual(hash1, hash2, 'Checksum must be deterministic');
  assert.notStrictEqual(hash1, hash3, 'Different strings must produce different checksums');

  console.log('✓ Filter Validator and ABP converter tests passed.');
}

if (require.main === module) {
  runTest();
}

module.exports = { runTest };
