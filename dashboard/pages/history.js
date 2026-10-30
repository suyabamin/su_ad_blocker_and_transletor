/**
 * Su_AdBlock Dashboard - History Page Controller
 * Manages opt-in private translation history.
 * Free Forever. Private by Design.
 */

window.initHistoryPage = function () {
  const optInToggle = document.getElementById('history-optin-toggle');
  const clearBtn = document.getElementById('clear-all-history-btn');
  const tableBody = document.getElementById('history-table-body');

  function renderTable(history) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (!history || history.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="empty-cell">No translation history recorded.</td></tr>';
      return;
    }

    history.forEach(item => {
      const tr = document.createElement('tr');
      const timeStr = item.timestamp ? new Date(item.timestamp).toLocaleString() : '-';
      tr.innerHTML = `
        <td><small>${timeStr}</small></td>
        <td>${escapeHtml(item.original)}</td>
        <td><strong style="color: #064e3b;">${escapeHtml(item.translation)}</strong></td>
        <td><span class="badge-tag">${item.engine || 'lexicon'}</span></td>
        <td><button class="btn btn-danger btn-sm" data-id="${item.id}">Delete</button></td>
      `;
      tableBody.appendChild(tr);
    });

    // Delete single item
    tableBody.querySelectorAll('button[data-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        chrome.runtime.sendMessage({
          action: 'DELETE_TRANSLATION_HISTORY_ITEM',
          payload: { id }
        }, () => loadHistory());
      });
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function loadHistory() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'GET_TRANSLATION_HISTORY' }, (res) => {
        if (res && res.success) {
          renderTable(res.history);
        }
      });
    }
  }

  // Load opt-in toggle state
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }, (res) => {
      if (res && res.success && res.settings && optInToggle) {
        optInToggle.checked = Boolean(res.settings.historyEnabled);
      }
    });
  }

  if (optInToggle) {
    optInToggle.addEventListener('change', () => {
      chrome.runtime.sendMessage({
        action: 'UPDATE_SETTINGS',
        payload: { historyEnabled: optInToggle.checked }
      });
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete all saved local translation history?')) {
        chrome.runtime.sendMessage({ action: 'CLEAR_TRANSLATION_HISTORY' }, () => {
          loadHistory();
        });
      }
    });
  }

  loadHistory();
};
