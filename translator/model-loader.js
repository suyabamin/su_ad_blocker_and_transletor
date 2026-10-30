/**
 * Su_AdBlock - Translation Model Loader
 * Manages the initialization and lifecycle of the local Xenova/opus-mt-en-bn ONNX model
 * using locally bundled Transformers.js.
 * Free Forever. Private by Design.
 */

const MODEL_ID = 'Xenova/opus-mt-en-bn';

class ModelLoader {
  constructor() {
    this.modelId = MODEL_ID;
    this.pipeline = null;
    this.status = 'unloaded'; // 'unloaded' | 'loading' | 'ready' | 'error'
    this.downloadProgress = 0;
    this.currentFile = '';
    this.device = 'wasm';
    this.errorMessage = null;
    this._listeners = new Set();
  }

  /**
   * Adds a status change listener.
   * @param {Function} callback 
   */
  onStatusChange(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  _notify() {
    const state = this.getState();
    for (const listener of this._listeners) {
      try {
        listener(state);
      } catch (e) {
        console.error('Error in status listener:', e);
      }
    }
  }

  /**
   * Returns current model loader state.
   */
  getState() {
    return {
      status: this.status,
      modelId: this.modelId,
      progress: this.downloadProgress,
      currentFile: this.currentFile,
      device: this.device,
      errorMessage: this.errorMessage
    };
  }

  /**
   * Checks if WebGPU is supported on the current device.
   * @returns {Promise<boolean>}
   */
  async checkWebGPUSupport() {
    if (typeof navigator !== 'undefined' && 'gpu' in navigator && navigator.gpu) {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        return Boolean(adapter);
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Initializes the pipeline using locally bundled Transformers.js.
   * @param {Object} options 
   * @param {'auto'|'wasm'|'webgpu'} [options.preferredDevice='auto']
   * @returns {Promise<Function>} Translation pipeline function
   */
  async loadModel(options = {}) {
    if (this.pipeline && this.status === 'ready') {
      return this.pipeline;
    }

    if (this.status === 'loading') {
      // Return a promise that waits until ready or error
      return new Promise((resolve, reject) => {
        const unsub = this.onStatusChange((st) => {
          if (st.status === 'ready') {
            unsub();
            resolve(this.pipeline);
          } else if (st.status === 'error') {
            unsub();
            reject(new Error(st.errorMessage));
          }
        });
      });
    }

    this.status = 'loading';
    this.downloadProgress = 0;
    this.errorMessage = null;
    this._notify();

    try {
      // Determine device
      const preferred = options.preferredDevice || 'auto';
      let selectedDevice = 'wasm';
      if (preferred === 'webgpu' || preferred === 'auto') {
        const hasWebGPU = await this.checkWebGPUSupport();
        if (hasWebGPU && preferred === 'webgpu') {
          selectedDevice = 'webgpu';
        }
      }
      this.device = selectedDevice;

      // Access global Transformers.js from bundled library
      const transformers = (typeof globalThis !== 'undefined' && globalThis.transformers)
        ? globalThis.transformers
        : (typeof window !== 'undefined' ? window.transformers : null);

      if (!transformers || !transformers.pipeline) {
        throw new Error('Local Transformers.js runtime is not loaded in this context');
      }

      // Configure transformers environment for browser extension
      transformers.env.allowRemoteModels = true;
      transformers.env.allowLocalModels = false;
      // Use standard Cache API for persistent offline model caching
      transformers.env.useBrowserCache = true;

      // Initialize pipeline with progress tracking
      const progressCallback = (info) => {
        if (!info) return;
        if (info.status === 'progress' && info.total) {
          this.downloadProgress = Math.round((info.loaded / info.total) * 100);
          this.currentFile = info.file || '';
        } else if (info.status === 'done') {
          this.downloadProgress = 100;
        }
        this._notify();
      };

      this.pipeline = await transformers.pipeline('translation', this.modelId, {
        progress_callback: progressCallback,
        device: this.device
      });

      this.status = 'ready';
      this.downloadProgress = 100;
      this._notify();
      return this.pipeline;
    } catch (err) {
      this.status = 'error';
      this.errorMessage = err.message || 'Failed to initialize local translation model';
      this._notify();
      throw err;
    }
  }

  /**
   * Translates a text string using the loaded model.
   * @param {string} text 
   * @returns {Promise<string>}
   */
  async translate(text) {
    if (!this.pipeline || this.status !== 'ready') {
      throw new Error('Model is not ready. Status: ' + this.status);
    }
    const output = await this.pipeline(text, {
      src_lang: 'en',
      tgt_lang: 'bn',
      max_new_tokens: 128
    });
    if (Array.isArray(output) && output.length > 0) {
      return output[0].translation_text;
    }
    return '';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ModelLoader, MODEL_ID };
}
if (typeof globalThis !== 'undefined') {
  globalThis.ModelLoader = ModelLoader;
  globalThis.MODEL_ID = MODEL_ID;
}
