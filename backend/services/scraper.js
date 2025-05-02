// backend/services/scraper.js
const puppeteer = require("puppeteer");
const WaterOutage = require("../models/WaterOutage"); // Import the model

async function scrapeWaterOutages() {
  try {
    // Launch Puppeteer in headless mode
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Navigate to the water outages page and wait until network is idle
    await page.goto("https://www.calgary.ca/water/customer-service/water-outages.html", { 
      waitUntil: "networkidle0" 
    });
    
    // Get the inner text of the entire page
    const pageText = await page.evaluate(() => document.body.innerText);
    await browser.close();

    // Split the raw text using "Information |" as the delimiter.
    // Each outage entry is assumed to start with "Information |".
    const blocks = pageText.split("Information |").slice(1); // remove anything before the first entry

    const currentTime = new Date();
    const outages = blocks.map(block => {
      block = block.trim();
      
      // Extract community name and the updated time.
      // Expected format: "BRIDGELAND/RIVERSIDE community (updated April 29, 2025 11:34 AM)"
      let community = "";
      let updatedTime = "";
      let updatedDate = null;
      
      const communityRegex = /^([^\(]+)\s+community\s+\(updated\s+([^\)]+)\)/i;
      const communityMatch = block.match(communityRegex);
      if (communityMatch) {
        community = communityMatch[1].trim();
        updatedTime = communityMatch[2].trim();
        
        // Parse the date string (e.g., "April 29, 2025 11:34 AM")
        try {
          updatedDate = new Date(updatedTime);
        } catch (e) {
          console.warn(`Could not parse date: ${updatedTime}`);
        }
      }
      
      // Extract Priority (e.g., "Priority: Emergency")
      let priority = "";
      const priorityMatch = block.match(/Priority:\s*([^\n]+)/i);
      if (priorityMatch) {
        priority = priorityMatch[1].trim();
      }
      
      // Extract the first occurrence for current status (e.g., "The current status is: Repair in Progress")
      let currentStatus = "";
      const statusMatch = block.match(/The current status is:\s*([^\n]+)/i);
      if (statusMatch) {
        currentStatus = statusMatch[1].trim();
      }
      
      // Extract Specific repair location (line starts with "Specific repair location:")
      let repairLocation = "";
      const repairLocMatch = block.match(/Specific repair location:\s*([^\n]+)/i);
      if (repairLocMatch) {
        repairLocation = repairLocMatch[1].trim();
      }
      
      // Extract Repair completion info (line starts with "Repair to be completed by:")
      let repairCompletion = "";
      const repairCompMatch = block.match(/Repair to be completed by:\s*([^\n]+)/i);
      if (repairCompMatch) {
        repairCompletion = repairCompMatch[1].trim();
      }
      
      return {
        community,
        updatedTime,
        updatedDate, // Store the actual date object
        priority, 
        currentStatus,
        repairLocation,
        repairCompletion,
        // Add these fields for frontend compatibility
        name: community,
        scrapedAt: currentTime
      };
    });

    // Filter outages to keep only valid ones and within last 24 hours
    const validOutages = outages.filter(o => {
      // Must have a community name
      if (!o.community || o.community.length === 0) return false;
      
      // If we have a valid date, check if it's within last 24 hours
      if (o.updatedDate) {
        const oneDayAgo = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);
        return o.updatedDate >= oneDayAgo;
      }
      
      // If we couldn't parse the date, keep it by default
      return true;
    });
    
    console.log(`Found ${outages.length} total outages, ${validOutages.length} are valid and within last 24 hours`);
    
    if (validOutages.length > 0) {
      try {
        // First delete old records to prevent duplication
        const deleteResult = await WaterOutage.deleteMany({});
        console.log(`Deleted ${deleteResult.deletedCount} old records`);
        
        // Then insert the new ones (remove the temporary updatedDate field)
        const outagesForDB = validOutages.map(({updatedDate, ...rest}) => rest);
        const insertResult = await WaterOutage.insertMany(outagesForDB);
        console.log(`Saved ${insertResult.length} outages to database`);
      } catch (dbError) {
        console.error("Database operation failed:", dbError);
        // Continue execution, don't throw - we want the scheduler to keep running
      }
    } else {
      console.log("No valid recent outages found to save");
    }

    return validOutages;
  } catch (error) {
    console.error("Error fetching water outage data:", error);
    return [];
  }
}

module.exports = scrapeWaterOutages;
