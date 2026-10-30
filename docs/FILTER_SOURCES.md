# Filter Sources, Conversion, and Attribution

## 1. Candidate and Baseline Sources
Su_AdBlock utilizes baseline rules adapted from reputable open-source community filter lists:
- **EasyList:** Baseline advertising domains, banner networks, and ad exchanges (https://easylist.to/).
- **EasyPrivacy:** Tracking endpoints, analytics beacons, and behavioral telemetry (https://easylist.to/easylist/easyprivacy.txt).
- **Peter Lowe's Ad and Tracking Server List:** Host-based ad-serving endpoints (https://pgl.yoyo.org/adservers/).
- **uBlock Origin Community Assets:** Selected annoyance and anti-adblock script signatures (https://github.com/uBlockOrigin/uAssets).

## 2. Chrome Declarative Net Request (DNR) Conversion
Standard Adblock Plus (ABP) and uBlock Origin rule syntax cannot be executed directly by Google Chrome's Manifest V3 network engine. Su_AdBlock includes a built-in converter (`core/filter-validator.js`) that translates supported ABP patterns into native DNR JSON specifications:

| ABP Syntax | Converted DNR Representation | Priority | Notes |
| :--- | :--- | :--- | :--- |
| `\|\|example.com^` | `{ action: { type: "block" }, condition: { urlFilter: "\|\|example.com^" } }` | 1 | Blocks requests to `example.com` and all subdomains |
| `@@\|\|trusted.com^` | `{ action: { type: "allow" }, condition: { urlFilter: "\|\|trusted.com^" } }` | 2 | Higher priority exception rule |
| `domain.com##.ad-banner` | Added to `cosmetic/selectors.json` | N/A | Evaluated by cosmetic content script, not DNR |
| Complex Regex / Modifiers | Filtered out | N/A | Skipped if containing unsupported options (e.g. `$websocket`, `:-abp-has`) |

## 3. Capacity & Limits
Chrome enforces strict browser limits on Declarative Net Request rules:
- Maximum dynamic rules: 30,000 rules.
- Maximum static rules per ruleset: 50,000 rules.
- Maximum enabled static rulesets: 10 rulesets.
Su_AdBlock validates rule arrays against these constraints before applying updates, guaranteeing zero browser crashes or rule rejections.

## 4. Updates & Rollback Mechanism
- Updates are scheduled using `chrome.alarms` every 48 hours (configurable).
- Downloaded JSON rules must arrive over secure HTTPS.
- The validator enforces schema validity, unique IDs, and FNV-1a checksum verification.
- **Atomic Rollback:** If an update fails download, checksum mismatch, or schema validation, existing working baseline rules are strictly preserved without interruption.

## 5. Licensing & Attribution
- EasyList and EasyPrivacy are published under the GNU General Public License version 3 (GPLv3) and Creative Commons Attribution 3.0.
- Peter Lowe's list is copyright Peter Lowe and used with credit.
- Converted rules are distributed in this project under applicable open-source terms.
