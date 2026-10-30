/**
 * Su_AdBlock - Keyboard Commands Handler
 * Handles global keyboard shortcuts registered in manifest.json.
 * Free Forever. Private by Design.
 */

class CommandsHandler {
  /**
   * Initializes command listeners.
   * @param {Object} services
   */
  static init(services) {
    if (typeof chrome === 'undefined' || !chrome.commands) return;

    chrome.commands.onCommand.addListener(async (command) => {
      switch (command) {
        case 'translate_selection': {
          chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const activeTab = tabs && tabs[0];
            if (!activeTab || !activeTab.id) return;

            // Trigger selection translation on active tab
            chrome.tabs.sendMessage(activeTab.id, { action: 'TRIGGER_SELECTION_TRANSLATE' }, () => {
              if (chrome.runtime.lastError) {
                // If tab cannot execute content scripts, open dashboard translator
                const dashUrl = chrome.runtime.getURL('dashboard/dashboard.html#translation');
                chrome.tabs.create({ url: dashUrl });
              }
            });
          });
          break;
        }

        case 'toggle_protection': {
          const current = await services.settingsStore.get('protectionEnabled', true);
          const next = !current;
          await services.settingsStore.update({ protectionEnabled: next });
          await services.dnrManager.syncRules();
          break;
        }
      }
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CommandsHandler };
}
if (typeof globalThis !== 'undefined') {
  globalThis.CommandsHandler = CommandsHandler;
}
