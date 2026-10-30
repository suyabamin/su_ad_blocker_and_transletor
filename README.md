# Su_AdBlock

**Free Forever. Private by Design.**

Su_AdBlock is a high-performance desktop Google Chrome extension built strictly on **Manifest V3**. It combines advanced network ad and tracker blocking with an offline-capable English-to-Bangla selection translator and a dedicated local PDF.js reader.

Zero paid APIs. Zero tracking or telemetry. Zero user accounts. Zero external server dependencies.

---

## Key Features

### 🛡️ Native Ad & Tracker Blocking
- **Chrome Declarative Net Request (DNR):** Blocks advertising networks, analytics engines, tracking pixels, and annoyance endpoints natively at the browser network layer.
- **Baseline Static Rulesets:** 144 bundled offline rules covering EasyList, EasyPrivacy, Peter Lowe, and uAssets signatures.
- **Dynamic Rules & Whitelist:** Pause protection per-site with one click or create custom user blocking/allowing rules with deterministic priorities.
- **Cosmetic Filtering:** Cleanly hides blank ad containers, sponsored elements, and layout placeholders with debounced MutationObserver logic.

### 🌐 English → বাংলা Selection Translation
- **Non-Intrusive Floating Trigger:** Selecting English text displays a small `Translate to বাংলা` badge near the cursor.
- **User-Controlled Execution:** Translation never starts automatically—only runs when you click.
- **Instant Offline Lexicon:** Built-in offline dictionary translates hundreds of common words, verbs, technical terms, and phrases immediately without network requests.
- **Local Neural Model (`Xenova/opus-mt-en-bn`):** MarianMT transformer running locally via bundled Transformers.js (ONNX Runtime Web) with WebGPU acceleration and WASM fallback.
- **Context Menu & Shortcuts:** Right-click `Translate selection to বাংলা` or press `Alt+Shift+B`.

### 📄 Dedicated Local PDF Reader
- **100% Private Offline PDF Viewer:** Powered by locally bundled Mozilla PDF.js v3.11.174.
- **Direct Selection Translation:** Highlight English text in any local PDF document to translate immediately in the sidebar.
- **Complete Privacy:** PDF documents never leave your local browser memory.

### 🎛️ Full 12-Section Management Dashboard
1. Overview & System Health
2. Ad Blocking Controls
3. Tracker & Privacy Shield
4. Cosmetic Filtering Settings
5. Website Allowlist Management
6. Custom DNR Rules Editor
7. Filter Lists & Secure HTTPS Updater
8. Local Aggregated Statistics
9. English → বাংলা Translation Workbench
10. Opt-In Local Translation History
11. Extension Configuration
12. About & Licensing

---

## Installation in Google Chrome

1. Clone or download this repository.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. In the top-right corner, enable **Developer mode**.
4. Click the **Load unpacked** button in the top-left toolbar.
5. Select the folder containing `manifest.json` (`d:\Su_AdBlock Documentation`).
6. Su_AdBlock is now active and ready to protect your browsing.

---

## Verification & Automated Tests

Su_AdBlock includes an automated test suite verifying manifest validity, static DNR schemas, ABP syntax conversion, allowlist matching, text chunking, and privacy network auditing:

```powershell
node tests/run-all-tests.js
```

All 7 test suites pass with 0 failures:
- ✓ Manifest V3 Validity
- ✓ Static DNR Rulesets (144 baseline rules)
- ✓ Filter Validator & ABP Converter
- ✓ Whitelist & Custom Rules Subdomain Matching
- ✓ Text Chunker & Sentence Splitting
- ✓ Translation & Offline Lexicon
- ✓ Privacy & Security Network Audit (zero external leaks)

---

## Documentation Index

- [Architecture & Data Flow](docs/ARCHITECTURE.md)
- [Privacy & Permissions Policy](docs/PRIVACY.md)
- [Filter Sources & Conversion](docs/FILTER_SOURCES.md)
- [Translation System Design](docs/TRANSLATION.md)
- [Testing & Verification Guide](docs/TESTING.md)
- [Known Limitations & Disclosures](docs/LIMITATIONS.md)
- [Development & Maintenance](docs/DEVELOPMENT.md)

---

## License

This project is licensed under the [MIT License](LICENSE).  
Bundled third-party libraries:
- Mozilla PDF.js is licensed under the [Apache License 2.0](translator/pdf-reader/lib/LICENSE_PDFJS.txt).
- Hugging Face Transformers.js is licensed under the [Apache License 2.0](translator/lib/LICENSE_TRANSFORMERS.txt).
