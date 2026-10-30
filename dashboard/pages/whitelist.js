/**
 * Su_AdBlock Dashboard - Whitelist Page Controller
 * Free Forever. Private by Design.
 */

window.initWhitelistPage = function () {
  const input = document.getElementById('whitelist-input');
  const addBtn = document.getElementById('whitelist-add-btn');
  const tableBody = document.getElementById('whitelist-table-body');

  function renderTable(list) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (!list || list.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="3" class="empty-cell">No whitelisted websites yet.</td></tr>';
      return;
    }

    list.forEach(domain => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${domain}</strong></td>
        <td><span class="badge-tag">Domain & Subdomains</span></td>
        <td><button class="btn btn-danger btn-sm" data-domain="${domain}">Remove</button></td>
      `;
      tableBody.appendChild(tr);
    });

    // Attach remove handlers
    tableBody.querySelectorAll('button[data-domain]').forEach(btn => {
      btn.addEventListener('click', () => {
        const domain = btn.getAttribute('data-domain');
        chrome.runtime.sendMessage({
          action: 'REMOVE_WHITELIST_DOMAIN',
          payload: { domain }
        }, () => loadWhitelist());
      });
    });
  }

  function loadWhitelist() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'GET_WHITELIST' }, (res) => {
        if (res && res.success) {
          renderTable(res.whitelist);
        }
      });
    }
  }

  if (addBtn && input) {
    addBtn.addEventListener('click', () => {
      const domain = input.value.trim();
      if (!domain) return;

      chrome.runtime.sendMessage({
        action: 'ADD_WHITELIST_DOMAIN',
        payload: { domain }
      }, (res) => {
        if (res && res.success) {
          input.value = '';
          loadWhitelist();
        } else {
          alert(res && res.error ? res.error : 'Invalid domain format.');
        }
      });
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addBtn.click();
    });
  }

  loadWhitelist();
};
