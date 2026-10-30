/**
 * Su_AdBlock Dashboard - Translation Page Controller
 * Handles local model lifecycle, download progress, and translation workbench.
 * Free Forever. Private by Design.
 */

window.initTranslationPage = function () {
  const sourceInput = document.getElementById('translator-source-input');
  const outputText = document.getElementById('translator-output-text');
  const executeBtn = document.getElementById('execute-translate-btn');
  const copyBtn = document.getElementById('copy-result-btn');
  const clearBtn = document.getElementById('clear-source-btn');
  const charCount = document.getElementById('source-char-count');
  const engineTag = document.getElementById('output-engine-tag');

  const modelStatusText = document.getElementById('model-status-text');
  const downloadModelBtn = document.getElementById('download-model-btn');
  const progressBar = document.getElementById('model-progress-bar');
  const progressFill = document.getElementById('model-progress-fill');

  let modelLoader = null;
  if (typeof ModelLoader !== 'undefined') {
    modelLoader = new ModelLoader();
  }

  // Update char count
  if (sourceInput && charCount) {
    sourceInput.addEventListener('input', () => {
      charCount.textContent = `${sourceInput.value.length} characters`;
    });
  }

  // Check URL query for passed text
  const hash = window.location.hash;
  if (hash.includes('?text=')) {
    const rawParam = hash.split('?text=')[1];
    if (rawParam && sourceInput) {
      sourceInput.value = decodeURIComponent(rawParam);
      charCount.textContent = `${sourceInput.value.length} characters`;
      setTimeout(() => executeTranslation(), 200);
    }
  }

  // Download Neural Model
  if (downloadModelBtn && modelLoader) {
    downloadModelBtn.addEventListener('click', async () => {
      downloadModelBtn.disabled = true;
      downloadModelBtn.textContent = 'Downloading...';
      if (progressBar) progressBar.style.display = 'block';

      modelLoader.onStatusChange((st) => {
        if (st.status === 'loading') {
          if (progressFill) progressFill.style.width = `${st.progress}%`;
          if (modelStatusText) {
            modelStatusText.textContent = `Downloading ${st.currentFile || 'model files'}: ${st.progress}%`;
          }
        } else if (st.status === 'ready') {
          if (progressFill) progressFill.style.width = '100%';
          if (modelStatusText) {
            modelStatusText.textContent = `Neural Model Ready! Device: ${st.device.toUpperCase()}. Offline translation active.`;
          }
          downloadModelBtn.textContent = 'Model Cached & Ready';
          downloadModelBtn.classList.remove('btn-primary');
          downloadModelBtn.classList.add('btn-secondary');
        } else if (st.status === 'error') {
          if (modelStatusText) {
            modelStatusText.textContent = `Download notice: ${st.errorMessage}. Using offline lexicon.`;
          }
          downloadModelBtn.disabled = false;
          downloadModelBtn.textContent = 'Retry Download';
        }
      });

      try {
        await modelLoader.loadModel({ preferredDevice: 'auto' });
      } catch (err) {
        console.warn('Model download notice:', err.message);
      }
    });
  }

  // Execute Translation
  async function executeTranslation() {
    const text = sourceInput ? sourceInput.value.trim() : '';
    if (!text) return;

    if (outputText) {
      outputText.innerHTML = '<span class="output-placeholder">Translating locally...</span>';
    }

    // 1. Try local neural model if loaded
    if (modelLoader && modelLoader.status === 'ready') {
      try {
        const translated = await modelLoader.translate(text);
        if (outputText) outputText.textContent = translated;
        if (engineTag) {
          engineTag.textContent = 'Engine: Neural ONNX';
          engineTag.style.background = '#dbeafe';
          engineTag.style.color = '#1d4ed8';
        }
        return;
      } catch (e) {
        console.warn('Neural translation error, falling back:', e);
      }
    }

    // 2. Fallback to background translation manager / lexicon
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        action: 'TRANSLATE_TEXT',
        payload: { text }
      }, (res) => {
        if (res && res.success) {
          if (outputText) outputText.textContent = res.translation;
          if (engineTag) {
            engineTag.textContent = `Engine: ${res.engine === 'neural' ? 'Neural' : 'Offline Lexicon'}`;
          }
        } else {
          fallbackLexicon(text);
        }
      });
    } else {
      fallbackLexicon(text);
    }
  }

  function fallbackLexicon(text) {
    if (typeof LexiconTranslator !== 'undefined') {
      const res = LexiconTranslator.translate(text);
      if (outputText) outputText.textContent = res;
      if (engineTag) engineTag.textContent = 'Engine: Offline Lexicon';
    } else if (outputText) {
      outputText.textContent = text;
    }
  }

  if (executeBtn) executeBtn.addEventListener('click', executeTranslation);

  // Copy result
  if (copyBtn && outputText) {
    copyBtn.addEventListener('click', () => {
      const text = outputText.textContent;
      if (!text || text.includes('appear here')) return;
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
      });
    });
  }

  // Clear source
  if (clearBtn && sourceInput) {
    clearBtn.addEventListener('click', () => {
      sourceInput.value = '';
      if (charCount) charCount.textContent = '0 characters';
      if (outputText) outputText.innerHTML = '<span class="output-placeholder">Bangla translation will appear here...</span>';
    });
  }
};
