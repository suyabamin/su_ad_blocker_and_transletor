/**
 * Su_AdBlock - Context Menu Handler
 * Sets up the right-click context menu for selection translation.
 * Free Forever. Private by Design.
 */

const CONTEXT_MENU_ID = 'su_adblock_translate_selection';
const CONTEXT_MENU_PDF_ID = 'su_adblock_open_pdf_reader';

class ContextMenuHandler {
  /**
   * Initializes the context menus.
   */
  static init() {
    if (typeof chrome === 'undefined' || !chrome.contextMenus) return;

    chrome.contextMenus.removeAll(() => {
      // 1. Selection translation menu (works across websites and Chrome PDF viewer selection)
      chrome.contextMenus.create({
        id: CONTEXT_MENU_ID,
        title: 'Translate selection to বাংলা',
        contexts: ['selection']
      }, () => {
        if (chrome.runtime.lastError) {
          console.warn('ContextMenu creation notice:', chrome.runtime.lastError.message);
        }
      });

      // 2. Open in Su_AdBlock PDF Reader (for PDF links and pages)
      chrome.contextMenus.create({
        id: CONTEXT_MENU_PDF_ID,
        title: 'Open in Su_AdBlock PDF Reader',
        contexts: ['link', 'page'],
        targetUrlPatterns: ['*://*/*.pdf*', 'file://*/*.pdf*']
      }, () => {
        if (chrome.runtime.lastError) {
          // May warn if file:// URLs are not permissioned, which is safe to ignore
        }
      });
    });

    chrome.contextMenus.onClicked.addListener(ContextMenuHandler.handleMenuClick);
  }

  /**
   * Handles context menu click event.
   * @param {chrome.contextMenus.OnClickData} info 
   * @param {chrome.tabs.Tab} tab 
   */
  static async handleMenuClick(info, tab) {
    // A. Open in PDF Reader action
    if (info.menuItemId === CONTEXT_MENU_PDF_ID) {
      const pdfTargetUrl = info.linkUrl || (tab && tab.url) || '';
      const readerUrl = chrome.runtime.getURL('translator/pdf-reader/reader.html' + (pdfTargetUrl ? `?file=${encodeURIComponent(pdfTargetUrl)}` : ''));
      chrome.tabs.create({ url: readerUrl });
      return;
    }

    // B. Translate Selection action
    if (info.menuItemId !== CONTEXT_MENU_ID) return;
    const selectedText = (info.selectionText || '').trim();
    if (!selectedText) return;

    const isRestrictedUrl = !tab || !tab.id || !tab.url ||
      tab.url.startsWith('chrome://') ||
      tab.url.startsWith('edge://') ||
      tab.url.startsWith('chrome-extension://');

    // Chrome built-in PDF viewer: Chrome renders native PDFium out-of-process where HTML floating popups cannot overlay
    const isBuiltInPdfTab = tab && tab.url && (
      /\.pdf($|\?)/i.test(tab.url) ||
      (tab.url.startsWith('file://') && tab.url.toLowerCase().endsWith('.pdf'))
    );

    if (isRestrictedUrl || isBuiltInPdfTab) {
      // In Chrome built-in PDF or restricted pages, open translation directly in dashboard workbench
      const dashUrl = chrome.runtime.getURL(`dashboard/dashboard.html#translation?text=${encodeURIComponent(selectedText)}`);
      chrome.tabs.create({ url: dashUrl });
      return;
    }

    try {
      // Send message to content script on active tab to show floating translation card
      chrome.tabs.sendMessage(tab.id, {
        action: 'SHOW_SELECTION_TRANSLATION',
        payload: { text: selectedText, requestId: 'ctx_' + Date.now() }
      }, (response) => {
        if (chrome.runtime.lastError) {
          // If content script was not ready or restricted, open in dashboard
          const dashUrl = chrome.runtime.getURL(`dashboard/dashboard.html#translation?text=${encodeURIComponent(selectedText)}`);
          chrome.tabs.create({ url: dashUrl });
        }
      });
    } catch {
      const dashUrl = chrome.runtime.getURL(`dashboard/dashboard.html#translation?text=${encodeURIComponent(selectedText)}`);
      chrome.tabs.create({ url: dashUrl });
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ContextMenuHandler, CONTEXT_MENU_ID, CONTEXT_MENU_PDF_ID };
}
if (typeof globalThis !== 'undefined') {
  globalThis.ContextMenuHandler = ContextMenuHandler;
}
