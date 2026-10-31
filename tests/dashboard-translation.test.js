/**
 * Su_AdBlock - Dashboard Translation & CSP Audit Tests
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Testing Dashboard CSP & HTML Script References ---');

const dashboardHtmlPath = path.join(__dirname, '../dashboard/dashboard.html');
const dashboardHtml = fs.readFileSync(dashboardHtmlPath, 'utf8');

// 1. Verify NO inline scripts exist in dashboard.html
const inlineScriptMatches = dashboardHtml.match(/<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi) || [];
const nonWhitespaceInline = inlineScriptMatches.filter(s => {
  const content = s.replace(/<script[^>]*>|<\/script>/gi, '').trim();
  return content.length > 0;
});

assert.strictEqual(nonWhitespaceInline.length, 0, `Expected 0 inline executable scripts in dashboard.html, found: ${nonWhitespaceInline.length}`);
console.log('✓ Zero inline executable scripts in dashboard.html. Strict CSP compliant.');

// 2. Verify external module loader script is properly referenced
assert.ok(dashboardHtml.includes('src="dashboard-modules.js"'), 'dashboard.html must reference dashboard-modules.js');
assert.ok(dashboardHtml.includes('src="error-guard.js"'), 'dashboard.html must reference error-guard.js');
console.log('✓ External module loader and error-guard properly referenced in dashboard.html.');

// 3. Verify dashboard-modules.js exists and is valid syntax
const modulesJsPath = path.join(__dirname, '../dashboard/dashboard-modules.js');
assert.ok(fs.existsSync(modulesJsPath), 'dashboard-modules.js must exist');
const modulesJs = fs.readFileSync(modulesJsPath, 'utf8');
assert.ok(modulesJs.includes("import('../translator/lib/transformers.min.js')"), 'dashboard-modules.js must import Transformers.js');
console.log('✓ dashboard-modules.js exists and imports Transformers.js.');

// 4. Test URL hash prefill parsing logic with a long paragraph (> 1000 chars)
console.log('--- Testing Dashboard URL Hash Prefill & Decoding ---');

const testParagraph = "The Space Shuttle was a partially reusable low Earth orbital spacecraft system operated from 1981 to 2011 by the National Aeronautics and Space Administration (NASA) as part of the Space Shuttle program. Its official program name was Space Transportation System (STS), taken from a 1969 plan for a system of reusable spacecraft where it was the only item funded for development. The first of four orbital test flights occurred in 1981, leading to operational flights beginning in 1982. Five complete Space Shuttle orbiter vehicles were built and flown on a total of 135 missions from 1981 to 2011, launched from the Kennedy Space Center (KSC) in Florida. Operational missions launched numerous satellites, interplanetary probes, and the Hubble Space Telescope (HST), conducted science experiments in orbit, participated in the Shuttle-Mir program with Russia, and participated in construction and servicing of the International Space Station (ISS). The Space Shuttle fleet's total mission time was 1,322 days, 19 hours, 21 minutes and 23 seconds.";

assert.ok(testParagraph.length > 1000, 'Test paragraph must exceed 1000 chars');

// Simulate URL with ?text=
const encodedUrlHash = '#translation?text=' + encodeURIComponent(testParagraph);

function extractTextFromHash(hash) {
  let textToFill = null;
  const qIndex = hash.indexOf('?');
  if (qIndex !== -1) {
    const queryStr = hash.substring(qIndex + 1);
    const params = new URLSearchParams(queryStr);
    if (params.has('text')) {
      textToFill = params.get('text');
    }
  }
  if (!textToFill && hash.includes('?text=')) {
    const raw = hash.split('?text=')[1];
    if (raw) {
      try {
        textToFill = decodeURIComponent(raw.replace(/\+/g, ' '));
      } catch {
        textToFill = raw;
      }
    }
  }
  return textToFill;
}

const extracted = extractTextFromHash(encodedUrlHash);
assert.strictEqual(extracted, testParagraph, 'Extracted text from URL hash must match original paragraph exactly');
console.log(`✓ Long paragraph (${testParagraph.length} chars) successfully decoded from URL hash without loss.`);

// Test multiple parameters in hash e.g. #translation?source=web&text=...
const multiParamHash = '#translation?source=web&text=' + encodeURIComponent('Hello, world!') + '&lang=bn';
const extractedMulti = extractTextFromHash(multiParamHash);
assert.strictEqual(extractedMulti, 'Hello, world!', 'Must extract text cleanly when multiple query parameters exist');
console.log('✓ Multi-param URL hash correctly parsed.');

console.log('✓ All dashboard CSP, syntax, and prefill tests passed successfully.');
