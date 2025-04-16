const express = require("express");
const router = express.Router();
const Pipe = require("../models/Pipes"); // Make sure this path and name is correct

// GET /api/pipes with filtering + pagination
router.get("/", async (req, res) => {
  try {
    const {
      address,
      buildingType,
      materialType,
      page = 1,
      limit = 100,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};
    //console.log("Query sent to MongoDB:", query);

    if (address) {
      query.WATER_SERVICE_ADDRESS = { $regex: new RegExp(address, "i") };
    }

    if (buildingType) {
      query.BUILDING_TYPE = buildingType;
    }

    if (materialType) {
      query.MATERIAL_TYPE = materialType;
    }

    const total = await Pipe.countDocuments(query);
    const pipes = await Pipe.find(query).skip(skip).limit(parseInt(limit));

    res.json({ total, pipes });
  } catch (error) {
    console.error("Failed to fetch pipes:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
