# English-to-Bangla Translation Architecture

## 1. Dual-Engine Translation Strategy
To achieve reliable privacy and immediate functionality without requiring users to download hundreds of megabytes before their first translation, Su_AdBlock uses a **hybrid dual-engine approach**:

```
[User Selects English Text]
            |
            v
[Text Chunker (split sentences & paragraphs)]
            |
            v
[Is Neural Model Ready in Cache?]
       /         \
     YES          NO
     /             \
    v               v
[Local Neural ONNX]  [Local Lexicon Engine]
(Xenova/opus-mt-en-bn) (Instant Offline Fallback)
    \               /
     v             v
[Bengali Translated Result]
```

### Engine 1: Instant Offline Lexicon (`translator/lexicon.js`)
- Pre-bundled dictionary and grammar mapping rules.
- Translates hundreds of English nouns, verbs, pronouns, tech terms, greetings, idioms, and numerals instantly.
- Zero network latency, zero download size, and zero memory footprint.
- Functions immediately upon installation.

### Engine 2: Local Neural ONNX Model (`Xenova/opus-mt-en-bn`)
- Real open-source translation model derived from the Helsinki-NLP OPUS-MT en-bn project.
- Model architecture: MarianMT sequence-to-sequence transformer.
- Runtime: Locally bundled Hugging Face Transformers.js v2.17.2 (`translator/lib/transformers.min.js`) executing ONNX Runtime Web.
- Execution providers: WebGPU (accelerated) with automatic fallback to WebAssembly (WASM).
- Size: ~140MB total ONNX weights (encoder, decoder, tokenizer).
- Caching: Downloaded directly into the browser's persistent Cache API (`transformers-cache`). Once downloaded, inference runs 100% offline.

## 2. Text Chunker (`translator/text-chunker.js`)
- Protects the browser thread from freezing on large blocks of text.
- Splits content into segments of 200 characters or fewer at natural punctuation marks (`.`, `?`, `!`, `,`, `;`).
- Preserves paragraph formatting (`\n\n`) across translated segments.

## 3. Dedicated PDF.js Reader (`translator/pdf-reader/`)
- Chrome restricts extension content scripts from executing inside its internal PDF viewer.
- Su_AdBlock solves this by providing a dedicated, extension-owned local PDF viewer powered by Mozilla PDF.js v3.11.174.
- Features:
  - Local file drag-and-drop or file picker.
  - Full text layer rendering allowing standard mouse selection.
  - Integrated translation sidebar and floating popover.
  - Page navigation, zoom, and fit-to-width controls.
  - 100% private: PDF files never leave local browser memory.
