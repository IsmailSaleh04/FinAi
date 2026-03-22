// server/api/auth/create_agreement.js
const express = require('express');
const router = express.Router();

const SECRET_ID = "a2c58d45-3eca-48c0-9b43-a01d2cc9ee1a";
const SECRET_KEY = "fc3b1c2a66556bc49540a7d553693a53cae0c7be27c7e84d4fe3e4d3a28c743805cac279c6466eced5023be3e71445a6e56686ccb378da13ad84edf723018265";

router.post('/', async (req, res) => {
  const { institution_id } = req.body;

  try {
    // ✅ Step 1: Get Access Token
    const tokenRes = await fetch('https://bankaccountdata.gocardless.com/api/v2/token/new/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({ secret_id: SECRET_ID, secret_key: SECRET_KEY }),
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access;

    if (!accessToken) throw new Error('Failed to get access token');

    // ✅ Step 3: Create End User Agreement
    const agreementRes = await fetch('https://bankaccountdata.gocardless.com/api/v2/agreements/enduser/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        institution_id,
        max_historical_days: 90,
        access_valid_for_days: 30,
        access_scope: ['balances', 'details', 'transactions'],
      }),
    });

    const agreementData = await agreementRes.json();

    res.json({
      accessToken,
      agreementId: agreementData.id,
    });
  } catch (err) {
    console.error('Error creating agreement:', err);
    res.status(500).json({ error: 'Failed to create agreement' });
  }
});

module.exports = router;
