/**
 * Su_AdBlock - Offscreen Translation Worker
 * Runs Transformers.js neural inference in Chrome's offscreen document context.
 * This document CAN use dynamic import() and WebAssembly, unlike the service worker.
 * Free Forever. Private by Design.
 */

// Model state
let modelState = 'NOT_LOADED'; // NOT_LOADED | LOADING | READY | ERROR
let translationPipeline = null;
let modelError = null;
let modelDevice = 'wasm';

const MODEL_ID = 'Xenova/nllb-200-distilled-600M';
const SRC_LANG = 'eng_Latn';
const TGT_LANG = 'ben_Beng';

/**
 * Validates that a translation result is real Bengali output.
 * Returns false if it looks like an English echo.
 */
function validateBengaliOutput(original, translated) {
  if (!translated || typeof translated !== 'string') return false;
  const t = translated.trim();
  if (!t) return false;
  // Reject if identical to input
  if (t === original.trim()) return false;
  // Count Bengali Unicode characters (U+0980-U+09FF)
  const bengaliChars = (t.match(/[\u0980-\u09FF]/g) || []).length;
  const totalNonSpaceChars = t.replace(/\s/g, '').length;
  if (totalNonSpaceChars === 0) return false;
  const ratio = bengaliChars / totalNonSpaceChars;
  // Require at least 15% Bengali characters (technical terms may remain in English)
  return ratio >= 0.15;
}

/**
 * Loads the Transformers.js neural translation model.
 */
async function loadModel() {
  if (modelState === 'READY' && translationPipeline) return true;
  if (modelState === 'LOADING') {
    // Wait for current load
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (modelState === 'READY') { clearInterval(check); resolve(true); }
        else if (modelState === 'ERROR') { clearInterval(check); resolve(false); }
      }, 500);
    });
  }

  modelState = 'LOADING';
  modelError = null;

  try {
    // Dynamic import works in offscreen documents (unlike service workers)
    const modUrl = chrome.runtime.getURL('translator/lib/transformers.min.js');
    const transformers = await import(modUrl);
    const { pipeline, env } = transformers;

    // Configure for Chrome extension environment
    env.allowRemoteModels = true;
    env.allowLocalModels = false;
    env.useBrowserCache = (typeof caches !== 'undefined');

    // Configure ONNX for single-threaded (no SharedArrayBuffer required)
    try {
      if (env.backends && env.backends.onnx && env.backends.onnx.wasm) {
        env.backends.onnx.wasm.numThreads = 1;
        env.backends.onnx.wasm.proxy = false;
      }
    } catch (_) { /* non-fatal */ }

    // Check for WebGPU
    let device = 'wasm';
    try {
      if (navigator.gpu) {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter) device = 'webgpu';
      }
    } catch (_) { /* non-fatal */ }
    modelDevice = device;

    // Progress callback
    const progressCallback = (info) => {
      if (!info) return;
      try {
        if (info.status === 'progress' && info.total) {
          chrome.runtime.sendMessage({
            action: 'MODEL_PROGRESS',
            status: 'DOWNLOADING',
            progress: Math.min(99, Math.round((info.loaded / info.total) * 100)),
            currentFile: info.file || '',
            bytesLoaded: info.loaded || 0,
            bytesTotal: info.total || 0
          }).catch(() => {});
        } else if (info.status === 'initiate') {
          chrome.runtime.sendMessage({
            action: 'MODEL_PROGRESS',
            status: 'DOWNLOADING',
            progress: 0,
            currentFile: `Fetching ${info.file || 'model weights'}…`,
            bytesLoaded: 0,
            bytesTotal: 0
          }).catch(() => {});
        } else if (info.status === 'done') {
          chrome.runtime.sendMessage({
            action: 'MODEL_PROGRESS',
            status: 'DOWNLOADING',
            progress: 95,
            currentFile: `Downloaded ${info.file || 'asset'}`,
            bytesLoaded: 0,
            bytesTotal: 0
          }).catch(() => {});
        }
      } catch (_) {}
    };

    // Load the pipeline
    translationPipeline = await pipeline('translation', MODEL_ID, {
      progress_callback: progressCallback,
      device,
      quantized: true
    });

    // Warm-up inference to verify model works
    const testOutput = await translationPipeline('Hello', {
      src_lang: SRC_LANG,
      tgt_lang: TGT_LANG,
      max_new_tokens: 16
    });

    if (!testOutput || !Array.isArray(testOutput) || !testOutput[0] || !testOutput[0].translation_text) {
      throw new Error('Model warm-up inference returned no output.');
    }

    modelState = 'READY';

    // Notify service worker that model is ready
    chrome.runtime.sendMessage({
      action: 'MODEL_PROGRESS',
      status: 'MODEL_READY',
      progress: 100,
      device,
      currentFile: 'Model ready',
      bytesLoaded: 0,
      bytesTotal: 0
    }).catch(() => {});

    return true;
  } catch (err) {
    modelState = 'ERROR';
    const rawMsg = err && err.message ? String(err.message) : String(err);
    let friendlyMsg;
    if (rawMsg.includes('SharedArrayBuffer') || rawMsg.includes('cross-origin')) {
      friendlyMsg = 'WASM multi-threading blocked. Try reloading the extension.';
    } else if (rawMsg.includes('no available backend') || rawMsg.includes('wasm')) {
      friendlyMsg = 'ONNX WebAssembly backend failed. The extension is still active.';
    } else if (rawMsg.includes('fetch') || rawMsg.toLowerCase().includes('failed to fetch')) {
      friendlyMsg = 'Network error while downloading model. Check internet connection.';
    } else if (rawMsg.length > 300 || rawMsg.includes('__webpack')) {
      friendlyMsg = 'Neural model initialization failed (internal error).';
    } else {
      friendlyMsg = rawMsg.slice(0, 250);
    }
    modelError = friendlyMsg;
    console.warn('[Su_AdBlock Offscreen] Model load failed:', rawMsg.slice(0, 200));
    return false;
  }
}

