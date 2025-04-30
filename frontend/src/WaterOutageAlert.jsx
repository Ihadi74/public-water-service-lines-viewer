// WaterOutageAlert.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

function WaterOutageAlert({ centerMapCallback = (loc) => console.log("Default centerMapCallback", loc) }) {
  const [alertContent, setAlertContent] = useState("");
  const [outages, setOutages] = useState([]);
  const [communityData, setCommunityData] = useState([]); // Community dataset from Calgary
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch outage alert data.
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("http://localhost:5001/api/wateroutage");
      const data = response.data;
      // Data expected to be: { content, outages: [...] }
      setAlertContent(data.content || "");
      setOutages(Array.isArray(data.outages) ? data.outages : []);
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err);
      setAlertContent("Failed to load alert data.");
      setOutages([]);
      setLoading(false);
    }
  }, []);

  // Fetch community dataset from Calgary.
  const fetchCommunityData = useCallback(async () => {
    try {
      const response = await axios.get("https://data.calgary.ca/resource/j9ps-fyst.json");
      setCommunityData(response.data);
      console.log("Community data fetched:", response.data.length, "records");
    } catch (err) {
      console.error("Error fetching community data:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchCommunityData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData, fetchCommunityData]);

  // Lookup community coordinates (using the "name" field from the dataset).
  const getCommunityCoordinates = (searchName) => {
    if (!searchName || communityData.length === 0) return null;
    const record = communityData.find(
      (rec) => rec.name && rec.name.toLowerCase() === searchName.toLowerCase()
    );
    if (record) {
      if (record.point && record.point.coordinates) {
        return {
          lat: parseFloat(record.point.coordinates[1]),
          lng: parseFloat(record.point.coordinates[0]),
        };
      } else if (record.latitude && record.longitude) {
        return {
          lat: parseFloat(record.latitude),
          lng: parseFloat(record.longitude),
        };
      }
    }
    return null;
  };

  const handleOutageClick = (outage) => {
    const communityName = outage.community || outage.name || "Unknown Location";
    console.log("Outage clicked for:", communityName);
    const communityCoords = getCommunityCoordinates(communityName);
    if (communityCoords) {
      console.log("Found community coordinates:", communityCoords);
      centerMapCallback({ name: communityName, ...communityCoords });
    } else {
      console.warn("No matching community record found for", communityName);
      // Fallback: use outage's own coordinates.
      let lat, lng;
      if (outage.lat && outage.lng) {
        lat = parseFloat(outage.lat);
        lng = parseFloat(outage.lng);
      } else if (outage.coordinates) {
        lng = parseFloat(outage.coordinates[0]);
        lat = parseFloat(outage.coordinates[1]);
      }
      if (lat && lng) {
        console.log("Falling back to outage coordinates:", { lat, lng });
        centerMapCallback({ name: communityName, lat, lng });
      } else {
        console.error("Missing coordinates for", communityName);
      }
    }
  };

  const handleAlertBoxClick = () => {
    if (outages.length > 0) {
      const outage = outages.find((o) => o.community || o.name) || outages[0];
      if (outage) {
        console.log("Main alert box clicked, using outage:", outage);
        handleOutageClick(outage);
      }
    }
  };

  if (loading) {
    return <div>Loading water outage alert...</div>;
  }

  if (error && outages.length === 0) {
    return <div>Error fetching water outage alert: {error.message}</div>;
  }

  return (
    <div style={{ maxWidth: "100%", margin: "0 auto", padding: "0 15px" }}>
      <div
        onClick={handleAlertBoxClick}
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          padding: "10px",
          margin: "10px 0",
          border: "1px solid #ccc",
          cursor: "pointer",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          width: "100%",
        }}
      >
        <h2 style={{ margin: "0 10px 0 0" }}>Water Break Alert!</h2>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span>{alertContent || "No alert data available."}</span>
        </div>
      </div>

      <h3>Outage Details</h3>
      <div style={{ maxWidth: "100%", margin: "0 auto", overflowX: "auto" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "nowrap",
            paddingBottom: "10px",
          }}
        >
          {outages.length > 0 ? (
            outages.map((outage) => (
              <div
                key={outage._id || (outage.community || outage.name) + outage.updatedTime}
                onClick={() => handleOutageClick(outage)}
                style={{
                  border: "1px solid #ccc",
                  padding: "10px",
                  marginRight: "10px",
                  cursor: "pointer",
                  flex: "0 0 auto",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                <h4 style={{ margin: 0 }}>{outage.community || outage.name}</h4>
                <p style={{ margin: "5px 0" }}>
                  <strong>Updated:</strong> {outage.updatedTime}
                </p>
                <p style={{ margin: "5px 0" }}>
                  <strong>Priority:</strong> {outage.priority}
                </p>
                <p style={{ margin: "5px 0" }}>
                  <strong>Status:</strong> {outage.currentStatus}
                </p>
              </div>
            ))
          ) : (
            <p>{loading ? "Loading..." : "No current outage details found."}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default WaterOutageAlert;
