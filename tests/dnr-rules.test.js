/**
 * Su_AdBlock Tests - Declarative Net Request Rulesets
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { FilterValidator } = require('../core/filter-validator');

function runTest() {
  console.log('--- Testing Static Declarative Net Request Rulesets ---');

  const files = ['rules/ads.json', 'rules/trackers.json', 'rules/annoyances.json'];
  const allIds = new Set();
  let totalRules = 0;

  for (const file of files) {
    const fullPath = path.join(__dirname, '..', file);
    assert(fs.existsSync(fullPath), `File must exist: ${file}`);

    const raw = fs.readFileSync(fullPath, 'utf8');
    const rules = JSON.parse(raw);
    assert(Array.isArray(rules), `${file} content must be an array`);

    const validation = FilterValidator.validateRuleset(rules);
    assert(validation.valid, `Ruleset ${file} validation failed: ${validation.errors.join(', ')}`);

    for (const rule of rules) {
      assert(!allIds.has(rule.id), `Duplicate ID across rulesets detected: ${rule.id} in ${file}`);
      allIds.add(rule.id);
      totalRules++;

      // Action validation
      assert(rule.action && (rule.action.type === 'block' || rule.action.type === 'allow'), `Rule ${rule.id} has invalid action`);
      // Condition validation
      assert(rule.condition && (rule.condition.urlFilter || rule.condition.regexFilter), `Rule ${rule.id} must define filter`);
    }
    console.log(`✓ ${file}: ${rules.length} valid DNR rules verified.`);
  }

  console.log(`✓ Total static DNR rules: ${totalRules}. All IDs unique and deterministic.`);
}

if (require.main === module) {
  runTest();
}

module.exports = { runTest };
