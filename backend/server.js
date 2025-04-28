const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cheerio = require('cheerio');
require('dotenv').config();
const pipeRoutes = require('./routes/pipes');
const waterOutageRoute = require('./routes/waterOutage');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// Mount the water outage route
app.use('/api/wateroutage', waterOutageRoute);
app.use('/api/pipes', pipeRoutes);
app.get("/", (req, res) => {
  res.send("Water Service Lines API is running!");
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });
