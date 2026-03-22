const express = require('express');
const router = express.Router();
const pool = require('../../db');

const SECRET_ID = "a2c58d45-3eca-48c0-9b43-a01d2cc9ee1a";
const SECRET_KEY = "fc3b1c2a66556bc49540a7d553693a53cae0c7be27c7e84d4fe3e4d3a28c743805cac279c6466eced5023be3e71445a6e56686ccb378da13ad84edf723018265";

router.get('/', async (req, res) => {
  const { requisitionId, userId } = req.query;

  try {
    // Step 1: Get access token
    const tokenRes = await fetch('https://bankaccountdata.gocardless.com/api/v2/token/new/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify({ secret_id: SECRET_ID, secret_key: SECRET_KEY })
    });
    const { access } = await tokenRes.json();

    if (!access) {
      return res.status(401).json({ error: 'Failed to retrieve access token' });
    }

    // Step 2: Get requisition
    const requisitionRes = await fetch(`https://bankaccountdata.gocardless.com/api/v2/requisitions/${requisitionId}/`, {
      headers: { Authorization: `Bearer ${access}` }
    });
    const requisition = await requisitionRes.json();

    if (!requisition.accounts || requisition.accounts.length === 0) {
      console.warn('No accounts found in requisition:', requisitionId);
      return res.status(400).json({ error: 'No accounts linked. Make sure user completed bank login.' });
    }

    const results = [];

    for (const accountId of requisition.accounts) {
      // Step 3: Get account details
      const detailsRes = await fetch(`https://bankaccountdata.gocardless.com/api/v2/accounts/${accountId}/details/`, {
        headers: { Authorization: `Bearer ${access}` }
      });
      const details = await detailsRes.json();

      if (!details.account) {
        console.warn(`No account details for account ${accountId}`);
        continue;
      }

      // Step 4: Get balances
      const balancesRes = await fetch(`https://bankaccountdata.gocardless.com/api/v2/accounts/${accountId}/balances/`, {
        headers: { Authorization: `Bearer ${access}` }
      });
      const balances = await balancesRes.json();

      const balanceAmount = balances?.balances?.[0]?.balanceAmount?.amount || 0;

      const accountData = {
        userId,
        account_id: accountId,
        account_type: details.account?.product || 'Unknown',
        bank_name: details.account?.name || 'Unknown',
        balance: balanceAmount,
        account_status: 'Active'
      };

      try {
        await pool.query(
          `INSERT INTO bank_accounts (iban, user_id, bank_name, status, balance)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (iban, user_id) DO NOTHING`,
          [
            accountData.account_id,
            accountData.userId,
            accountData.bank_name,
            accountData.account_status.toLowerCase(),
            accountData.balance
          ]
        );
      } catch (err) {
        console.error('Error inserting account into DB:', err);
        return res.status(500).json({ error: 'Failed to save bank account' });
      }

      results.push(accountData);
    }

    res.json(results);
  } catch (err) {
    console.error('Error adding account to DB:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
module.exports = router;