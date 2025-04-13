const mongoose = require("mongoose");
const { connectDb } = require("../db.js");

// Define Water Break Schema
const waterBreakSchema = new mongoose.Schema({
  break_date: { type: Date, required: true },
  break_type: { type: String, required: true },
  status: { type: String, enum: ["ACTIVE", "INACTIVE", "RETIRED"], required: true },
  point: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true },
  },
  computed_regions: {
    region_4a3i_ccfj: { type: String },
    region_p8tp_5dkv: { type: String },
    region_4b54_tmc4: { type: String },
    region_kxmf_bzkv: { type: String }
  }
});

// Create an index for geospatial queries
waterBreakSchema.index({ point: "2dsphere" });

/**
 * Helper function that connects to the database (if not already connected)
 * and returns the WaterBreak model.
 */
async function getWaterBreakModel() {
  // Ensure the database is connected
  const connection = await connectDb();
  // Return the model (note: if the model already exists on the connection it is reused)
  return connection.model("WaterBreak", waterBreakSchema, "waterBreaks");
}

module.exports = {
  createWaterBreak: async (data) => {
    const WaterBreak = await getWaterBreakModel();
    return await WaterBreak.create(data);
  },

  findAllWaterBreaks: async () => {
    const WaterBreak = await getWaterBreakModel();
    return await WaterBreak.find();
  },

  findWaterBreakByBreakType: async (break_type) => {
    const WaterBreak = await getWaterBreakModel();
    return await WaterBreak.find({ break_type });
  },

  findWaterBreakByStatus: async (status) => {
    const WaterBreak = await getWaterBreakModel();
    return await WaterBreak.find({ status });
  },

  findWaterBreakByRegion: async (regionCode) => {
    const WaterBreak = await getWaterBreakModel();
    return await WaterBreak.find({
      $or: [
        { "computed_regions.region_4a3i_ccfj": regionCode },
        { "computed_regions.region_p8tp_5dkv": regionCode },
        { "computed_regions.region_4b54_tmc4": regionCode },
        { "computed_regions.region_kxmf_bzkv": regionCode }
      ]
    });
  },

  findNearbyWaterBreaks: async (lat, lon, distanceM) => {
    const WaterBreak = await getWaterBreakModel();
    return await WaterBreak.find({
      point: {
        $near: {
          $geometry: { type: "Point", coordinates: [lon, lat] },
          $maxDistance: distanceM,
        },
      },
    });
  },

  /**
   * New function to find a water break by a specific coordinate array.
   * @param {number[]} coordinates - An array of two numbers [longitude, latitude].
   */
  findWaterBreakByCoordinates: async (coordinates) => {
    const WaterBreak = await getWaterBreakModel();
    return await WaterBreak.findOne({ "point.coordinates": coordinates });
  }
};


