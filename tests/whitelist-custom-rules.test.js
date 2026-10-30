/**
 * Su_AdBlock Tests - Whitelist and Custom Rules
 */

const assert = require('assert');
const { WhitelistManager } = require('../core/whitelist-manager');
const { CustomRulesManager } = require('../core/custom-rules-manager');

async function runTest() {
  console.log('--- Testing Whitelist and Custom Rules ---');

  // Test 1: Clean Hostname
  assert.strictEqual(WhitelistManager.cleanHostname('https://WWW.Example.Com/path?arg=1'), 'www.example.com');
  assert.strictEqual(WhitelistManager.cleanHostname('*.sub.domain.org:8080'), 'sub.domain.org');
  assert.strictEqual(WhitelistManager.cleanHostname('invalid'), '');

  // Test 2: Subdomain Matching
  assert.strictEqual(WhitelistManager.isMatch('example.com', 'example.com'), true);
  assert.strictEqual(WhitelistManager.isMatch('blog.example.com', 'example.com'), true);
  assert.strictEqual(WhitelistManager.isMatch('deep.sub.example.com', 'example.com'), true);
  // Crucial security test: never match unrelated substring domains
  assert.strictEqual(WhitelistManager.isMatch('notexample.com', 'example.com'), false);
  assert.strictEqual(WhitelistManager.isMatch('example.com.evil.org', 'example.com'), false);

  // Test 3: Whitelist Dynamic DNR generation
  const wm = new WhitelistManager();
  await wm.add('news.bbc.co.uk');
  await wm.add('wikipedia.org');
  assert.strictEqual(wm.isWhitelisted('news.bbc.co.uk'), true);
  assert.strictEqual(wm.isWhitelisted('en.wikipedia.org'), true);
  assert.strictEqual(wm.isWhitelisted('unrelated.org'), false);

  const dnrAllowRules = wm.toDNRRules();
  assert.strictEqual(dnrAllowRules.length, 2);
  assert.strictEqual(dnrAllowRules[0].action.type, 'allowAllRequests');
  assert.strictEqual(dnrAllowRules[0].priority, 2);

  // Test 4: Custom Rules Manager
  const crm = new CustomRulesManager();
  const res = await crm.addRule({
    pattern: 'custom-tracker.com',
    action: 'block',
    note: 'User blocked'
  });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.rule.urlFilter, '||custom-tracker.com^');

  const dnrCustomRules = crm.toDNRRules();
  assert.strictEqual(dnrCustomRules.length, 1);
  assert.strictEqual(dnrCustomRules[0].action.type, 'block');

  // Toggle rule
  await crm.toggleRule(res.rule.id);
  assert.strictEqual(crm.toDNRRules().length, 0, 'Disabled rule should not be included in active DNR rules');

  console.log('✓ Whitelist and Custom Rules tests passed.');
}

if (require.main === module) {
  runTest();
}

module.exports = { runTest };
