import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

function WaterOutageAlert({ centerMapCallback }) {
  const [alertContent, setAlertContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [communities, setCommunities] = useState([]);

  // Fetch outage alert data from your backend endpoint
  const fetchAlert = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5001/api/water-outage");
      setAlertContent(response.data.content);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch community data from Calgary's open data API
  const fetchCommunities = useCallback(async () => {
    try {
      const response = await axios.get("https://www.calgary.ca/water/customer-service/water-outages.html");
      console.log(response.data);
      
      setCommunities(response.data);
    } catch (err) {
      console.error("Error fetching community data:", err);
    }
  }, []);

  useEffect(() => {
    fetchAlert();
    const alertInterval = setInterval(fetchAlert, 5 * 60 * 1000); // refresh every 5 minutes
    return () => clearInterval(alertInterval);
  }, [fetchAlert]);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  // Filter communities using case-insensitive match on name
  const matchedCommunities = alertContent
    ? communities.filter((comm) =>
        comm.name && alertContent.toLowerCase().includes(comm.name.toLowerCase())
      )
    : [];

  // Use regex to extract potential Calgary addresses from the alert text.
  // This example looks for a number, followed by street words and "Calgary" (optionally with province AB).
  const addressRegex = /(\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr)[^,]*,\s*Calgary(?:,?\s*AB)?)/gi;
  const extractedAddresses = alertContent
    ? Array.from(new Set(alertContent.match(addressRegex) || []))
    : [];

  // Handle community button click—use provided coordinates (or fallback fields) to center the map
  const handleCommunityClick = (community) => {
    let lat, lng;
    if (community.point && community.point.coordinates) {
      // Open data typically provides point as [lng, lat]
      lng = parseFloat(community.point.coordinates[0]);
      lat = parseFloat(community.point.coordinates[1]);
    } else if (community.latitude && community.longitude) {
      lat = parseFloat(community.latitude);
      lng = parseFloat(community.longitude);
    }
    if (centerMapCallback && lat && lng) {
      centerMapCallback({ name: community.name, lat, lng });
    } else {
      console.log("Invalid coordinates or missing callback for community:", community.name);
    }
  };

  // Geolocate an extracted address using the Nominatim API
  const handleAddressClick = async (address) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      if (response.data && response.data.length > 0) {
        const lat = parseFloat(response.data[0].lat);
        const lng = parseFloat(response.data[0].lon);
        if (centerMapCallback) {
          centerMapCallback({ name: address, lat, lng });
        }
      } else {
        console.error("No location found for address:", address);
      }
    } catch (err) {
      console.error("Error geolocating address:", err);
    }
  };

  if (loading) {
    return <div>Loading water outage information...</div>;
  }

  if (error) {
    return <div>Error fetching water outage information: {error.message}</div>;
  }

  return (
    <div>
      <h2>Water Outage Alert</h2>
      <div>{alertContent || "No alert data available."}</div>

      {/* Render buttons for matched communities */}
      {matchedCommunities.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <h3>Center Map on Community:</h3>
          {matchedCommunities.map((community) => (
            <button
              key={community.comm_code || community.name}
              onClick={() => handleCommunityClick(community)}
              style={{
                margin: "0 5px",
                padding: "5px 10px",
                cursor: "pointer"
              }}
            >
              {community.name}
            </button>
          ))}
        </div>
      )}

      {/* Render buttons for extracted potential addresses */}
      {extractedAddresses.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <h3>Geolocate Address:</h3>
          {extractedAddresses.map((address, index) => (
            <button
              key={index}
              onClick={() => handleAddressClick(address)}
              style={{
                margin: "0 5px",
                padding: "5px 10px",
                cursor: "pointer"
              }}
            >
              {address}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default WaterOutageAlert;
