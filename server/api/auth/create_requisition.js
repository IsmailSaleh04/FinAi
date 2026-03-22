// server/api/auth/create_requisition.js
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { accessToken, institution_id, agreementId, userId } = req.body;

  try {
    // ✅ Step 4: Create Requisition (login link)
    const response = await fetch('https://bankaccountdata.gocardless.com/api/v2/requisitions/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        redirect: `http://localhost:3000/dashboard.html?userId=${userId}`,
        institution_id,
        reference: `ref-${Date.now()}`,
        agreement: agreementId,
        user_language: 'EN',
      }),
    });

    const requisition = await response.json();
    res.json(requisition);
  } catch (err) {
    console.error('Error creating requisition:', err);
    res.status(500).json({ error: 'Failed to create requisition' });
  }
});

module.exports = router;