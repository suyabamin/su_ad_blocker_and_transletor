# Development & Maintenance Guide

## 1. Prerequisites
- Google Chrome (Version 116+ recommended for full MV3 DNR and Offscreen/WASM support).
- Node.js (v18.0.0 or higher) for running the automated test suite.
- Code editor (VS Code, Cursor, etc.).

## 2. Directory Layout
```text
Su_AdBlock/
├── manifest.json                  # Manifest V3 entry definition
├── background/
│   ├── service-worker.js          # Main event listener & import coordinator
│   ├── message-router.js          # Action validation and dispatching
│   ├── context-menu.js            # Right-click context menu integration
│   └── commands.js                # Keyboard shortcut listener
├── core/
│   ├── settings-store.js          # Configuration via chrome.storage.local
│   ├── dnr-manager.js             # Static & dynamic DNR rules coordinator
│   ├── whitelist-manager.js       # Exact & subdomain allowlist logic
│   ├── custom-rules-manager.js    # User-defined DNR rules manager
│   ├── statistics-manager.js      # Local aggregate blocking counters
│   ├── filter-validator.js        # DNR schema validator & ABP converter
│   ├── filter-update-manager.js   # HTTPS periodic rule updater & rollback
│   └── translation-manager.js     # Translation coordinator & history manager
├── content/
│   ├── selection.js               # Mouse selection floating badge & modal
│   ├── selection.css              # Selection UI styles (isolated z-index)
│   ├── cosmetic.js                # Safe element hiding & MutationObserver
│   └── cosmetic.css               # Baseline ad-hiding CSS
├── translator/
│   ├── lexicon.js                 # Fast offline English-to-Bangla dictionary
│   ├── text-chunker.js            # Natural sentence boundary splitter
│   ├── model-loader.js            # Xenova/opus-mt-en-bn ONNX manager
│   ├── lib/                       # Bundled Transformers.js runtime
│   └── pdf-reader/                # Dedicated Mozilla PDF.js viewer
├── popup/                         # Browser action toolbar popup
├── dashboard/                     # Full 12-section management console
├── rules/                         # Baseline DNR static rulesets
├── cosmetic/                      # Cosmetic CSS selectors
├── assets/                        # Icons and branding assets
├── tests/                         # Node.js automated test suite
└── docs/                          # Comprehensive technical documentation
```

## 3. How to Load and Test in Chrome
1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. In the top-right corner, toggle **Developer mode** to ON.
4. Click the **Load unpacked** button in the top-left corner.
5. In the file picker dialog, select `d:\Su_AdBlock Documentation`.
6. Su_AdBlock will appear in the installed extensions list.
7. Click the extension icon in the Chrome toolbar to verify the popup.

## 4. Debugging
- **Background Service Worker:** On `chrome://extensions`, click the "Inspect views: service worker" link under Su_AdBlock to view background logs and network events.
- **Popup UI:** Right-click the extension toolbar icon and select "Inspect popup".
- **Dashboard:** Open the dashboard tab, right-click anywhere, and select "Inspect" to view DevTools.

## 5. Running Automated Tests
```powershell
node tests/run-all-tests.js
```
All 7 test suites must pass before committing changes.
