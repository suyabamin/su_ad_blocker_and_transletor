# Privacy and Data Handling Policy

**Su_AdBlock: Free Forever. Private by Design.**

Su_AdBlock is designed from the ground up as a private, local-first utility. We believe privacy tools must not compromise the user's trust.

## 1. Zero Telemetry & No Analytics
- Su_AdBlock contains **no analytics libraries**, **no tracking scripts**, and **no crash-reporting telemetry**.
- No Google Analytics, Segment, Mixpanel, Sentry, Firebase, or cloud metrics exist in any portion of the codebase.
- The extension communicates with **zero** custom backend servers.

## 2. Chrome Permissions Explanation

The extension requests only the minimum set of permissions required to deliver its core ad blocking, translation, and PDF viewing functions:

| Permission | Purpose & Scope |
| :--- | :--- |
| `storage` | Stores user settings, custom rules, domain allowlist, aggregate counts, and opt-in translation history locally on your computer via `chrome.storage.local`. |
| `declarativeNetRequest` | Enables Chrome's native Declarative Net Request API to block advertising, tracking, and annoyance network requests. |
| `declarativeNetRequestFeedback` | Reads blocked rule events in developer/unpacked mode to calculate local statistics without inspecting or recording the target URL. |
| `alarms` | Schedules periodic, low-frequency background checks for updated baseline filter rules via `chrome.alarms`. |
| `contextMenus` | Creates the right-click menu item "Translate selection to বাংলা" for selected text. |
| `activeTab` | Allows the extension to read the selected text on the active webpage only when you explicitly click the context menu or press the translation shortcut. |
| `scripting` | Injects selection styling and cosmetic hiding rules safely on active webpages. |
| `*://*/*` (Host permissions) | Required for Chrome Declarative Net Request rules to match advertising and tracking requests across all websites. |

### Permissions Explicitly Omitted
Su_AdBlock will **never** request:
- `history` (browsing history access)
- `cookies` (cookie access or session hijacking)
- `tabs` (full tabs inspection)
- `webNavigation` (monitoring browsing transitions)
- `geolocation`, `camera`, `microphone`, or any biometric sensor permissions.

## 3. Data Processing Disclosures

### A. Translation Text
- Selected English text is processed **100% locally** on your machine.
- Text is **never uploaded** to Google Translate, Microsoft Translator, OpenAI, DeepL, or any cloud API.
- Translations utilize either the local offline lexicon or the local ONNX neural model (`Xenova/opus-mt-en-bn`) running in browser WebAssembly or WebGPU.

### B. PDF Documents
- PDF documents opened in the extension-owned reader are read from your local disk using HTML5 FileReader directly into browser memory.
- Document bytes, pages, and extracted text are **never transmitted** over any network connection.

### C. Translation History
- Translation history is **disabled by default** (opt-in).
- When enabled, history items are stored purely in `chrome.storage.local`.
- History items do **not** record the webpage URL where the selection occurred.
- Users can delete individual history entries or wipe all history at any time.

### D. Network Activity
The only network requests the extension is capable of performing are:
1. Periodic HTTPS checks to the official GitHub repository for updated baseline JSON filter rules.
2. Optional download of open-source ONNX translation model weights from Hugging Face if the user explicitly clicks "Download Neural Model" in the dashboard.
Neither of these requests contains user identifiers, cookies, browsing history, or page content.
