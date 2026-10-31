/**
 * Su_AdBlock Dashboard - Translation Diagnostics
 * Tests the real neural translation pipeline.
 * Free Forever. Private by Design.
 */

window.initDiagnosticsPage = function () {
  const runTestsBtn = document.getElementById('diag-run-tests-btn');
  const testResults = document.getElementById('diag-test-results');
  const copyReportBtn = document.getElementById('diag-copy-report-btn');
  const modelStatusEl = document.getElementById('diag-model-status');

  // Test cases for Bengali translation validation
  const TEST_CASES = [
    {
      id: 1,
      label: 'Simple greeting',
      input: 'Hello, how are you?',
      description: 'Basic greeting — should produce Bengali greeting'
    },
    {
      id: 2,
      label: 'Space Shuttle paragraph',
      input: 'The Space Shuttle is a retired, partially reusable low Earth orbital spacecraft system that went to the ISS and performed other orbital missions.',
      description: 'Reference sentence from user bug report — must NOT echo English'
    },
    {
      id: 3,
      label: 'FitRide paragraph',
      input: 'FitRide is a fitness application that allows users to track their workouts. The app supports various workout calculation techniques, including calorie-based, time-based, and distance-based workouts.',
      description: 'FitRide benchmark — must produce Bengali'
    },
    {
      id: 4,
      label: 'Technology sentence',
      input: 'Artificial intelligence and machine learning are transforming the way computers process information.',
      description: 'Technical sentence — Bengali expected'
    },
    {
      id: 5,
      label: 'Short phrase',
      input: 'Welcome to the internet.',
      description: 'Short sentence — must produce Bengali'
    },
    {
      id: 6,
      label: 'Multi-sentence paragraph',
      input: 'The internet has changed modern life in many ways. People can communicate instantly across the world. Access to information has never been easier.',
      description: 'Multi-sentence — each sentence must translate to Bengali'
    },
    {
      id: 7,
      label: 'Bengali validation (must NOT be English echo)',
      input: 'The Space Shuttle is a retired, partially reusable low Earth orbital spacecraft system.',
      description: 'Confirms output is NOT the same as input (the original bug)'
    }
  ];

  let reportLines = [];

  function hasBengaliChars(text) {
    return (text.match(/[\u0980-\u09FF]/g) || []).length;
  }

  function validateBengali(input, output) {
    if (!output || typeof output !== 'string') return { pass: false, reason: 'No output' };
    const t = output.trim();
    if (!t) return { pass: false, reason: 'Empty output' };
    if (t === input.trim()) return { pass: false, reason: 'Output is identical to input (English echo bug)' };
    const bengaliCount = hasBengaliChars(t);
    const totalNonSpace = t.replace(/\s/g, '').length;
    if (totalNonSpace === 0) return { pass: false, reason: 'Output has no characters' };
    const ratio = bengaliCount / totalNonSpace;
    if (ratio < 0.15) return { pass: false, reason: `Only ${Math.round(ratio * 100)}% Bengali chars (need ≥15%). Looks like English.` };
    return { pass: true, reason: `${Math.round(ratio * 100)}% Bengali chars ✓` };
  }

  async function runSingleTest(tc) {
    const start = performance.now();
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'TRANSLATE_TEXT',
        payload: { text: tc.input }
      }, (res) => {
        const elapsed = Math.round(performance.now() - start);
        if (chrome.runtime.lastError || !res || !res.success) {
          resolve({
            id: tc.id,
            label: tc.label,
            input: tc.input,
            output: null,
            engine: null,
            elapsed,
            pass: false,
            reason: (res && res.error) || (chrome.runtime.lastError && chrome.runtime.lastError.message) || 'No response'
          });
          return;
        }
        const validation = validateBengali(tc.input, res.translation);
        resolve({
          id: tc.id,
          label: tc.label,
          input: tc.input,
          output: res.translation || '',
          engine: res.engine || '',
          elapsed,
          pass: validation.pass,
          reason: validation.reason
        });
      });
    });
  }

  async function runAllTests() {
    if (!runTestsBtn) return;
    runTestsBtn.disabled = true;
    runTestsBtn.textContent = 'Running tests...';
    if (testResults) testResults.innerHTML = '<p style="color:#5f6368;font-style:italic">Running 7 translation tests...</p>';

    reportLines = ['Su_AdBlock Translation Diagnostics Report', '='.repeat(50), ''];

    let passed = 0;
    const results = [];

    for (const tc of TEST_CASES) {
      const r = await runSingleTest(tc);
      results.push(r);
      if (r.pass) passed++;
    }

    // Render results
    if (testResults) {
      const html = results.map(r => `
        <div style="margin-bottom:16px;padding:12px;border-radius:8px;border:1px solid ${r.pass ? '#34a853' : '#ea4335'};background:${r.pass ? '#f0faf4' : '#fdf3f2'}">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span style="font-size:18px">${r.pass ? '✅' : '❌'}</span>
            <strong style="color:${r.pass ? '#1e8e3e' : '#c5221f'}">TEST ${r.id}: ${r.label}</strong>
            <span style="margin-left:auto;font-size:12px;color:#5f6368">${r.elapsed}ms</span>
          </div>
          <div style="font-size:12px;color:#3c4043;margin-bottom:4px"><strong>Input:</strong> ${r.input.slice(0, 100)}${r.input.length > 100 ? '...' : ''}</div>
          <div style="font-size:12px;color:${r.pass ? '#1e8e3e' : '#c5221f'};margin-bottom:4px"><strong>Output:</strong> ${r.output ? r.output.slice(0, 150) + (r.output.length > 150 ? '...' : '') : '(none)'}</div>
          <div style="font-size:12px;color:#5f6368"><strong>Engine:</strong> ${r.engine || 'N/A'} | <strong>Result:</strong> ${r.reason}</div>
        </div>
      `).join('');

      const summary = `
        <div style="padding:12px;border-radius:8px;background:${passed === results.length ? '#e6f4ea' : '#fce8e6'};border:2px solid ${passed === results.length ? '#34a853' : '#ea4335'};margin-bottom:16px">
          <strong style="font-size:15px;color:${passed === results.length ? '#1e8e3e' : '#c5221f'}">
            ${passed === results.length ? '✅' : '❌'} ${passed}/${results.length} Tests Passed
          </strong>
          ${passed < results.length ? '<br><span style="font-size:12px;color:#c5221f">⚠️ Some tests failed. The neural model may not be downloaded. Use Dashboard > Translator > Download Neural Model.</span>' : ''}
        </div>
      `;

      testResults.innerHTML = summary + html;
    }

    // Build report
    reportLines.push(`Results: ${passed}/${results.length} passed`);
    reportLines.push('');
    for (const r of results) {
      reportLines.push(`TEST ${r.id}: ${r.label}`);
      reportLines.push(`  Input:  ${r.input}`);
      reportLines.push(`  Output: ${r.output || '(none)'}`);
      reportLines.push(`  Engine: ${r.engine || 'N/A'}`);
      reportLines.push(`  Time:   ${r.elapsed}ms`);
      reportLines.push(`  Result: ${r.pass ? 'PASS' : 'FAIL'} — ${r.reason}`);
      reportLines.push('');
    }

    runTestsBtn.disabled = false;
    runTestsBtn.textContent = 'Run Translation Tests';
  }

  if (runTestsBtn) {
    runTestsBtn.addEventListener('click', runAllTests);
  }

  if (copyReportBtn) {
    copyReportBtn.addEventListener('click', () => {
      if (!reportLines.length) return;
      navigator.clipboard.writeText(reportLines.join('\n')).then(() => {
        copyReportBtn.textContent = 'Copied!';
        setTimeout(() => { copyReportBtn.textContent = 'Copy Report'; }, 1500);
      });
    });
  }

  // Show current provider status
  async function updateModelStatus() {
    if (!modelStatusEl) return;
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }, (res) => {
        if (res && res.success && res.settings) {
          const s = res.settings;
          const provider = s.translationProvider || 'google_cloud';
          let statusText = '';
          if (provider === 'google_cloud') {
            statusText = s.googleApiKey ? '✅ Google Cloud Translation API (Configured)' : '⚠️ Google Cloud Translation API (API Key required in Settings)';
          } else if (provider === 'libretranslate') {
            statusText = `🌐 LibreTranslate Endpoint: ${s.libreTranslateEndpoint || 'https://libretranslate.com'}`;
          } else {
            statusText = '⚡ Google Translation Engine (Online · Active & Ready)';
          }
          modelStatusEl.textContent = statusText;
        }
        resolve();
      });
    });
  }
  updateModelStatus();
};
