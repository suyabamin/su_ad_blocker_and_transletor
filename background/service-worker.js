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
  messageRouter.handleMessage(message, sender)
    .then((result) => sendResponse(result))
    .catch((err) => sendResponse({ success: false, error: err.message }));

  return true; // Keep message channel open for asynchronous reply
});

// Self-initialize on worker wake-up
initializeExtension();
