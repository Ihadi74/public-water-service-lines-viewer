const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const leakReportRoute = require('./routes/leakReport');
const pipeRoutes = require("./routes/pipes");
const latestTweetAllRoute = require('./routes/latestTweetAll'); // new route for latest tweet

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware setup
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);
app.use(express.json());

// Use route files
app.use("/api/leak-report", leakReportRoute);
app.use("/api/pipes", pipeRoutes);
app.use("/api/latest-tweet-all", latestTweetAllRoute);

// Sample route
app.get("/", (req, res) => {
  res.send("Water Service Lines API is running!");
});

// Start server after connecting to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });
