/**
 * Su_AdBlock - Dashboard Module Loader
 * Loads ES module dependencies (Transformers.js) from an external script
 * to strictly comply with Manifest V3 Content Security Policy (script-src 'self').
 * Free Forever. Private by Design.
 */

(async function initDashboardModules() {
  try {
    const mod = await import('../translator/lib/transformers.min.js');
    const transformers = mod.default || mod;
    if (typeof window !== 'undefined') window.transformers = transformers;
    if (typeof globalThis !== 'undefined') globalThis.transformers = transformers;
  } catch (e) {
    console.warn('Initial module load notice for Transformers.js in dashboard:', e);
  }
})();
