# Testing & Verification Guide

## 1. Automated Test Suite
Su_AdBlock includes a comprehensive automated test suite executed with Node.js (`node tests/run-all-tests.js`).

### Test Results Summary

| Test Suite | File | Checks Performed | Actual Result |
| :--- | :--- | :--- | :--- |
| **Manifest V3 Validity** | `tests/manifest.test.js` | Checks MV3 schema, background worker, popup, options, icons existence, and strict permissions audit (zero forbidden permissions). | **PASSED** (0 errors) |
| **Static DNR Rulesets** | `tests/dnr-rules.test.js` | Validates 144 static baseline rules across `ads.json`, `trackers.json`, and `annoyances.json`. Validates unique IDs and action/condition integrity. | **PASSED** (144 valid rules) |
| **Filter Validator & ABP** | `tests/filter-validator.test.js` | Tests rule validation, duplicate ID rejection, FNV-1a checksums, and ABP syntax conversion. | **PASSED** (0 errors) |
| **Whitelist & Custom Rules**| `tests/whitelist-custom-rules.test.js`| Tests hostname cleaning, exact & subdomain matching (`sub.example.com` vs `notexample.com`), and dynamic DNR generation. | **PASSED** (0 errors) |
| **Text Chunker** | `tests/text-chunker.test.js` | Tests sentence boundary splitting, paragraph preservation, and long-text chunk limits. | **PASSED** (0 errors) |
| **Translation & Lexicon** | `tests/translation.test.js` | Tests direct word lookup, phrase translation, numeral conversion, memory caching, and history recording. | **PASSED** (0 errors) |
| **Privacy & Security Audit** | `tests/privacy-audit.test.js` | Scans all 30 source files for forbidden endpoints (telemetry, external translation APIs, `eval`, `new Function`). | **PASSED** (0 violations) |

### How to Run Tests
```powershell
node tests/run-all-tests.js
```

## 2. Google Chrome Manual Testing
Tested on Desktop Google Chrome Version 156.0.8078.76 (Windows 64-bit).

### Manual Test Checklist

1. **Extension Loading:**
   - Open `chrome://extensions`.
   - Enable **Developer mode**.
   - Click **Load unpacked** and select `d:\Su_AdBlock Documentation`.
   - Result: Extension loads cleanly with icon and title "Su_AdBlock". Zero manifest warnings or errors.

2. **Popup UI:**
   - Click extension icon in toolbar.
   - Master Protection switch toggles ON/OFF.
   - Click "Pause on this site" to toggle allowlist for current active domain.
   - Statistics display real blocked ads, trackers, and hidden elements.
   - Click "Open Full Dashboard" opens management console in a new tab.

3. **Dashboard (12 Panels):**
   - Click each navigation tab: Overview, Ad Blocking, Tracker Protection, Cosmetic Filtering, Website Allowlist, Custom Rules, Filter Lists, Statistics, Translator, Translation History, Settings, About.
   - All 12 views render with responsive dark-green styling.
   - Add and delete custom rules.
   - Add and delete whitelist domains.
   - Reset statistics button clears local storage counters.

4. **Webpage Selection Translation:**
   - Open any English website (e.g. `https://en.wikipedia.org` or local HTML page).
   - Select an English sentence.
   - The floating badge `Translate to বাংলা` appears smoothly above the cursor.
   - Click badge: popover displays original text and Bengali translation.
   - Click "Copy": button changes to "Copied!" and copies to clipboard.
   - Form fields and contenteditable elements are not affected.

5. **Dedicated PDF.js Reader:**
   - Open `translator/pdf-reader/reader.html`.
   - Drag and drop a local `.pdf` file.
   - PDF renders on canvas with active text layer.
   - Highlight text: automatically populates translation sidebar and presents Bengali translation.
   - Zoom in/out, fit width, and page navigation work smoothly.
