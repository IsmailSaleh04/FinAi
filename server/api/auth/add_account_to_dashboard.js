const express = require('express');
const router = express.Router();

const SECRET_ID = "a2c58d45-3eca-48c0-9b43-a01d2cc9ee1a";
const SECRET_KEY = "fc3b1c2a66556bc49540a7d553693a53cae0c7be27c7e84d4fe3e4d3a28c743805cac279c6466eced5023be3e71445a6e56686ccb378da13ad84edf723018265";

router.post('/', async (req, res) => {
  const { institutionId, userId } = req.body;

  try {
    // Get token
    const tokenRes = await fetch('https://bankaccountdata.gocardless.com/api/v2/token/new/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify({ secret_id: SECRET_ID, secret_key: SECRET_KEY })
    });
    const { access } = await tokenRes.json();

    // Create agreement
    const agreementRes = await fetch('https://bankaccountdata.gocardless.com/api/v2/agreements/enduser/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access}`,
        'Content-Type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify({
        institution_id: institutionId,
        max_historical_days: 90,
        access_valid_for_days: 30,
        access_scope: ['balances', 'details', 'transactions']
      })
    });
    const agreement = await agreementRes.json();

    // Create requisition
    const redirectUrl = `http://localhost:3000/dashboard.html?userId=${userId}`;
    const requisitionRes = await fetch('https://bankaccountdata.gocardless.com/api/v2/requisitions/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access}`,
        'Content-Type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify({
        redirect: redirectUrl,
        institution_id: institutionId,
        reference: `${userId}-${Date.now()}`,
        agreement: agreement.id,
        user_language: 'EN'
      })
    });

    const requisition = await requisitionRes.json();
    res.json({ link: requisition.link, requisitionId: requisition.id });

  } catch (err) {
    console.error('Error creating authentication link:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;