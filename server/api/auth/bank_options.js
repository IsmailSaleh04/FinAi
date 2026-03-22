const express = require('express');
const router = express.Router();

const SECRET_ID = "a2c58d45-3eca-48c0-9b43-a01d2cc9ee1a";
const SECRET_KEY = "fc3b1c2a66556bc49540a7d553693a53cae0c7be27c7e84d4fe3e4d3a28c743805cac279c6466eced5023be3e71445a6e56686ccb378da13ad84edf723018265";

router.get('/', async (req, res) => {
    try {
        // Step 1: Get access token
        const tokenResponse = await fetch("https://bankaccountdata.gocardless.com/api/v2/token/new/", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                secret_id: SECRET_ID,
                secret_key: SECRET_KEY,
            }),
        });

        if (!tokenResponse.ok) {
            console.error(await tokenResponse.text());
            throw new Error(`HTTP error! Status: ${tokenResponse.status}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access;

        // Step 2: Get institutions list
        const institutionsUrl = "https://bankaccountdata.gocardless.com/api/v2/institutions/?country=gb";
        const response = await fetch(institutionsUrl, {
            method: "GET",
            headers: {
                "accept": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
        });

        if (!response.ok) {
            console.error(await response.text());
            throw new Error(`Failed to fetch bank options: ${response.statusText}`);
        }

        const bankOptions = await response.json();

        // Add mock bank option
        const mockBank = {
        id: "SANDBOXFINANCE_SFIN0000",
        name: "Sandbox Finance",
        bic: "SFIN0000",
        countries: ["GB"],
        logo: "https://cdn-logos.gocardless.com/ais/SANDBOXFINANCE_SFIN0000.png",
        };

        if (!bankOptions.find(bank => bank.id === mockBank.id)) {
        bankOptions.push(mockBank);  // Inject it manually
        }

        res.json(bankOptions);
    } catch (error) {
        console.error('Error fetching bank options:', error);
        res.status(500).json({ error: 'Failed to fetch bank options' });
    }
});

module.exports = router;