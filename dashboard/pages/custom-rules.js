/**
 * Su_AdBlock Dashboard - Custom Rules Page Controller
 * Free Forever. Private by Design.
 */

window.initCustomRulesPage = function () {
  const patternInput = document.getElementById('custom-rule-pattern');
  const actionSelect = document.getElementById('custom-rule-action');
  const noteInput = document.getElementById('custom-rule-note');
  const addBtn = document.getElementById('custom-rule-add-btn');
  const tableBody = document.getElementById('custom-rules-table-body');

  function renderTable(rules) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (!rules || rules.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="empty-cell">No custom rules configured.</td></tr>';
      return;
    }

    rules.forEach(rule => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code>#${rule.id}</code></td>
        <td><strong>${rule.urlFilter || rule.rawPattern}</strong></td>
        <td><span class="badge-tag" style="background: ${rule.action === 'allow' ? '#dbeafe; color: #1d4ed8;' : '#fee2e2; color: #b91c1c;'}">${rule.action.toUpperCase()}</span></td>
        <td>${rule.note || '-'}</td>
        <td>
          <label class="switch">
            <input type="checkbox" class="rule-toggle" data-id="${rule.id}" ${rule.enabled ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </td>
        <td><button class="btn btn-danger btn-sm" data-delete-id="${rule.id}">Delete</button></td>
      `;
      tableBody.appendChild(tr);
    });

    // Attach toggle and delete handlers
    tableBody.querySelectorAll('.rule-toggle').forEach(input => {
      input.addEventListener('change', () => {
        const ruleId = parseInt(input.getAttribute('data-id'), 10);
        chrome.runtime.sendMessage({
          action: 'TOGGLE_CUSTOM_RULE',
          payload: { ruleId }
        });
      });
    });

    tableBody.querySelectorAll('button[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ruleId = parseInt(btn.getAttribute('data-delete-id'), 10);
        chrome.runtime.sendMessage({
          action: 'DELETE_CUSTOM_RULE',
          payload: { ruleId }
        }, () => loadRules());
      });
    });
  }

  function loadRules() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'GET_CUSTOM_RULES' }, (res) => {
        if (res && res.success) {
          renderTable(res.rules);
        }
      });
    }
  }

  if (addBtn && patternInput) {
    addBtn.addEventListener('click', () => {
      const pattern = patternInput.value.trim();
      const action = actionSelect.value;
      const note = noteInput.value.trim();

      if (!pattern) return;

      chrome.runtime.sendMessage({
        action: 'ADD_CUSTOM_RULE',
        payload: { pattern, action, note }
      }, (res) => {
        if (res && res.success) {
          patternInput.value = '';
          noteInput.value = '';
          loadRules();
        } else {
          alert(res && res.error ? res.error : 'Failed to add rule.');
        }
      });
    });
  }

  loadRules();
};
