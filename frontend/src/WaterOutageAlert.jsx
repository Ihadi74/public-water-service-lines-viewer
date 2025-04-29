// In WaterOutageAlert.jsx

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

function WaterBreakAlert({ centerMapCallback }) {
  const [alertContent, setAlertContent] = useState("");
  const [outages, setOutages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Reset error on new fetch
      const response = await axios.get("http://localhost:5001/api/wateroutage");
      const data = response.data;

      // Now expects { content: ..., outages: [...] } which matches the updated backend
      setAlertContent(data.content || ""); // Use empty string if content is null/undefined
      setOutages(Array.isArray(data.outages) ? data.outages : []);
      setLoading(false);
    } catch (err) {
      console.error("Frontend fetch error:", err); // Log the actual error
      setError(err);
      // Set default state on error
      setAlertContent("Failed to load alert data.");
      setOutages([]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // --- handleOutageClick function remains the same, BUT ensure it uses the right field for name ---
  // Optional: handle a click to center your map on a given outage location.
  // Adjust this function based on how coordinates are returned.
  const handleOutageClick = (outage) => {
    let lat, lng;
    if (outage.lat && outage.lng) {
      lat = parseFloat(outage.lat);
      lng = parseFloat(outage.lng);
    } else if (outage.coordinates) {
      lng = parseFloat(outage.coordinates[0]);
      lat = parseFloat(outage.coordinates[1]);
    }
    // *** Use 'community' if that's the correct field name now ***
    const communityName = outage.community || outage.communityInfo || "Unknown Location"; // Fallback
    if (centerMapCallback && lat && lng) {
      centerMapCallback({ name: communityName, lat, lng });
    } else {
      console.log("Map center callback not provided or missing coordinates for", communityName);
    }
  };
  // --- End of handleOutageClick changes ---


  if (loading) {
    return <div>Loading water outage alert...</div>;
  }

  // Display fetch error if occurred
  if (error && !outages.length) { // Show specific error message if loading failed entirely
     return <div>Error fetching water outage alert: {error.message}</div>;
  }


  return (
    <div>
      <h2>Water Break Alert!</h2>
      {/* Display alertContent fetched from API */}
      <div>{alertContent || "No alert data available."}</div>

      <h3>Outage Details</h3>
      {outages.length > 0 ? (
        outages.map((outage) => ( // Use outage._id for key if available and unique
          <div
            key={outage._id || outage.community + outage.updatedTime} // Use a more reliable key
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              margin: "10px 0",
            }}
          >
            {/* *** Use updated field names *** */}
            <h4>{outage.community}</h4> {/* Changed from communityInfo */}
             <p>
              <strong>Updated:</strong> {outage.updatedTime}
            </p>
            <p>
              <strong>Priority:</strong> {outage.priority}
            </p>
            <p>
              <strong>Status:</strong> {outage.currentStatus} {/* Changed from status */}
            </p>
            {/* Removed breakDetails as it wasn't in the updated schema */}
            {outage.repairLocation && (
              <p>
                <strong>Repair Location:</strong> {outage.repairLocation}
              </p>
            )}
             {outage.repairCompletion && (
              <p>
                <strong>Est. Completion:</strong> {outage.repairCompletion}
              </p>
            )}
            {outage.waterWagonInfo && ( // Changed from waterWagon
              <p>
                <strong>Water Wagon:</strong> {outage.waterWagonInfo}
              </p>
            )}
            {/* Check for coordinates logic remains similar */}
            {(outage.lat && outage.lng) || outage.coordinates ? (
              <button onClick={() => handleOutageClick(outage)}>
                 {/* Use updated field name */}
                Center Map on {outage.community || "Location"}
              </button>
            ) : null}
          </div>
        ))
      ) : (
        // Show specific message if API returned content but no outages
        <p>{loading ? "Loading..." : "No current outage details found."}</p>
      )}
    </div>
  );
}

export default WaterBreakAlert;