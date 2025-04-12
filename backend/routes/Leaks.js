// routes/leaks.js
const express = require("express");
const WaterLeak = require("../models/WaterLeak.js"); // Ensure this path is correct
const router = express.Router();

// Get all water leaks from the database
router.get("/", async (req, res) => {
  try {
    const leaks = await WaterLeak.find().limit(100); // Limit to 100 records for performance
    res.json(leaks); // Send the water leak data to the frontend
    console.log(leaks.length); // Debugging line
  } catch (error) {
    console.error("Error fetching water leaks:", error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
