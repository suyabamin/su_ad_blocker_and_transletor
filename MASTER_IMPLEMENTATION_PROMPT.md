# Su_AdBlock — One-Prompt Full Extension Build

Act as a senior Chrome Extension Manifest V3 engineer, privacy engineer, JavaScript architect, and QA engineer. Build the complete **Su_AdBlock** Chrome extension in the current workspace. Do not stop at planning, scaffolding, or a UI mockup.

## Product

- Name: Su_AdBlock
- Tagline: Free Forever. Private by Design.
- Target: desktop Google Chrome, Manifest V3
- Purpose: advanced ad/tracker blocking plus English-to-Bangla selection translation, including supported PDFs.
- Cost: no paid APIs, no subscription, no custom backend, no account.
- Privacy: no analytics, telemetry, browsing-history collection, page-content uploads, selected-text uploads, or document uploads.

## Mandatory workflow

1. Inspect the complete workspace and preserve existing work.
2. Read current Chrome Manifest V3 documentation for APIs you intend to use.
3. Write a short implementation checklist.
4. Build all features in modular files.
5. Run available tests and validate manifest/rules.
6. Test in Chrome where the environment permits.
7. Fix critical errors and regression-test existing features.
8. Finish with an honest report of implemented features, tests actually run, known limitations, and exact installation steps.

Do not fabricate results. Do not claim 100% ad removal, perfect translation, universal PDF support, or passing tests that were not performed. Every visible control must work. Do not leave fake statistics or nonfunctional buttons.

## Technology

Use:
- Chrome Extension Manifest V3
- Vanilla JavaScript, HTML5, CSS3
- `chrome.declarativeNetRequest` for network filtering
- `chrome.storage.local` for settings
- `chrome.alarms` for periodic filter checks
- `chrome.contextMenus` for right-click translation
- Chrome commands API for keyboard shortcut
- A browser-compatible local translation runtime/model, only after verifying compatibility
- Locally bundled PDF.js for a dedicated PDF reader if feasible

Avoid frameworks and build systems unless the chosen local model runtime requires them. No backend, Firebase, Supabase, Express, FastAPI, cloud translation API, Google Translate API, or Microsoft Translator API.

## Suggested structure

```text
Su_AdBlock/
├── manifest.json
├── background/
│   ├── service-worker.js
│   ├── context-menu.js
│   ├── commands.js
│   └── message-router.js
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── dashboard/
│   ├── dashboard.html
│   ├── dashboard.css
│   ├── dashboard.js
│   └── pages/
│       ├── overview.js
│       ├── filters.js
│       ├── whitelist.js
│       ├── custom-rules.js
│       ├── translation.js
│       ├── history.js
│       └── settings.js
├── content/
│   ├── selection.js
│   ├── selection.css
│   ├── cosmetic.js
│   └── cosmetic.css
├── core/
│   ├── dnr-manager.js
│   ├── settings-store.js
│   ├── whitelist-manager.js
│   ├── custom-rules-manager.js
│   ├── statistics-manager.js
│   ├── filter-update-manager.js
│   ├── filter-validator.js
│   └── translation-manager.js
├── translator/
│   ├── translator-worker.js
│   ├── model-loader.js
│   ├── text-chunker.js
│   └── pdf-reader/
│       ├── reader.html
│       ├── reader.js
│       └── reader.css
├── rules/
│   ├── ads.json
│   ├── trackers.json
│   └── annoyances.json
├── cosmetic/
│   └── selectors.json
├── assets/
├── tests/
├── docs/
├── README.md
├── CHANGELOG.md
└── LICENSE
```

Adapt only when technically justified. Do not create empty placeholder files and call them complete.

## 1. Manifest V3 and permissions

Create a valid MV3 manifest and configure the service worker, popup, options/dashboard, static DNR rulesets, icons, and only necessary permissions.

Potential permissions include `storage`, `alarms`, `declarativeNetRequest`, `contextMenus`, `activeTab`, `scripting`, and optional host permissions. Choose the minimum needed and explain each permission. Do not request `history`, `cookies`, geolocation, camera, microphone, or unrelated permissions.

Never use Manifest V2 or blocking `webRequest`. Handle Chrome internal pages and restricted pages gracefully. Do not claim content-script access to `chrome://` pages or Chrome's built-in PDF viewer.

## 2. Ad and tracker blocking

