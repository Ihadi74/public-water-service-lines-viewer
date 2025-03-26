const mongoose = require("mongoose");

const pipeSchema = new mongoose.Schema({
  buildingType: String,
  address: String,
  material: String,
  diameterMM: Number,
  installedDate: Date,
  coordinates: [[Number]], // Array of [lng, lat] pairs (LineString)
}, { collection: "pipes" }); 

module.exports = mongoose.model("Pipe", pipeSchema);