/**
 * Performs neural translation of English text to Bengali.
 */
async function translateText(text) {
  if (!translationPipeline || modelState !== 'READY') {
    return {
      success: false,
      error: modelError || 'Neural model not loaded. Please download it in Dashboard > Translator.',
      needsDownload: true
    };
  }

  try {
    const output = await translationPipeline(text, {
      src_lang: SRC_LANG,
      tgt_lang: TGT_LANG,
      max_new_tokens: 512
    });

    if (!output || !Array.isArray(output) || !output[0] || !output[0].translation_text) {
      return { success: false, error: 'Model returned empty output.' };
    }

    const translated = output[0].translation_text.trim();

    // Validate Bengali output
    if (!validateBengaliOutput(text, translated)) {
      return {
        success: false,
        error: `Translation validation failed: model output does not appear to be Bengali. Got: "${translated.slice(0, 80)}..."`,
        rawOutput: translated
      };
    }

    return {
      success: true,
      translation: translated,
      engine: `Neural Model · NLLB-200 (${modelDevice.toUpperCase()})`,
      device: modelDevice
    };
  } catch (err) {
    const msg = err && err.message ? err.message.slice(0, 200) : 'Inference error';
    return { success: false, error: msg };
  }
}

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.action) return false;

  if (message.action === 'OFFSCREEN_TRANSLATE') {
    const text = message.text || (message.payload && message.payload.text) || '';
    if (!text) {
      sendResponse({ success: false, error: 'No text provided' });
      return false;
    }
    translateText(text).then(sendResponse).catch(err => {
      sendResponse({ success: false, error: err.message || 'Translation failed' });
    });
    return true; // async
  }

  if (message.action === 'OFFSCREEN_LOAD_MODEL') {
    loadModel().then(ok => {
      sendResponse({ success: ok, error: ok ? null : modelError });
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true; // async
  }

  if (message.action === 'OFFSCREEN_GET_STATUS') {
    sendResponse({
      success: true,
      state: modelState,
      device: modelDevice,
      error: modelError
    });
    return false;
  }

  return false;
});
