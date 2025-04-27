const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const leakReportRoute = require('./routes/leakReport'); //
const pipeRoutes = require("./routes/pipes");

const app = express();
const PORT = process.env.PORT || 5001;
// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Allow only requests from localhost:3000
  })
);
app.use(express.json());

app.use("/api/leak-report", leakReportRoute);


app.use("/api/pipes", pipeRoutes);

// Sample route
app.get("/", (req, res) => {
  res.send("Water Service Lines API is running!");
});

// Start server
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
