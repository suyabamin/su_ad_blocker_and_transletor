/**
 * Su_AdBlock - Dashboard Main Router and Initializer
 * Coordinates navigation across all 12 management panels.
 * Free Forever. Private by Design.
 */

document.addEventListener('DOMContentLoaded', () => {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.dashboard-section');
  const pageHeading = document.getElementById('page-heading');

  const TITLE_MAP = {
    'section-overview': 'Overview & System Health',
    'section-adblocking': 'Ad Blocking Protection',
    'section-trackers': 'Tracker & Telemetry Shield',
    'section-cosmetic': 'Cosmetic Element Filtering',
    'section-whitelist': 'Website Allowlist',
    'section-customrules': 'Custom DNR Rules',
    'section-filterlists': 'Filter Lists & Baseline Rules',
    'section-statistics': 'Blocking Statistics',
    'section-translation': 'English → বাংলা Translator',
    'section-history': 'Translation History',
    'section-diagnostics': 'Translation Self-Test Diagnostics',
    'section-settings': 'Extension Settings',
    'section-about': 'About Su_AdBlock'
  };

  /**
   * Switches view to the requested target section.
   * @param {string} targetSectionId 
   */
  function navigateTo(targetSectionId) {
    if (!targetSectionId) targetSectionId = 'section-overview';

    // Update nav links
    navItems.forEach(item => {
      const target = item.getAttribute('data-target');
      if (target === targetSectionId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update section visibility
    sections.forEach(sec => {
      if (sec.id === targetSectionId) {
        sec.classList.add('active');
      } else {
        sec.classList.remove('active');
      }
    });

    // Update Topbar Title
    if (pageHeading && TITLE_MAP[targetSectionId]) {
      pageHeading.textContent = TITLE_MAP[targetSectionId];
    }
  }

  // Handle hash changes
  function handleHash() {
    let hash = window.location.hash.replace('#', '');
    if (hash.includes('?')) {
      hash = hash.split('?')[0];
    }

    if (!hash) {
      navigateTo('section-overview');
      return;
    }

    const targetSectionId = `section-${hash}`;
    const targetElement = document.getElementById(targetSectionId);
    if (targetElement) {
      navigateTo(targetSectionId);
    } else {
      navigateTo('section-overview');
    }
  }

  // Bind sidebar nav click events
  navItems.forEach(link => {
    link.addEventListener('click', (e) => {
      const target = link.getAttribute('data-target');
      if (target) {
        navigateTo(target);
      }
    });
  });

  window.addEventListener('hashchange', handleHash);

  // Initialize individual page logic
  if (window.initOverviewPage) window.initOverviewPage();
  if (window.initFiltersPage) window.initFiltersPage();
  if (window.initWhitelistPage) window.initWhitelistPage();
  if (window.initCustomRulesPage) window.initCustomRulesPage();
  if (window.initTranslationPage) window.initTranslationPage();
  if (window.initHistoryPage) window.initHistoryPage();
  if (window.initDiagnosticsPage) window.initDiagnosticsPage();
  if (window.initSettingsPage) window.initSettingsPage();

  // Initial routing
  handleHash();
});
