// File: routes/waterOutage.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const response = await axios.get('https://www.calgary.ca/water/customer-service/water-outages.html');
    const $ = cheerio.load(response.data);
    // Example: Extract all elements following the h2 marker up to the next <hr>
    const alertSection = $('h2:contains("Current main breaks and water outages")').nextUntil('hr').get();
    let alertText = '';
    alertSection.forEach(element => {
      alertText += $(element).text().trim() + ' ';
    });
    res.json({ content: alertText.trim('whitehorn') });
  } catch (error) {
    console.error('Error fetching water outage data:', error);
    res.status(500).json({ error: 'Failed to fetch water outage information' });
  }
});

// discuss
module.exports = router;
