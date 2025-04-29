// backend/services/scraper.js
const puppeteer = require("puppeteer");

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

    const outages = blocks.map(block => {
      block = block.trim();
      
      // Extract community name and the updated time.
      // Expected format: "BRIDGELAND/RIVERSIDE community (updated April 29, 2025 11:34 AM)"
      let community = "";
      let updatedTime = "";
      const communityRegex = /^([^\(]+)\s+community\s+\(updated\s+([^\)]+)\)/i;
      const communityMatch = block.match(communityRegex);
      if (communityMatch) {
        community = communityMatch[1].trim();
        updatedTime = communityMatch[2].trim();
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
      
      // Optionally, extract water wagon details if present.
      // This example attempts to capture text starting with "Water wagon:" up to the next "Repair to be completed by:" or end of block.
      let waterWagonInfo = "";
      const waterWagonMatch = block.match(/Water wagon:([\s\S]*?)(?:Repair to be completed by:|$)/i);
      if (waterWagonMatch) {
        waterWagonInfo = waterWagonMatch[1].trim();
      }
      
      return {
        community,
        updatedTime,
        priority,
        currentStatus,
        repairLocation,
        repairCompletion,
        waterWagonInfo
      };
    });

    console.log("Extracted outages:", outages);
    return outages;
  } catch (error) {
    console.error("Error fetching water outage data:", error);
    return [];
  }
}

module.exports = scrapeWaterOutages;

