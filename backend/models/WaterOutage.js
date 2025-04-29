const mongoose = require("mongoose");

const WaterOutageSchema = new mongoose.Schema({
    community: String,        // Changed from communityInfo
    updatedTime: String,      // Added
    priority: String,         // Kept
    currentStatus: String,    // Changed from status, matches scraper
    repairLocation: String,   // Kept
    repairCompletion: String, // Added
    waterWagonInfo: String,   // Changed from waterWagon, matches scraper
    // breakDetails: String,  // Removed as it wasn't in the scraper output
    scrapedAt: { type: Date, default: Date.now } // Kept
  });

module.exports = mongoose.model("WaterOutage", WaterOutageSchema);
