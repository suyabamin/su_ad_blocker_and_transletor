# Changelog

All notable changes to the Su_AdBlock project are documented in this file.

## [1.0.0] - 2026-10-31

### Added
- Complete Chrome Manifest V3 extension implementation with service worker background architecture.
- Declarative Net Request (DNR) network filtering with baseline static rulesets:
  - `rules/ads.json` (84 rules)
  - `rules/trackers.json` (47 rules)
  - `rules/annoyances.json` (13 rules)
- Dynamic DNR rule management for website allowlist (`priority: 2`) and user custom blocking/allowing rules.
- Cosmetic CSS filter engine (`content/cosmetic.js`, `cosmetic/selectors.json`) with debounced MutationObserver.
- English-to-Bangla selection translation content script (`content/selection.js`, `selection.css`) with non-intrusive floating trigger badge and popover dialog.
- Hybrid translation architecture with offline lexicon engine (`translator/lexicon.js`) and local neural model support (`Xenova/opus-mt-en-bn`) powered by locally bundled Transformers.js v2.17.2.
- Text chunker (`translator/text-chunker.js`) preserving sentence boundaries and paragraph structures.
- Dedicated offline PDF reader (`translator/pdf-reader/`) bundling Mozilla PDF.js v3.11.174 with active text layer and translation sidebar.
- Right-click context menu "Translate selection to বাংলা" and keyboard shortcuts (`Alt+Shift+B`, `Alt+Shift+P`).
- Browser popup (`popup/`) with master protection toggle, current-site pause/resume, and live statistics counters.
- Comprehensive 12-section management dashboard (`dashboard/`) covering Overview, Ad Blocking, Tracker Protection, Cosmetic Filtering, Whitelist, Custom Rules, Filter Lists, Statistics, Translator Workbench, Translation History, Settings, and About.
- Automated test suite (`tests/run-all-tests.js`) covering manifest validity, DNR schema, filter conversion, whitelist matching, text chunking, translation, and privacy audit.
- Full technical documentation in `docs/`.