Implement DNR-based network filtering for:
- known advertising network requests
- known third-party tracking endpoints
- known analytics and tracking pixels
- supported ad-serving/pop-up requests
- user-defined blocked domains

Evaluate reputable filter sources:
- EasyList: https://easylist.to/
- EasyPrivacy: https://easylist.to/easylist/easyprivacy.txt
- Peter Lowe's list: https://pgl.yoyo.org/adservers/
- suitable uBlock Origin filter resources: https://github.com/uBlockOrigin/uAssets

Do not assume raw ABP/uBlock syntax is directly compatible with Chrome DNR. Implement or use a documented converter. Convert only supported syntax. Report converted, unsupported, invalid, duplicate, and skipped rules. Never silently claim full filter-list coverage.

Bundle baseline rules so initial protection works offline. Support optional HTTPS downloads of precompiled JSON rules from a static GitHub repository. Do not download executable code.

Validate downloaded rules for:
- expected schema and structure
- version and checksum
- unique IDs and deterministic ID namespaces
- DNR action/condition validity
- rule count and browser limits
- maximum file size
- HTTPS source

Preserve existing valid rules if an update fails. Apply updates safely and atomically where the API permits. Check actual Chrome rule limits rather than assuming unlimited capacity. Implement global protection toggle, per-site allowlist/pause, and custom block/allow domains. Use correct hostname parsing and exact/subdomain matching, never unsafe substring matching. Test allow-rule priorities and exceptions.

## 3. Cosmetic filtering

Keep cosmetic selectors separate from DNR rules. Implement only supported, safe CSS selector filtering in content scripts. Use restrained MutationObserver logic and avoid removing ordinary content. Provide enable/disable, domain-scoped selectors, and validated user selectors. Never execute arbitrary JavaScript from filter lists or users.

Document limitations such as restricted pages, cross-origin frames, closed shadow DOM, and changing website markup.

## 4. English-to-Bangla selection translation

Implement this workflow on supported webpages:

1. User selects English text.
2. A small floating `Translate to বাংলা` control appears near the selection.
3. Translation starts only after the user clicks.
4. Show original text and Bangla result.
5. Provide Copy, Retry, Close, and expanded view.

Do not interfere with editable fields, forms, browser UI, or normal website interactions. Hide the control when selection clears or focus changes. Handle scrolling/resizing, empty selection, long selections, duplicate requests, loading, cancellation where feasible, and meaningful errors. Preserve paragraph boundaries as much as possible. Provide a setting to disable the floating control.

### Local model

Evaluate a real open-source English-to-Bengali model, for example an appropriate OPUS-MT checkpoint or compatible Indic model. Verify its model card, license, architecture, tokenizer, browser runtime compatibility, actual translation quality, download size, and RAM requirements. Do not invent model URLs or claim compatibility without testing.

Use Transformers.js or another browser-compatible runtime only if the selected model is actually supported. Bundle executable runtime code locally. Download model weights from a trusted HTTPS host and cache them locally. Never send selected text or PDF content to the model host or any translation API.

Lazy-load the model after the first user translation request. Show download and initialization progress. Use WebGPU only when available and tested; provide a WASM fallback only if tested. Offline translation is available only after all required assets are cached. If the model cannot run, show an honest unavailable/error state, not a fake translation.

Split long text into manageable chunks and avoid freezing the page. Do not auto-translate merely on selection.

## 5. Context menu and shortcut

Add a context menu item `Translate selection to Bangla` using `chrome.contextMenus`. Pass only browser-provided selected text to the extension UI. Add a configurable shortcut, suggested default `Alt+Shift+B`, and document `chrome://extensions/shortcuts`. Handle unsupported pages and empty selections gracefully.

## 6. PDF translation

Do not assume ordinary content scripts can access Chrome's built-in PDF viewer.

Provide a dedicated extension-owned PDF.js reader as the reliable path:
- bundle a licensed PDF.js build locally
- include license notices
- open local PDFs without uploading them
- support page navigation, zoom, selectable text, and selection translation
- keep original PDF content intact

For scanned/image-only PDFs, OCR is optional. Evaluate local Tesseract.js only if its runtime and language assets can be bundled/licensed and tested. Do not advertise OCR unless it actually works. Never upload PDF pages. Do not automatically translate a whole PDF without explicit user action.

## 7. Translation dashboard and history

Add a Translation section with manual text input, English-to-Bangla direction, translate, original/result panels, copy, clear, model status, download status, and offline readiness.

