/**
 * Su_AdBlock - PDF Reader & Selection Translator
 * Renders local PDFs completely offline using Mozilla PDF.js.
 * Free Forever. Private by Design.
 */

(function () {
  'use strict';

  // Set local worker path
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';
  }

  let pdfDoc = null;
  let pageNum = 1;
  let pageRendering = false;
  let pageNumPending = null;
  let scale = 1.25;

  const canvas = document.getElementById('pdf-canvas');
  const ctx = canvas.getContext('2d');
  const textLayerDiv = document.getElementById('text-layer');
  const pageContainer = document.getElementById('pdf-page-container');
  const dropzone = document.getElementById('dropzone');

  const fileInput = document.getElementById('pdf-file-input');
  const prevBtn = document.getElementById('prev-page-btn');
  const nextBtn = document.getElementById('next-page-btn');
  const pageNumInput = document.getElementById('page-num-input');
  const pageCountSpan = document.getElementById('page-count');
  const zoomInBtn = document.getElementById('zoom-in-btn');
  const zoomOutBtn = document.getElementById('zoom-out-btn');
  const fitWidthBtn = document.getElementById('fit-width-btn');
  const zoomLabel = document.getElementById('zoom-label');
  const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
  const sidebar = document.getElementById('translation-sidebar');

  const sidebarSourceText = document.getElementById('sidebar-source-text');
  const sidebarResultText = document.getElementById('sidebar-result-text');
  const sidebarTranslateBtn = document.getElementById('sidebar-translate-btn');
  const sidebarCopyBtn = document.getElementById('sidebar-copy-btn');
  const sidebarClearBtn = document.getElementById('sidebar-clear-btn');

  /**
   * Renders a specific PDF page onto canvas with text layer.
   */
  async function renderPage(num) {
    if (!pdfDoc) return;
    pageRendering = true;

    try {
      const page = await pdfDoc.getPage(num);
      const viewport = page.getViewport({ scale });

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      pageContainer.style.width = `${viewport.width}px`;
      pageContainer.style.height = `${viewport.height}px`;

      // Render canvas
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      await page.render(renderContext).promise;

      // Render Text Layer
      textLayerDiv.innerHTML = '';
      textLayerDiv.style.width = `${viewport.width}px`;
      textLayerDiv.style.height = `${viewport.height}px`;

      const textContent = await page.getTextContent();
      if (pdfjsLib.renderTextLayer) {
        await pdfjsLib.renderTextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport: viewport,
          textDivs: []
        }).promise;
      }

      pageRendering = false;
      if (pageNumPending !== null) {
        renderPage(pageNumPending);
        pageNumPending = null;
      }

      pageNumInput.value = num;
      prevBtn.disabled = num <= 1;
      nextBtn.disabled = num >= pdfDoc.numPages;
    } catch (err) {
      console.error('Error rendering PDF page:', err);
      pageRendering = false;
    }
  }

  function queueRenderPage(num) {
    if (pageRendering) {
      pageNumPending = num;
    } else {
      renderPage(num);
    }
  }

  function onPrevPage() {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
  }

  function onNextPage() {
    if (!pdfDoc || pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
  }

  function setZoom(newScale) {
    scale = Math.min(Math.max(newScale, 0.5), 3.0);
    zoomLabel.textContent = `${Math.round(scale * 100)}%`;
    queueRenderPage(pageNum);
  }

  /**
   * Loads a PDF file from an ArrayBuffer.
   */
  async function loadPDFDocument(arrayBuffer) {
    try {
      pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      pageCountSpan.textContent = pdfDoc.numPages;
      pageNumInput.disabled = false;
      pageNumInput.max = pdfDoc.numPages;
      pageNum = 1;

      dropzone.style.display = 'none';
      pageContainer.style.display = 'block';

      renderPage(pageNum);
    } catch (err) {
      alert(`Could not open PDF file: ${err.message}`);
    }
  }

  function handleFileSelect(file) {
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      loadPDFDocument(e.target.result);
    };
    reader.readAsArrayBuffer(file);
  }

  // Drag and drop handlers
  const dropzoneCard = document.getElementById('dropzone');
  const dropzoneSelectBtn = document.getElementById('dropzone-select-btn');

  if (dropzoneSelectBtn) {
    dropzoneSelectBtn.addEventListener('click', () => fileInput.click());
  }

  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  });

  prevBtn.addEventListener('click', onPrevPage);
  nextBtn.addEventListener('click', onNextPage);

  pageNumInput.addEventListener('change', () => {
    const val = parseInt(pageNumInput.value, 10);
    if (pdfDoc && val >= 1 && val <= pdfDoc.numPages) {
      pageNum = val;
      queueRenderPage(pageNum);
    }
  });

  zoomInBtn.addEventListener('click', () => setZoom(scale + 0.25));
  zoomOutBtn.addEventListener('click', () => setZoom(scale - 0.25));

  fitWidthBtn.addEventListener('click', () => {
    const viewportWidth = document.getElementById('viewer-container').clientWidth - 64;
    if (canvas.width > 0) {
      const naturalWidth = canvas.width / scale;
      setZoom(viewportWidth / naturalWidth);
    }
  });

  toggleSidebarBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  // Text selection in PDF text layer
  document.addEventListener('mouseup', () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    if (text && /[a-zA-Z]/.test(text)) {
      sidebarSourceText.value = text;
      // Auto-open sidebar if closed
      sidebar.classList.remove('collapsed');
      // Automatically trigger translation for seamless reading experience
      executeSidebarTranslation(text);
    }
  });

  /**
   * Executes translation via extension message or fallback lexicon.
   */
  function executeSidebarTranslation(text) {
    if (!text || !text.trim()) return;

    sidebarResultText.innerHTML = '<span class="placeholder-text">Translating locally...</span>';

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        action: 'TRANSLATE_TEXT',
        payload: { text }
      }, (res) => {
        if (chrome.runtime.lastError || !res || !res.success) {
          // Fallback to local bundled lexicon
          if (typeof LexiconTranslator !== 'undefined') {
            const fallback = LexiconTranslator.translate(text);
            sidebarResultText.textContent = fallback;
          } else {
            sidebarResultText.textContent = 'Translation failed offline.';
          }
          return;
        }
        sidebarResultText.textContent = res.translation;
      });
    } else if (typeof LexiconTranslator !== 'undefined') {
      const fallback = LexiconTranslator.translate(text);
      sidebarResultText.textContent = fallback;
    }
  }

  sidebarTranslateBtn.addEventListener('click', () => {
    executeSidebarTranslation(sidebarSourceText.value);
  });

  sidebarCopyBtn.addEventListener('click', () => {
    const text = sidebarResultText.textContent;
    if (!text || text === 'Translation will appear here') return;
    navigator.clipboard.writeText(text).then(() => {
      sidebarCopyBtn.textContent = 'Copied!';
      setTimeout(() => { sidebarCopyBtn.textContent = 'Copy Bangla'; }, 1500);
    });
  });

  sidebarClearBtn.addEventListener('click', () => {
    sidebarSourceText.value = '';
    sidebarResultText.innerHTML = '<span class="placeholder-text">Translation will appear here</span>';
  });
})();
