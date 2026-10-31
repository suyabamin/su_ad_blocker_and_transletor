/**
 * Su_AdBlock - Background Service Worker
 * Chrome Manifest V3 entry point. Manages background lifecycles, DNR rules, alarms, and routing.
 * Free Forever. Private by Design.
 */

// Import Core and Background modules
try {

  importScripts(
    '../core/settings-store.js',
    '../core/filter-validator.js',
    '../core/whitelist-manager.js',
    '../core/custom-rules-manager.js',
    '../core/statistics-manager.js',
    '../core/dnr-manager.js',
    '../core/filter-update-manager.js',
    '../translator/text-chunker.js',
    '../translator/lexicon.js',
    '../core/online-translation-service.js',
    '../core/translation-engine.js',
    '../core/translation-manager.js',
    'message-router.js',
    'context-menu.js',
    'commands.js'
  );
} catch (e) {
  console.error('Failed to importScripts in service-worker:', e);
}

// Instantiate singletons
const settingsStore = new SettingsStore();
const whitelistManager = new WhitelistManager();
const customRulesManager = new CustomRulesManager();
const statisticsManager = new StatisticsManager();
const filterValidator = FilterValidator;

const dnrManager = new DNRManager({
  settingsStore,
  whitelistManager,
  customRulesManager,
  statisticsManager
});

const filterUpdateManager = new FilterUpdateManager({
  settingsStore,
  filterValidator,
  dnrManager
});

const translationManager = new TranslationManager({
  settingsStore
});

const messageRouter = new MessageRouter({
  settingsStore,
  whitelistManager,
  customRulesManager,
  statisticsManager,
  dnrManager,
  filterUpdateManager,
  translationManager
});

// ─── Offscreen Document Manager ─────────────────────────────────────────────

const OFFSCREEN_URL = chrome.runtime.getURL('background/offscreen.html');
let offscreenCreating = false;

async function ensureOffscreenDocument() {
  // Check if offscreen document already exists
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [OFFSCREEN_URL]
  }).catch(() => []);

  if (existingContexts && existingContexts.length > 0) {
    return true; // Already exists
  }

  if (offscreenCreating) {
    // Wait for creation to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    return true;
  }

  offscreenCreating = true;
  try {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_URL,
      reasons: ['WORKERS'],
      justification: 'Run Transformers.js neural translation (ONNX WASM requires offscreen context in MV3)'
    });
    offscreenCreating = false;
    return true;
  } catch (err) {
    offscreenCreating = false;
    console.error('Failed to create offscreen document:', err.message);
    return false;
  }
}

async function translateViaOffscreen(text) {
  const created = await ensureOffscreenDocument();
  if (!created) {
    return { success: false, error: 'Could not create translation worker.' };
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ success: false, error: 'Translation timed out (60s). Model may still be downloading.' });
    }, 60000);

    chrome.runtime.sendMessage({
      action: 'OFFSCREEN_TRANSLATE',
      text
    }, (response) => {
      clearTimeout(timeout);
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response || { success: false, error: 'No response from translation worker.' });
      }
    });
  });
}

// Listen for model download triggering from dashboard
async function triggerModelDownload() {
  await ensureOffscreenDocument();
  chrome.runtime.sendMessage({ action: 'OFFSCREEN_LOAD_MODEL' }).catch(() => {});
}

/**
 * Initializes state, storage, and rules.
 */
async function initializeExtension() {
  await settingsStore.getSettings();
  await whitelistManager.load();
  await customRulesManager.load();
  await statisticsManager.load();
  await translationManager.loadHistory();

  // Sync DeclarativeNetRequest rules
  await dnrManager.syncRules();

  // Initialize context menu & shortcuts
  ContextMenuHandler.init();
  CommandsHandler.init({ settingsStore, dnrManager });

  // Initialize filter update alarm
  await filterUpdateManager.initPeriodicAlarm();

  // Start matched rule stats listener
  dnrManager.initMatchedRuleListener();

  console.log('Su_AdBlock service worker initialized successfully.');
}

// Lifecycle listeners
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Su_AdBlock installed/updated:', details.reason);
  await initializeExtension();
});

chrome.runtime.onStartup.addListener(async () => {
  await initializeExtension();
});

// Alarm listener
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === FILTER_ALARM_NAME) {
    const isAutoUpdate = await settingsStore.get('autoUpdateFilters', true);
    if (isAutoUpdate) {
      await filterUpdateManager.checkForUpdates(false);
    }
  }
});

// Unified message router
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Forward model progress updates from offscreen to any interested parties (dashboard, popup)
  if (message && message.action === 'MODEL_PROGRESS') {
    // Re-broadcast to all extension pages
    chrome.runtime.sendMessage(message).catch(() => {});
    // Update persisted model state
    if (message.status) {
      chrome.storage.local.set({
        modelState: {
          status: message.status === 'MODEL_READY' ? 'MODEL_READY' : message.status,
          device: message.device || 'wasm',
          progress: message.progress || 0,
          currentFile: message.currentFile || '',
          bytesLoaded: message.bytesLoaded || 0,
          bytesTotal: message.bytesTotal || 0,
          lastUpdated: new Date().toISOString()
        }
      });
    }
    sendResponse({ success: true });
    return false;
  }

  // Special handling for TRANSLATE_TEXT / SU_TRANSLATE_TEXT — route via TranslationManager with Online Translation Service
  const action = message && (message.action || message.type);
  if (action === 'TRANSLATE_TEXT' || action === 'SU_TRANSLATE_TEXT') {
    const payload = (message && message.payload) || message || {};
    const text = (payload && payload.text) || (typeof payload === 'string' ? payload : '');
    const requestId = (message && message.requestId) || (payload && payload.requestId) || ('req_' + Date.now());

    if (!text || typeof text !== 'string' || !text.trim()) {
      sendResponse({ success: false, requestId, error: 'No text provided.' });
      return false;
    }

    messageRouter.handleMessage({ action: 'TRANSLATE_TEXT', requestId, payload: { ...payload, text } }, sender)
      .then((res) => {
        sendResponse({ ...res, requestId: (res && res.requestId) || requestId });
      })
      .catch((err) => {
        sendResponse({ success: false, requestId, error: err.message || 'Translation failed' });
      });

    return true; // Keep channel open for async response
  }

  // Special handling: LOAD_NEURAL_MODEL → trigger offscreen model download
  if (message && message.action === 'LOAD_NEURAL_MODEL') {
    ensureOffscreenDocument().then((created) => {
      if (!created) {
        sendResponse({ success: false, error: 'Could not create translation worker.' });
        return;
      }
      chrome.runtime.sendMessage({ action: 'OFFSCREEN_LOAD_MODEL' }, (resp) => {
        sendResponse(resp || { success: false, error: 'No response from worker' });
      });
    });
    return true;
  }

  // All other messages go through the regular router
  messageRouter.handleMessage(message, sender)
    .then((result) => sendResponse(result))
    .catch((err) => sendResponse({ success: false, error: err.message }));

  return true;
});

// Self-initialize on worker wake-up
initializeExtension();
