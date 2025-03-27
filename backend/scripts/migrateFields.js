// migrateFields.js

const mongoose = require('mongoose');
const Pipe = require('../models/Pipe');  // Adjusted path to the Pipe model

mongoose.connect('mongodb://localhost:27017/your_database')
  .then(() => {
    console.log('Connected to MongoDB');

    // Fix the query to use $exists correctly
    const query = { 
      $or: [
        { WATER_SERVICE_ADDRESS: { $exists: false } },  // Check for documents where WATER_SERVICE_ADDRESS is missing
        { WATER_SERVICE_ADDRESS: null },                // Check for documents where WATER_SERVICE_ADDRESS is null
        { WATER_SERVICE_ADDRESS: '' }                   // Check for documents where WATER_SERVICE_ADDRESS is empty
      ]
    };

    console.log('Query:', JSON.stringify(query, null, 2));  // Log the query to ensure it's correct

    return Pipe.updateMany(query, {
      $set: {
        MATERIAL_TYPE: 'Unknown',
        WATER_SERVICE_ADDRESS: 'Unknown',
        BUILDING_TYPE: 'Unknown',
        PIPE_DIAMETER: 0,
        INSTALLED_DATE: 'Unknown',
        line: 'Unknown',
      },
    });
  })
  .then(result => {
    console.log(`Update result:`, result);  // Log the result of the update operation
    console.log(`Updated ${result.nModified} documents with default values.`);
    mongoose.connection.close(); // Close the connection to MongoDB
  })
  .catch(err => {
    console.error('Error during migration:', err);
    mongoose.connection.close(); // Close the connection in case of an error
  });


