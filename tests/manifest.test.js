/**
 * Su_AdBlock Tests - Manifest Validity & MV3 Compliance
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runTest() {
  console.log('--- Testing Manifest V3 Validity ---');

  const manifestPath = path.join(__dirname, '..', 'manifest.json');
  assert(fs.existsSync(manifestPath), 'manifest.json must exist');

  const raw = fs.readFileSync(manifestPath, 'utf8');
  let manifest;
  assert.doesNotThrow(() => {
    manifest = JSON.parse(raw);
  }, 'manifest.json must be valid JSON');

  // MV3 checks
  assert.strictEqual(manifest.manifest_version, 3, 'Must be Manifest V3');
  assert.strictEqual(manifest.name, 'Su_AdBlock');
  assert(manifest.version, 'Must have version string');

  // Background
  assert(manifest.background && manifest.background.service_worker, 'Must declare background service worker');
  assert(fs.existsSync(path.join(__dirname, '..', manifest.background.service_worker)), 'Service worker file must exist');

  // Action / Popup
  assert(manifest.action && manifest.action.default_popup, 'Must declare action default popup');
  assert(fs.existsSync(path.join(__dirname, '..', manifest.action.default_popup)), 'Popup HTML file must exist');

  // Icons
  for (const [size, iconPath] of Object.entries(manifest.icons)) {
    assert(fs.existsSync(path.join(__dirname, '..', iconPath)), `Icon ${size} must exist at ${iconPath}`);
  }

  // Permissions Audit
  const forbiddenPermissions = ['history', 'cookies', 'webNavigation', 'geolocation', 'management', 'bookmarks'];
  for (const p of manifest.permissions) {
    assert(!forbiddenPermissions.includes(p), `Forbidden privacy-invasive permission requested: ${p}`);
  }

  // Declarative Net Request
  assert(manifest.permissions.includes('declarativeNetRequest'), 'Must have declarativeNetRequest permission');
  assert(manifest.declarative_net_request && Array.isArray(manifest.declarative_net_request.rule_resources), 'Must declare rule_resources');

  for (const res of manifest.declarative_net_request.rule_resources) {
    assert(fs.existsSync(path.join(__dirname, '..', res.path)), `Rule file must exist: ${res.path}`);
  }

  console.log('✓ Manifest V3 validation passed successfully.');
}

if (require.main === module) {
  runTest();
}

module.exports = { runTest };
