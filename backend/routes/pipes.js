const express = require("express");
const router = express.Router();
const Pipe = require("../models/Pipe");

// GET /api/pipes – get all pipe data
router.get("/", async (req, res) => {
  try {
    const pipes = await Pipe.find(); // You can later add filters here
    res.json(pipes);
  } catch (err) {
    console.error("Error fetching pipes:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
