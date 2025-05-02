// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cron = require("node-cron");
require("dotenv").config();

const pipeRoutes = require("./routes/pipes");
const waterOutageRoute = require("./routes/waterOutage");
const scrapeWaterOutages = require("./services/scraper");
const scraperScheduler = require('./services/scheduler');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
// Ensure only your client (http://localhost:3000) can access your API
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// API Routes
// Choose either '/api/water-outage' OR '/api/wateroutage' and keep consistency
app.use("/api/waterOutage", waterOutageRoute); // changed here for consistency with client call
app.use("/api/pipes", pipeRoutes);

app.get("/", (req, res) => {
  res.send("Water Service Lines API is running!");
});
// Connect to MongoDB and confirm connection via console.log
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    
    // Start the scheduler for auto-scraping
    scraperScheduler.start();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });




// Optional: Manual scraping endpoint (if not already in waterOutageRoute)
// This can be useful for ad-hoc updates:
app.get("/api/waterOutage/scrape", async (req, res) => {
  try {
    const data = await scrapeWaterOutages();
    res.json({ message: "Scraping complete!", data });
  } catch (error) {
    res.status(500).json({ error: "Scraping failed", details: error.message });
  }
});

// Optional: Schedule scraping every hour (adjust timing as needed)
cron.schedule("0 * * * *", async () => {
  console.log("Running scheduled water outage scraping...");
  await scrapeWaterOutages();
});
