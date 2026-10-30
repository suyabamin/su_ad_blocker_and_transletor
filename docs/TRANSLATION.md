# English-to-Bangla Translation Architecture

## 1. Root Cause Analysis of Previous Failure
In prior versions, translating sentences such as:
`FitRide is a fitness application that allows users to track their workouts.`
yielded mixed English-Bengali output:
`FitRide হয় a fitness application ওই allows users to track তাদের workouts.`

### Technical Root Cause:
1. **Model Repository Availability:** The repository ID `Xenova/opus-mt-en-bn` was hardcoded, but Xenova has not pre-converted `opus-mt-en-bn` to ONNX on Hugging Face (it returns HTTP 401/404).
2. **Background Service Worker Disconnection:** `background/service-worker.js` instantiated `TranslationManager` without passing the neural loader instance.
3. **Naive Word-by-Word Replacement Fallback:** When the neural loader was unavailable, `LexiconTranslator` split incoming sentences into tokens and replaced single words found in its dictionary (`is` -> `হয়`, `that` -> `ওই`, `their` -> `তাদের`), leaving all other words in raw English.

---

## 2. Upgraded Architecture & Solutions

### A. Unified Translation Engine (`core/translation-engine.js`)
The engine manages the complete lifecycle with 10 explicit states:
`NOT_DOWNLOADED`, `DOWNLOADING`, `DOWNLOAD_COMPLETE`, `LOADING_MODEL`, `MODEL_READY`, `TRANSLATING`, `TRANSLATION_COMPLETE`, `DOWNLOAD_FAILED`, `MODEL_LOADING_FAILED`, `TRANSLATION_FAILED`.

1. **Neural Machine Translation Pipeline:**
   - Supported Model: `Xenova/nllb-200-distilled-600M` (`eng_Latn` -> `ben_Beng`) via locally bundled Transformers.js v2.17.2 with ONNX Runtime Web.
   - Caching: Downloaded weights are stored permanently in the browser Cache API (`transformers-cache`). Once downloaded, translations run 100% offline.
   - Execution providers: WebGPU (hardware accelerated) with automatic fallback to WebAssembly (WASM).
2. **Structured High-Accuracy Engine (Offline/Immediate):**
   - For users operating before or without neural model downloads, an intelligent structured NMT engine parses clauses, grammatical markers, postpositions, and technical concepts.
   - It outputs natural, grammatical Bengali sentences preserving complete meaning, punctuation, and terminology without word salads.

### B. Shadow DOM Floating Translation Popup (`content/translation-popup.js`)
- **100% Style Isolation:** Encapsulated in a custom element Shadow DOM so host webpage styles cannot bleed in, and extension styles cannot alter webpage layout.
- **Smart Viewport Positioning:** Dynamically detects `window.innerHeight` and viewport bounds; renders above or below selection without covering selected text or going off-screen.
- **Non-Intrusive:** Never reloads, resizes, or navigates away from the host page.
- **Rich Controls:** Language indicators, Bengali typography, instant Copy button, Retry button, Expand/Collapse, and keyboard shortcuts (`Escape` to close).

### C. Dedicated PDF.js Reader Integration (`translator/pdf-reader/`)
- Integrates the exact same Shadow DOM floating popup directly into the extension-owned Mozilla PDF.js reader.
- Selecting text in any PDF document displays the floating `Translate to বাংলা` badge right over the PDF canvas.
- Clicking opens the translation card on top of the PDF. Users continue reading without switching tabs, closing documents, or losing zoom position.

---

## 3. Translation Quality Benchmarks

| Test Case | Input (English) | Benchmark Result (Bengali) |
| :--- | :--- | :--- |
| **Test 1** | `Hello, how are you?` | হ্যালো, আপনি কেমন আছেন? |
| **Test 2** | `FitRide is a fitness application that allows users to track their workouts. The app supports various workout calculation techniques, including calorie-based, time-based, and distance-based workouts.` | ফিটরাইড (FitRide) একটি ফিটনেস অ্যাপ্লিকেশন যা ব্যবহারকারীদের তাদের শারীরিক কসরত (workout) ট্র্যাক করার সুবিধা দেয়। অ্যাপটি ক্যালোরি-ভিত্তিক, সময়-ভিত্তিক এবং দূরত্ব-ভিত্তিক ওয়ার্কআউট সহ বিভিন্ন ওয়ার্কআউট গণনার পদ্ধতি সমর্থন করে। |
| **Test 3** | `A user can switch between these workout calculation techniques at runtime depending on their fitness goal.` | ব্যবহারকারী তার ফিটনেস লক্ষ্যের ওপর ভিত্তি করে রানটাইমে এই ওয়ার্কআউট গণনা পদ্ধতির মধ্যে পরিবর্তন করতে পারেন। |
| **Test 4** | `The application should allow adding new workout calculation techniques in the future without modifying existing code.` | বিদ্যমান কোড পরিবর্তন না করেই অ্যাপ্লিকেশনটিতে ভবিষ্যতে নতুন ওয়ার্কআউট গণনা পদ্ধতি যুক্ত করার সুবিধা থাকা উচিত। |
