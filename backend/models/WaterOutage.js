const mongoose = require("mongoose");

const WaterOutageSchema = new mongoose.Schema({
  community: String,         // Matches the scraper output for community
  updatedTime: String,       // The updated timestamp as a string from the scraper
  priority: String,          // Maintained from the previous schema
  currentStatus: String,     // Matches the scraper's currentStatus field
  repairLocation: String,    // Renamed from Specificrepairlocation to repairLocation
  repairCompletion: String,  // Added for repair completion info
  scrapedAt: { type: Date, default: Date.now } // Timestamp for when the data was scraped
});

module.exports = mongoose.model("WaterOutage", WaterOutageSchema);
