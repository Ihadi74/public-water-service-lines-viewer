const mongoose = require("mongoose");

const mongo_uri = process.env.MONGO_URI || "mongodb://localhost:27017/waterbreaks";
let connectionPromise = null;

// Establish the connection to MongoDB (if not already connected)
async function connectDb() {
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(mongo_uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
  return await connectionPromise;
}

// Disconnect from the database
async function disconnectDb() {
  if (connectionPromise) {
    const dbInstance = await connectionPromise;
    await dbInstance.connection.close();
    connectionPromise = null;
  }
}

// Define the Water Break schema
const waterBreakSchema = new mongoose.Schema({
  break_date: { type: Date, required: true },
  break_type: { type: String, required: true },
  status: { type: String, enum: ["ACTIVE", "INACTIVE", "RETIRED"], required: true },
  point: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true },
  },
  // Additional fields can be added here if needed
});

// Create an index for geospatial queries
waterBreakSchema.index({ point: "2dsphere" });

// Create the Water Break model
const WaterBreak = mongoose.model("WaterBreak", waterBreakSchema, "waterBreaks");

// Function to create a new water break record in the database
async function createWaterBreak(data) {
  return await WaterBreak.create(data);
}

// Function to find a water break by its coordinates
async function findWaterBreakByCoordinates(coordinates) {
  return await WaterBreak.findOne({ "point.coordinates": coordinates });
}

module.exports = {
  connectDb,
  disconnectDb,
  createWaterBreak,
  findWaterBreakByCoordinates,
};



