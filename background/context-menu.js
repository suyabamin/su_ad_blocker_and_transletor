/**
 * Su_AdBlock - Context Menu Handler
 * Sets up the right-click context menu for selection translation.
 * Free Forever. Private by Design.
 */

const CONTEXT_MENU_ID = 'su_adblock_translate_selection';

class ContextMenuHandler {
  /**
   * Initializes the context menu.
   */
  static init() {
    if (typeof chrome === 'undefined' || !chrome.contextMenus) return;

    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: CONTEXT_MENU_ID,
        title: 'Translate selection to বাংলা',
        contexts: ['selection']
      }, () => {
        if (chrome.runtime.lastError) {
          console.warn('ContextMenu creation notice:', chrome.runtime.lastError.message);
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
    if (info.menuItemId !== CONTEXT_MENU_ID) return;
    const selectedText = (info.selectionText || '').trim();
    if (!selectedText) return;

    if (!tab || !tab.id || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
      // Cannot inject content script into restricted chrome pages: open dashboard translator with text
      const dashUrl = chrome.runtime.getURL(`dashboard/dashboard.html#translation?text=${encodeURIComponent(selectedText)}`);
      chrome.tabs.create({ url: dashUrl });
      return;
    }

    try {
      // Send message to content script on active tab to show translation popover
      chrome.tabs.sendMessage(tab.id, {
        action: 'SHOW_SELECTION_TRANSLATION',
        payload: { text: selectedText }
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
  module.exports = { ContextMenuHandler, CONTEXT_MENU_ID };
}
if (typeof globalThis !== 'undefined') {
  globalThis.ContextMenuHandler = ContextMenuHandler;
}
