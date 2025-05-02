// WaterOutageAlert.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

function WaterOutageAlert({ map = null, id = "unknown" }) {
  const [alertContent, setAlertContent] = useState("");
  const [outages, setOutages] = useState([]);
  const [communityData, setCommunityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add console log on mount to show which instance is rendering
  useEffect(() => {
    console.log(`WaterOutageAlert (ID: ${id}) mounted. Has map: ${!!map}`);
    return () => console.log(`WaterOutageAlert (ID: ${id}) unmounted`);
  }, [id, map]);

  // --- Fetching logic remains the same ---
  const fetchData = useCallback(async () => {
    if (outages.length === 0) setLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://localhost:5001/api/wateroutage");
      const data = response.data;
      setAlertContent(data.content || "No alert summary available.");
      setOutages(Array.isArray(data.outages) ? data.outages : []);
    } catch (err) { console.error(`[Alert ${id}] Fetch error:`, err); setError(err); setAlertContent("Failed to load alert data."); }
    finally { if (loading) setLoading(false); }
  }, [loading, outages.length, id]);

  const fetchCommunityData = useCallback(async () => {
    try {
      const response = await axios.get("https://data.calgary.ca/resource/j9ps-fyst.json");
      setCommunityData(response.data);
    } catch (err) { console.error("Error fetching community data:", err); }
  }, []);

  useEffect(() => {
    fetchData(); fetchCommunityData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData, fetchCommunityData]);

  // --- Coordinate lookup remains the same ---
  const getCommunityCoordinates = useCallback((searchName) => {
    if (!searchName || communityData.length === 0) return null;
    const record = communityData.find(rec => rec.name && rec.name.toLowerCase() === searchName.toLowerCase());
    if (record) {
      if (record.point?.coordinates?.length === 2) {
        const lat = parseFloat(record.point.coordinates[1]); const lng = parseFloat(record.point.coordinates[0]);
        if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
      } else if (record.latitude && record.longitude) {
        const lat = parseFloat(record.latitude); const lng = parseFloat(record.longitude);
        if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
      }
    }
    return null;
  }, [communityData]);

  // --- Click Handlers remain the same ---
  const handleOutageClick = useCallback((outage) => {
    // Verify map is available
    if (!map || typeof map.setView !== 'function') {
      console.error(`[Alert ${id}] Map instance not available or not fully initialized in WaterOutageAlert.`);
      return;
    }

    const communityName = outage.community || outage.name || "Unknown Location";
    let coords = null;
    coords = getCommunityCoordinates(communityName); // Try community first
    if (!coords) { // Fallback to outage data
      let lat, lng;
      if (outage.latitude && outage.longitude) { lat = parseFloat(outage.latitude); lng = parseFloat(outage.longitude); }
      else if (outage.lat && outage.lng) { lat = parseFloat(outage.lat); lng = parseFloat(outage.lng); }
      else if (outage.coordinates?.length === 2) { lng = parseFloat(outage.coordinates[0]); lat = parseFloat(outage.coordinates[1]); }
      if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) { coords = { lat, lng }; }
    }

    if (coords) {
      try {
        console.log(`[Alert ${id}] Centering map on ${communityName} at [${coords.lat}, ${coords.lng}], zoom 14`);
        map.setView([coords.lat, coords.lng], 14, { animate: true, duration: 1 });
      } catch (err) {
        console.error(`[Alert ${id}] Error setting map view:`, err);
      }
    } else { console.error(`[Alert ${id}] Could not determine valid coordinates for outage:`, outage); }
  }, [getCommunityCoordinates, map, id]);

  const handleAlertBoxClick = useCallback(() => {
    if (outages.length > 0) {
      const outageToCenter = outages.find((o) => o.community || o.name) || outages[0];
      handleOutageClick(outageToCenter);
    }
  }, [outages, handleOutageClick]);

  // --- Loading indicator now at the bottom ---
  if (loading && outages.length === 0) {
     return <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 1001, background: 'white', padding: '5px', borderRadius: '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>Loading alerts...</div>;
  }
  if (error && outages.length === 0) {
     console.error("Not rendering WaterOutageAlert due to fetch error and no data.");
     return null;
  }

  // Main component rendering - SCROLLABLE ROW WITH RED BACKGROUND AND BLACK BORDER
  return (
    <div style={{
        position: 'relative',
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '12px 16px',
     }}>
      {/* Alert Banner */}
      <div
        onClick={handleAlertBoxClick}
        style={{ 
          cursor: outages.length > 0 ? "pointer" : "default", 
          borderBottom: '1px solid #000', // Black border at bottom
          marginBottom: '10px', 
          paddingBottom: '8px',
          display: 'flex',
          alignItems: 'center'
        }}
        title={outages.length > 0 ? "Click to center map on the first alert" : "Water Break Alert"}
      >
        <strong style={{ marginRight: '5px', whiteSpace: 'nowrap' }}>Water Alert:</strong>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {alertContent || (loading ? "Checking..." : "No summary")}
        </span>
      </div>

      {/* Outage Details Section - SCROLLABLE ROW WITH RED BACKGROUND AND BLACK BORDER */}
      {outages.length > 0 && (
        <div style={{ 
          display: "flex", 
          flexDirection: "row", 
          flexWrap: "nowrap", 
          gap: "12px", // Increased spacing between cards
          width: "max-content", // Allow container to grow beyond parent width
          minWidth: "100%", // At minimum, take up full parent width
        }}>
          {outages.map((outage, index) => (
            <div
              key={outage._id || `${outage.community || outage.name || 'unknown'}-${index}`}
              onClick={() => handleOutageClick(outage)}
              style={{ 
                border: "1px solid #000", // Black border
                borderRadius: '4px', 
                padding: "12px", // Increased padding
                cursor: "pointer", 
                flex: "0 0 auto",
                width: "200px", // Fixed width for each card
                backgroundColor: '#ffdddd', // Light red background
                fontSize: '0.9em',
                height: '120px', // Fixed height
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)' // Subtle shadow for depth
              }}
              title={`Click to center map on ${outage.community || outage.name || 'this location'}`}
            >
              <h4 style={{ 
                margin: 0, 
                marginBottom: '5px',
                fontSize: '1em',
                color: '#800000', // Darker red for heading
                fontWeight: 'bold'
              }}>
                {outage.community || outage.name || 'Unknown Location'}
              </h4>
              <div style={{flex: '1 0 auto'}}>
                <p style={{ margin: "3px 0" }}>
                  <strong>Updated:</strong> {outage.updatedTime || 'N/A'}
                </p>
                <p style={{ margin: "3px 0" }}>
                  <strong>Priority:</strong> {outage.priority || 'N/A'}
                </p>
                <p style={{ margin: "3px 0" }}>
                  <strong>Status:</strong> {outage.currentStatus || 'N/A'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* No outages message */}
      {!loading && outages.length === 0 && !error && (
         <p style={{margin: '0', fontSize: '0.9em', color: '#555'}}>No current outage details found.</p>
      )}
    </div>
  );
}

export default WaterOutageAlert;
