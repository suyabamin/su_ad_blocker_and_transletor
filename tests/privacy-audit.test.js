/**
 * Su_AdBlock Tests - Privacy and Security Network Audit
 * Scans codebase to ensure zero telemetry, no tracking, and no external leaks.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.join(__dirname, '..');
const IGNORE_DIRS = ['docs', 'tests', 'lib', '.git', 'node_modules'];

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(file)) {
        getAllFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') || file.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function runTest() {
  console.log('--- Testing Privacy Audit & Network Leaks ---');

  const files = getAllFiles(ROOT_DIR);
  const forbiddenPatterns = [
    /google-analytics\.com\/analytics\.js/,
    /google-analytics\.com\/collect/,
    /api\.segment\.io/,
    /browser-update\.org/,
    /amplitude\.com/,
    /mixpanel\.com/,
    /firebaseio\.com/,
    /translate\.google\.com\/translate_a/,
    /api\.cognitive\.microsofttranslator\.com/,
    /api\.deepl\.com/
  ];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(ROOT_DIR, filePath);

    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(content), `Privacy violation: forbidden external endpoint in ${relativePath}: ${pattern}`);
    }

    // Verify no eval or new Function
    assert(!content.includes('eval(') && !content.includes('new Function('), `Security violation: eval or new Function found in ${relativePath}`);
  }

  console.log(`✓ Privacy audit passed across ${files.length} project files. Zero telemetry or external translation APIs found.`);
}

if (require.main === module) {
  runTest();
}

module.exports = { runTest };
