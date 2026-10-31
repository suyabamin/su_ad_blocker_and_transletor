/**
 * Su_AdBlock Dashboard - Google-Translate-Inspired Translation Workbench
 * Connects UI panels to the unified TranslationEngine.
 * Free Forever. Private by Design.
 */

window.initTranslationPage = function () {
  const sourceInput = document.getElementById('translator-source-input');
  const outputContainer = document.getElementById('translator-output-text');
  const executeBtn = document.getElementById('execute-translate-btn');
  const pasteBtn = document.getElementById('paste-source-btn');
  const clearBtn = document.getElementById('clear-source-btn');
  const copyBtn = document.getElementById('copy-result-btn');
  const selectAllBtn = document.getElementById('select-output-btn');
  const retryBtn = document.getElementById('retry-translate-btn');
  const charCount = document.getElementById('source-char-count');
  const engineTag = document.getElementById('output-engine-tag');

  const modelStatusDot = document.getElementById('model-status-dot');
  const modelStatusBadgeText = document.getElementById('model-status-badge-text');
  const modelStatusText = document.getElementById('model-status-text');
  const downloadModelBtn = document.getElementById('download-model-btn');
  const progressBar = document.getElementById('model-progress-bar');
  const progressFill = document.getElementById('model-progress-fill');
  const progressMeta = document.getElementById('model-progress-meta');
  const fileInfo = document.getElementById('model-file-info');
  const bytesInfo = document.getElementById('model-bytes-info');

  let engine = null;
  if (typeof TranslationEngine !== 'undefined') {
    engine = new TranslationEngine();
  }

  let activeTranslation = '';

  // Update char counter
  function updateCharCount() {
    if (sourceInput && charCount) {
      const len = sourceInput.value.length;
      charCount.textContent = `${len.toLocaleString()} / 5,000`;
      if (len > 5000) {
        charCount.style.color = '#d93025';
      } else {
        charCount.style.color = '#70757a';
      }
    }
  }

  if (sourceInput) {
    sourceInput.addEventListener('input', updateCharCount);

    // Ctrl + Enter shortcut
    sourceInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        executeTranslation();
      }
    });
  }

  // Paste from clipboard
  if (pasteBtn && sourceInput) {
    pasteBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          sourceInput.value = text;
          updateCharCount();
          executeTranslation();
        }
      } catch (err) {
        console.warn('Clipboard read notice:', err);
      }
    });
  }

  // Clear text
  if (clearBtn && sourceInput) {
    clearBtn.addEventListener('click', () => {
      sourceInput.value = '';
      updateCharCount();
      activeTranslation = '';
      if (outputContainer) {
        outputContainer.innerHTML = '<span class="gt-placeholder">অনুবাদ এখানে প্রদর্শিত হবে (Translation will appear here)...</span>';
      }
    });
  }

  // Select all output text
  if (selectAllBtn && outputContainer) {
    selectAllBtn.addEventListener('click', () => {
      const text = outputContainer.textContent;
      if (!text || text.includes('প্রদর্শিত হবে')) return;
      const range = document.createRange();
      range.selectNodeContents(outputContainer);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });
  }

  // Copy result
  if (copyBtn && outputContainer) {
    copyBtn.addEventListener('click', () => {
      if (!activeTranslation) return;
      navigator.clipboard.writeText(activeTranslation).then(() => {
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Copied!</span>
        `;
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span>Copy</span>
          `;
        }, 1500);
      });
    });
  }

  // Retry
  if (retryBtn) {
    retryBtn.addEventListener('click', () => executeTranslation());
  }

  // Status Listener
  if (engine) {
    engine.onStatusChange((st) => {
      if (!modelStatusText) return;

      if (st.status === 'NOT_DOWNLOADED') {
        if (modelStatusDot) modelStatusDot.className = 'gt-status-dot';
        if (modelStatusBadgeText) modelStatusBadgeText.textContent = 'Structured NMT Active (Offline)';
        modelStatusText.textContent = 'Status: Structured NMT Engine is active and working offline. ' +
          'The optional neural model download requires internet (first time only) and may not complete ' +
          'in all Chrome versions due to WebAssembly threading restrictions.';
        if (progressBar) progressBar.style.display = 'none';
        if (progressMeta) progressMeta.style.display = 'none';
        if (downloadModelBtn) {
          downloadModelBtn.disabled = false;
          downloadModelBtn.textContent = 'Download Neural Model (Optional)';
        }
      } else if (st.status === 'DOWNLOADING') {
        if (modelStatusDot) modelStatusDot.className = 'gt-status-dot downloading';
        if (modelStatusBadgeText) modelStatusBadgeText.textContent = `Downloading (${st.progress}%)`;
        modelStatusText.textContent = `Downloading ONNX model weights to browser cache...`;
        if (progressBar) progressBar.style.display = 'block';
        if (progressFill) progressFill.style.width = `${st.progress}%`;
        if (progressMeta) progressMeta.style.display = 'flex';
        if (fileInfo) fileInfo.textContent = st.currentFile || 'Downloading model assets...';
        if (bytesInfo && st.bytesTotal) {
          const loadedMb = (st.bytesLoaded / 1024 / 1024).toFixed(1);
          const totalMb = (st.bytesTotal / 1024 / 1024).toFixed(1);
          bytesInfo.textContent = `${loadedMb} MB / ${totalMb} MB (${st.progress}%)`;
        }
        if (downloadModelBtn) {
          downloadModelBtn.disabled = true;
          downloadModelBtn.textContent = 'Downloading...';
        }
      } else if (st.status === 'LOADING_MODEL') {
        if (modelStatusDot) modelStatusDot.className = 'gt-status-dot downloading';
        if (modelStatusBadgeText) modelStatusBadgeText.textContent = 'Initializing ONNX Runtime...';
        modelStatusText.textContent = 'Compiling WebAssembly / WebGPU execution pipeline...';
        if (progressBar) progressBar.style.display = 'block';
        if (progressFill) progressFill.style.width = '100%';
      } else if (st.status === 'MODEL_READY') {
        if (modelStatusDot) modelStatusDot.className = 'gt-status-dot active';
        if (modelStatusBadgeText) modelStatusBadgeText.textContent = `Neural Model Ready (${st.device.toUpperCase()})`;
        modelStatusText.textContent = `Status: Neural model cached & verified. Device: ${st.device.toUpperCase()}. 100% offline neural translation active.`;
        if (progressBar) progressBar.style.display = 'none';
        if (progressMeta) progressMeta.style.display = 'none';
        if (downloadModelBtn) {
          downloadModelBtn.disabled = true;
          downloadModelBtn.textContent = 'Model Cached & Ready';
          downloadModelBtn.classList.add('ready');
        }
      } else if (st.status === 'DOWNLOAD_FAILED' || st.status === 'MODEL_LOADING_FAILED') {
        if (modelStatusDot) modelStatusDot.className = 'gt-status-dot error';
        if (modelStatusBadgeText) modelStatusBadgeText.textContent = 'Neural Model Unavailable';
        // Sanitize: truncate any unexpectedly long error message (raw code guard)
        let safeMsg = st.errorMessage || 'Download unavailable.';
        if (safeMsg.length > 400 || safeMsg.includes('__webpack') || safeMsg.includes('var ') || safeMsg.includes('function(')) {
          safeMsg = 'ONNX runtime initialization failed (Chrome MV3 WASM restriction). Structured NMT Engine is active.';
        }
        modelStatusText.textContent = `Notice: ${safeMsg} Structured NMT Engine is fully active.`;
        if (progressBar) progressBar.style.display = 'none';
        if (progressMeta) progressMeta.style.display = 'none';
        if (downloadModelBtn) {
          downloadModelBtn.disabled = false;
          downloadModelBtn.textContent = 'Retry Download';
        }
      }
    });
  }

  // Listen for broadcast model progress messages from background / offscreen worker
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg && msg.action === 'MODEL_PROGRESS') {
        if (msg.status === 'DOWNLOADING') {
          if (modelStatusDot) modelStatusDot.className = 'gt-status-dot downloading';
          if (modelStatusBadgeText) modelStatusBadgeText.textContent = `Downloading (${msg.progress}%)`;
          if (modelStatusText) modelStatusText.textContent = `Downloading neural model weights to browser cache...`;
          if (progressBar) progressBar.style.display = 'block';
          if (progressFill) progressFill.style.width = `${msg.progress}%`;
          if (progressMeta) progressMeta.style.display = 'flex';
          if (fileInfo) fileInfo.textContent = msg.currentFile || 'Downloading model assets...';
          if (bytesInfo && msg.bytesTotal) {
            const loadedMb = (msg.bytesLoaded / 1024 / 1024).toFixed(1);
            const totalMb = (msg.bytesTotal / 1024 / 1024).toFixed(1);
            bytesInfo.textContent = `${loadedMb} MB / ${totalMb} MB (${msg.progress}%)`;
          }
          if (downloadModelBtn) {
            downloadModelBtn.disabled = true;
            downloadModelBtn.textContent = 'Downloading...';
          }
        } else if (msg.status === 'MODEL_READY') {
          if (modelStatusDot) modelStatusDot.className = 'gt-status-dot active';
          if (modelStatusBadgeText) modelStatusBadgeText.textContent = `Neural Model Ready (${(msg.device || 'WASM').toUpperCase()})`;
          if (modelStatusText) modelStatusText.textContent = `Status: Neural model cached & verified. Device: ${(msg.device || 'WASM').toUpperCase()}. 100% offline neural translation active.`;
          if (progressBar) progressBar.style.display = 'none';
          if (progressMeta) progressMeta.style.display = 'none';
          if (downloadModelBtn) {
            downloadModelBtn.disabled = true;
            downloadModelBtn.textContent = 'Model Cached & Ready';
            downloadModelBtn.classList.add('ready');
          }
        }
      }
    });
  }

  // Download Neural Model Button Handler
  if (downloadModelBtn) {
    downloadModelBtn.addEventListener('click', async () => {
      downloadModelBtn.disabled = true;
      downloadModelBtn.textContent = 'Initiating download...';
      if (progressBar) progressBar.style.display = 'block';
      if (progressFill) progressFill.style.width = '5%';

      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'LOAD_NEURAL_MODEL' }, (resp) => {
          if (chrome.runtime.lastError || (resp && !resp.success)) {
            const err = resp?.error || chrome.runtime.lastError?.message;
            console.warn('[translation.js] Offscreen model load notice:', err);
            if (engine) {
              engine.loadNeuralModel({ preferredDevice: 'auto' }).catch(() => {});
            }
          }
        });
      } else if (engine) {
        try {
          await engine.loadNeuralModel({ preferredDevice: 'auto' });
        } catch (err) {
          const safeMsg = (err && err.message && err.message.length < 300)
            ? err.message
            : 'Neural model initialization failed. Structured NMT Engine remains active.';
          console.warn('[translation.js] Neural model note:', safeMsg);
        }
      }
    });
  }

  // Execute Translation Function
  async function executeTranslation() {
    const text = sourceInput ? sourceInput.value.trim() : '';
    if (!text) return;

    if (outputContainer) {
      outputContainer.innerHTML = `
        <div class="gt-loading-state">
          <div class="gt-spinner"></div>
          <span>Translating with high-accuracy online engine...</span>
        </div>
      `;
    }

    try {
      let res = null;
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        res = await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            action: 'TRANSLATE_TEXT',
            payload: { text }
          }, (reply) => resolve(reply));
        });
      } else if (typeof OnlineTranslationService !== 'undefined') {
        res = await OnlineTranslationService.translate(text);
      } else if (engine) {
        res = await engine.translate(text);
      }

      if (res && res.success !== false && res.translation) {
        activeTranslation = res.translation;
        if (outputContainer) outputContainer.textContent = activeTranslation;
        if (engineTag && res.engine) {
          engineTag.textContent = `Engine: ${res.engine}`;
        }
      } else {
        throw new Error((res && res.error) || 'Translation engine returned empty response.');
      }
    } catch (err) {
      if (outputContainer) {
        outputContainer.innerHTML = `<span style="color:#d93025; font-weight:500;">Translation error: ${err.message}</span>`;
      }
    }
  }

  if (executeBtn) {
    executeBtn.addEventListener('click', executeTranslation);
  }

  // Check URL query parameters for passed text (from context menu or other pages)
  function checkUrlPrefill() {
    try {
      const hash = window.location.hash || '';
      let textToFill = null;

      const qIndex = hash.indexOf('?');
      if (qIndex !== -1) {
        const queryStr = hash.substring(qIndex + 1);
        const params = new URLSearchParams(queryStr);
        if (params.has('text')) {
          textToFill = params.get('text');
        }
      }

      if (!textToFill && hash.includes('?text=')) {
        const raw = hash.split('?text=')[1];
        if (raw) {
          try {
            textToFill = decodeURIComponent(raw.replace(/\+/g, ' '));
          } catch {
            textToFill = raw;
          }
        }
      }

      if (textToFill && sourceInput) {
        sourceInput.value = textToFill;
        updateCharCount();
        setTimeout(executeTranslation, 150);
      }
    } catch (e) {
      console.warn('URL prefill error in translation page:', e);
    }
  }

  checkUrlPrefill();
  window.addEventListener('hashchange', checkUrlPrefill);
};
