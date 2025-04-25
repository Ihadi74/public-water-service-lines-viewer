
async function fetchWaterBreaks() {
  try {
   const response = await fetch(
     "https://data.calgary.ca/resource/dpcu-jr23.json"
   );
   if (!response.ok) {
     throw new Error(`HTTP error! status: ${response.status}`);
   }

    const data = await response.json();

    data.forEach(breakInfo => {
      const marker = L.marker(breakInfo.point.coordinates.reverse()).addTo(map); // Reverse [lon, lat] to [lat, lon]
      marker.bindPopup(`
        <b>Break Date:</b> ${breakInfo.break_date} <br>
        <b>Break Type:</b> ${breakInfo.break_type} <br>
        <b>Status:</b> ${breakInfo.status}
      `);
    });
  } catch (error) {
    console.error('Error fetching water breaks:', error);
  }
}

// Fetch water breaks and populate the map
fetchWaterBreaks();

  