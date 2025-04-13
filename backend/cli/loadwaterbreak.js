// backend/cli/loadwaterbreak.js

const path = require("path");

// Use Node.js 18+ built-in fetch (remove node-fetch since it's not needed)
async function processWaterBreakData() {
  try {
    // Dynamically import the db.js module using an absolute URL derived from __dirname
    const dbModule = await import(new URL(path.join(__dirname, "../db.js"), "file://"));
    // Destructure the needed functions from the imported module.
    const { disconnectDb, createWaterBreak, findWaterBreakByCoordinates } = dbModule;

    // Fetch data from Calgary's API using Node 18+'s built-in fetch()
    const response = await fetch("https://data.calgary.ca/resource/dpcu-jr23.json");
    if (!response.ok) {
      throw new Error(`Problem fetching data: ${response.statusText}`);
    }
    const waterBreaks = await response.json();

    // Process all water break records concurrently with Promise.all()
    await Promise.all(
      waterBreaks.map(async (breakData) => {
        const { point, break_date, break_type, status } = breakData;

        // Skip incomplete records
        if (!point || !break_date || !break_type || !status) {
          console.warn("Skipping incomplete data:", breakData);
          return;
        }

        try {
          // Find an existing water break at the same coordinates
          const existingBreak = await findWaterBreakByCoordinates(point.coordinates);

          if (existingBreak) {
            console.log("Updating existing water break at:", point.coordinates);
            await existingBreak.updateOne({
              break_date: new Date(break_date),
              break_type: break_type,
              status: status,
              point,
            });
          } else {
            console.log("Creating new water break at:", point.coordinates);
            await createWaterBreak({
              break_date: new Date(break_date),
              break_type,
              status,
              point,
            });
          }
        } catch (error) {
          console.error("Error processing water break:", error);
        }
      })
    );

    await disconnectDb();
    console.log("Finished processing water break data!");
  } catch (error) {
    console.error("An error occurred:", error);
    process.exit(1);
  }
}

// Execute the async function
processWaterBreakData();