Translation history must be opt-in, local, limited in size, individually deletable, and clearable. Do not save full page URLs. Never sync or transmit history.

## 8. Popup and dashboard UI

Create a polished, responsive, accessible design:
- dark green primary
- green accent
- white/light neutral surfaces
- readable typography
- consistent local icons
- keyboard focus and reduced-motion support

Popup:
- Su_AdBlock identity
- protection status
- global on/off
- current-site status and allowlist toggle
- honest blocking statistics
- dashboard link
- translation shortcut/model status

Dashboard sections:
1. Overview
2. Ad Blocking
3. Tracker Protection
4. Cosmetic Filtering
5. Website Allowlist
6. Custom Rules
7. Filter Lists
8. Statistics
9. English → বাংলা Translator
10. Translation History
11. Settings
12. About

Every control must work. No demo values or decorative nonfunctional buttons.

## 9. Statistics

Do not count installed rules as blocked requests. Use DNR matched-rule feedback only if supported, permissioned, and tested. Explain limitations. If exact counts are not possible, label values approximate or unavailable. Keep aggregates local, never store full URLs, and provide reset.

## 10. Filter update manager

Use `chrome.alarms`, not `setInterval`, for periodic update checks. Service workers can stop/restart, so persist state and make operations restart-safe.

Update sequence:
1. Fetch configured HTTPS version metadata.
2. Download only when version differs.
3. Enforce size limits.
4. Validate checksum, schema, DNR structure, IDs, and rule count.
5. Check capacity.
6. Apply safely.
7. Save last successful update.
8. Preserve old valid rules on any failure.
9. Provide manual update and status.

Hosting providers may receive ordinary network metadata such as IP address. Never send browsing history, visited URLs, page contents, selected text, PDF content, or user identifiers.

## 11. Security and reliability

- Validate all messages among content scripts, popup, dashboard, and service worker.
- Define explicit message types and payload schemas.
- Treat remote filter data, selected text, and PDF text as untrusted.
- Use `textContent` for displaying user text.
- Avoid HTML injection.
- No `eval`, `new Function`, remote executable scripts, or inline script injection.
- No remote fonts, analytics, or tracking scripts.
- Handle service worker restarts, storage failures, offline mode, missing permissions, invalid data, DNR errors, and unsupported pages.
- Never delete old working rules before new rules are validated.
- Minimize host permissions and explain them.

## 12. Testing

Create repeatable tests for:
- manifest validity
- DNR schema and duplicate IDs
- allowlist and priority behavior
- hostname matching
- global pause/resume
- custom rules
- filter update validation and rollback
- offline baseline protection
- service worker restart
- selection detection and dismissal
- long-text chunking
- model-not-installed and model failure states
- actual local translation after download
- offline translation after caching
- context menu and shortcut
- PDF.js selectable text
- OCR only if implemented
- history deletion
- privacy/network audit

Manually test representative search, video, news, documentation, and shopping pages. Verify normal login, search, video playback, and checkout remain usable. Do not claim websites are completely ad-free. Record Chrome version, OS, steps, pass/fail, and console errors.

## 13. Documentation

Create substantive, project-specific Markdown files:
- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/PRIVACY.md`
- `docs/FILTER_SOURCES.md`
- `docs/TRANSLATION.md`
- `docs/TESTING.md`
- `docs/LIMITATIONS.md`
- `docs/DEVELOPMENT.md`
- `CHANGELOG.md`
- `LICENSE`

Include actual permission choices, source attribution, setup, test results, and limitations. Do not leave generic placeholders.

## 14. Definition of done

The extension is done only when:
- Chrome loads it without manifest errors.
- Popup and dashboard controls work.
- Baseline DNR rules install and are tested.
- Allowlist and custom rules work.
- Cosmetic filtering works on documented tested pages.
- Filter updates validate and preserve old rules on failure.
- Selection UI works on tested webpages.
- Local model translation is genuinely tested, or explicitly marked incomplete with no fake active control.
- PDF.js selectable-text translation works if claimed.
- OCR is claimed only if implemented and tested.
- History is local and opt-in.
- No browsing data, selected text, or document contents are transmitted.
- Documentation and test report are complete.

## 15. Execute now

Implement the full extension in this workspace. Do not stop after writing this plan. Create source files, wire every control, run tests, inspect browser errors where possible, fix defects, and report exact results. If a feature cannot be safely or reliably implemented, explain why and provide the best honest fallback. Preserve working features throughout.
