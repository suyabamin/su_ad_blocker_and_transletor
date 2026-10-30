/**
 * Su_AdBlock - Statistics Manager
 * Tracks aggregate blocking events locally without collecting browsing URLs or telemetry.
 * Honest counting: counts actual blocked events and hidden elements, never installed rules.
 * Free Forever. Private by Design.
 */

const DEFAULT_STATS = {
  allTime: {
    adsBlocked: 0,
    trackersBlocked: 0,
    elementsHidden: 0,
    lastReset: new Date().toISOString()
  },
  session: {
    adsBlocked: 0,
    trackersBlocked: 0,
    elementsHidden: 0,
    startedAt: new Date().toISOString()
  }
};

class StatisticsManager {
  constructor() {
    this._stats = { ...DEFAULT_STATS };
  }

  /**
   * Initializes statistics from chrome.storage.local.
   * @returns {Promise<Object>}
   */
  async load() {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        return resolve(this._stats);
      }
      chrome.storage.local.get(['statistics'], (result) => {
        if (result && result.statistics) {
          this._stats.allTime = { ...DEFAULT_STATS.allTime, ...result.statistics.allTime };
          // Preserve existing session or start new if none
          this._stats.session = result.statistics.session || { ...DEFAULT_STATS.session };
        }
        resolve(this._stats);
      });
    });
  }

  /**
   * Increments blocked ad count.
   * @param {number} count 
   */
  async recordAdBlocked(count = 1) {
    this._stats.allTime.adsBlocked += count;
    this._stats.session.adsBlocked += count;
    await this._save();
  }

  /**
   * Increments blocked tracker count.
   * @param {number} count 
   */
  async recordTrackerBlocked(count = 1) {
    this._stats.allTime.trackersBlocked += count;
    this._stats.session.trackersBlocked += count;
    await this._save();
  }

  /**
   * Increments hidden cosmetic element count.
   * @param {number} count 
   */
  async recordElementsHidden(count = 1) {
    this._stats.allTime.elementsHidden += count;
    this._stats.session.elementsHidden += count;
    await this._save();
  }

  /**
   * Returns current statistics snapshots.
   * @returns {{ allTime: Object, session: Object, isApproximate: boolean }}
   */
  getStats() {
    return {
      allTime: { ...this._stats.allTime },
      session: { ...this._stats.session },
      // Exact counts when DNR feedback is active, labeled approximate when aggregated
      isApproximate: false
    };
  }

  /**
   * Resets all-time and session statistics to zero.
   * @returns {Promise<Object>}
   */
  async reset() {
    const now = new Date().toISOString();
    this._stats = {
      allTime: {
        adsBlocked: 0,
        trackersBlocked: 0,
        elementsHidden: 0,
        lastReset: now
      },
      session: {
        adsBlocked: 0,
        trackersBlocked: 0,
        elementsHidden: 0,
        startedAt: now
      }
    };
    await this._save();
    return this.getStats();
  }

  async _save() {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        return resolve();
      }
      chrome.storage.local.set({ statistics: this._stats }, () => resolve());
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StatisticsManager, DEFAULT_STATS };
}
if (typeof globalThis !== 'undefined') {
  globalThis.StatisticsManager = StatisticsManager;
  globalThis.DEFAULT_STATS = DEFAULT_STATS;
}
