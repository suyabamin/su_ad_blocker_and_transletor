# Known Technical Limitations & Honest Disclosures

To preserve engineering integrity and avoid false marketing claims, the following limitations are documented:

## 1. Ad & Tracker Blocking
- **No 100% Ad Removal Guarantee:** No ad blocker can guarantee 100% ad removal.
- **First-Party & Server-Side Ads:** Ads served directly from first-party content delivery streams (such as video pre-rolls on YouTube or sponsored feeds on social platforms) share domain origins with ordinary content. Network-level DNR cannot inspect payload bodies or inject arbitrary code to rewrite streams without breaking primary media playback.
- **Declarative Net Request Constraints:** Chrome Manifest V3 limits dynamic rules to 30,000 rules and imposes regex complexity constraints.
- **Changing Markup:** Cosmetic CSS selectors can become outdated when websites dynamically rotate obfuscated CSS class names and random DOM trees.

## 2. Chrome Internal & Restricted Pages
- Chrome strictly prevents extension content scripts from executing on internal browser pages (`chrome://*`, `edge://*`, `chrome-extension://*`, and the Chrome Web Store).
- If a user selects text on restricted pages and clicks the context menu, Su_AdBlock catches the restriction and gracefully opens the text inside the extension dashboard translation workbench instead.
- In production Windows builds of Google Chrome, the command-line flag `--load-extension` is blocked for security against malware sideloading. Unpacked extensions must be loaded through `chrome://extensions` via Developer mode.

## 3. Translation Subsystem
- **Neural Model Download Size:** The `Xenova/opus-mt-en-bn` ONNX model weights require approximately 140MB of disk storage and internet bandwidth on first download.
- **RAM and Compute:** Neural model inference requires modern browser WebAssembly or WebGPU support and at least 1GB of available RAM. On low-memory devices, Su_AdBlock provides the offline lexicon engine to prevent out-of-memory browser crashes.
- **Idiomatic Translation:** Machine translation can occasionally misinterpret complex idioms, slang, poetry, or niche technical acronyms.

## 4. PDF Reader & OCR
- **Selectable Text Requirement:** Su_AdBlock's PDF reader uses Mozilla PDF.js to extract selectable text from PDF text layers.
- **Scanned / Image-Only PDFs:** Scanned image-only PDFs do not contain embedded text layers. Optical Character Recognition (OCR) requires heavy language model packs (~50MB+) which are omitted by default to avoid bloating extension size. Scanned PDFs without text layers will not have selectable text unless pre-OCR'd.
