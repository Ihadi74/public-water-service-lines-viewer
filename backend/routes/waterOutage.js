const express = require("express");
const WaterOutage = require("../models/WaterOutage");
const scrapeWaterOutages = require("../services/scraper");
const router = express.Router();

// In waterOutage.js

// Fetch stored data (filtered for the last 48 hours)
router.get("/", async (req, res) => {
    try {
      // Calculate the date 48 hours ago from now
      const fortyEightHoursAgo = new Date();
      fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 24);
  
      // Fetch the filtered outages
      const outageDocs = await WaterOutage.find({ // Renamed to outageDocs for clarity
        scrapedAt: { $gte: fortyEightHoursAgo }
      });
  
      console.log("Fetched outages from last 24 hours:", outageDocs);
  
      // *** CHANGE HERE: Respond with an object containing 'content' and 'outages' ***
      res.json({
        content: outageDocs.length > 0 ? `Found ${outageDocs.length} recent outage(s).` : "No recent water outage data available.", // Example content
        outages: outageDocs // The array of documents
      });
  
    } catch (error) {
      console.error("Error fetching recent water outage data:", error);
      // Send back an error object in the expected format too, if possible
      res.status(500).json({
         content: "Error fetching data.",
         outages: [],
         error: "Error fetching recent water outage data"
      });
    }
  });

// Manually trigger scraping
router.get("/scrape", async (req, res) => {
  try {
    const scrapedData = await scrapeWaterOutages();
    console.log("Scraped data:", scrapedData);

    if (scrapedData && scrapedData.length > 0) {
      try {
        // Using insertMany with ordered: false allows insertion of valid documents even if some fail
        const result = await WaterOutage.insertMany(scrapedData, { ordered: false });
        console.log("Insertion result:", result);
      } catch (error) {
        // Log and continue even if some insertions (like duplicates) fail
        console.error("Error inserting scraped data:", error);
      }
    } else {
      console.log("No data scraped or scraper returned empty array.");
    }

    // Return the freshly scraped data regardless of DB insertion success
    res.json(scrapedData);
  } catch (error) {
    console.error("Scraping or processing failed:", error);
    res.status(500).json({ error: "Scraping failed" });
  }
});

module.exports = router;
