const mongoose = require('mongoose');

const pipeSchema = new mongoose.Schema({
  material: {
    type: String, // e.g., 'PVC', 'Copper'
    required: true, // Set to false if it's optional
  },
  address: {
    type: String,   //(e.g., "123 Main St, City, Country")
    required: true, // Set to false if it's optional
  },
  buildingType: {
    type: String, 
    required: true, // Set to false if it's optional
  },
  // You can include other fields like pipe age, diameter, etc.
  age: {
    type: Number, // Age of the pipe in years
  },
  diameter: {
    type: Number, // Diameter of the pipe in inches
  },
  location: {
    type: [Number], // Array for geo-coordinates [longitude, latitude]
    index: '2dsphere', // This allows for geospatial queries
  },
  // You can add more fields as necessary
});

module.exports = mongoose.model('Pipe', pipeSchema);

