// ✅ Step 0: Load data from URL and localStorage
const urlParams = new URLSearchParams(window.location.search);
const requisitionId = urlParams.get('ref') || urlParams.get('requisitionId');
const userId = localStorage.getItem('userId');
const userName = localStorage.getItem('name');

// ✅ Step 6: After Redirect – Add account to DB if requisitionId is in URL
if (requisitionId && userId) {
  fetch(`/api/auth/add_account_to_db?requisitionId=${requisitionId}&userId=${userId}`)
    .then(res => res.json())
    .then(data => {
      console.log(requisition);
      console.log('✅ Account added to DB:', data);
      if (data.accounts) displayBankAccounts(data.accounts);
    })
    .catch(err => {
      console.error('❌ Error adding account:', err);
    });
}

document.addEventListener('DOMContentLoaded', () => {
  // ✅ Step 1: Redirect to login if no user
  if (!userId) {
    console.warn('No user logged in, redirecting...');
    window.location.href = '/login.html';
    return;
  }

  // ✅ Step 3: Fetch and populate banks
  async function fetchBankOptions() {
    try {
      const res = await fetch('/api/auth/bank_options');
      const banks = await res.json();
      const select = document.getElementById('bank-select');

      select.innerHTML = '<option value="">Select a bank</option>';
      banks.forEach(bank => {
        const option = document.createElement('option');
        option.value = bank.id;
        option.textContent = bank.name;
        select.appendChild(option);
      });
    } catch (err) {
      console.error('❌ Failed to fetch bank options:', err);
    }
  }

  // ✅ Step 4: Handle "Connect Bank" button click
  document.getElementById('confirmBankBtn').addEventListener('click', async () => {
    const selectedBank = document.getElementById('bank-select').value;
    if (!selectedBank) return alert('Please select a bank');

    try {
      // 🔹 Step 4a: Create Agreement
      const agreementRes = await fetch('/api/auth/create_agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institution_id: selectedBank })
      });

      const { accessToken, agreementId } = await agreementRes.json();
      if (!agreementId) throw new Error('Failed to create agreement');

      // 🔹 Step 4b: Create Requisition
      const requisitionRes = await fetch('/api/auth/create_requisition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institution_id: selectedBank,
          accessToken,
          agreementId,
          userId
        })
      });

      const { link } = await requisitionRes.json();
      if (!link) throw new Error('Failed to create requisition');

      // 🔹 Step 4c: Redirect to GoCardless login
      window.location.href = link;

    } catch (err) {
      console.error('❌ Error during bank connection:', err);
      alert('Error connecting to your bank. See console.');
    }
  });

  // ✅ Step 5: Toggle add bank section
  document.getElementById('addBankBtn').addEventListener('click', () => {
    const section = document.getElementById('bankSelectContainer');
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
  });
  
  async function fetchAndDisplayAccounts() {
    const userId = localStorage.getItem("userId");
    const response = await fetch(`/api/auth/get_accounts?userId=${userId}`);
    const accounts = await response.json();
    displayBankAccounts(accounts);
  }

  // ✅ Step 7: Display bank accounts
  function displayBankAccounts(accounts = []) {
    const container = document.getElementById('bankCards');
    container.innerHTML = '';
    let total = 0;

    if (accounts.length === 0) {
      container.innerHTML = '<p>No bank accounts added.</p>';
      return;
    }

    accounts.forEach(acc => {
      const card = document.createElement('div');
      card.className = 'finai-card';
      card.innerHTML = `
        <h4>${acc.account_type || 'Account'}</h4>
        <p><strong>Bank:</strong> ${acc.bank_name || 'Unknown'}</p>
        <p><strong>ID:</strong> ${acc.account_id}</p>
        <p><strong>Status:</strong> ${acc.account_status || 'Active'}</p>
        <p><strong>Balance:</strong> ${acc.balance || 0} JOD</p>
      `;
      container.appendChild(card);
      total += parseFloat(acc.balance || 0);
    });

    document.getElementById('totalBalance').textContent = `${total.toFixed(2)} JOD`;
  }

  // ✅ Close credential modal (if used)
  document.getElementById('closeBankCredentialModel').addEventListener('click', () => {
    document.getElementById('credential-modal').style.display = 'none';
  });

  // ✅ Log out
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('name');
    window.location.href = '/login.html';
  });

  // ✅ Initial load
  fetchBankOptions();
  fetchAndDisplayAccounts();
});