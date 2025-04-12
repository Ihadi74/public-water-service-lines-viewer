const mongoose = require("mongoose");
const waterLeakConnection = mongoose.createConnection(
  process.env.MONGO_LEAKS_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const waterLeakSchema = new mongoose.Schema({
  BREAK_DATE: { type: String },
  BREAK_TYPE: { type: String },
  STATUS: { type: String },
  point: {
    type: { type: String, default: "Point" },
    coordinates: [Number],
  },
});

waterLeakSchema.index({ point: "2dsphere" });

// 👇 THIS is the correct way to bind the model to the new connection
const WaterLeak = waterLeakConnection.model(
  "WaterLeak",
  waterLeakSchema,
  "WaterLeaks"
);

module.exports = WaterLeak;
