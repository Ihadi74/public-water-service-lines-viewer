import React from "react";

function Filters({
  setBuildingType,
  setMaterialType,
  setAddressSearch,
  handleSearchAddress,
  address,
  setAddress,
  // Add these new props to handle map centering
  setLeakMarker,
  setMapCenter,
}) {
  // Update the selectStyle to match input heights
  const selectStyle = {
    padding: "6px 10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    height: "38px", // Fixed height
    boxSizing: "border-box" // Include padding in height calculation
  };

  const inputStyle = {
    padding: "6px 10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    height: "38px", // Same fixed height
    boxSizing: "border-box" // Include padding in height calculation
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);
    
    // Always update addressSearch, even when empty
    setAddressSearch(value.trim());
  };

  // Enhanced search function to geocode, place marker and center map
  const handleEnhancedSearch = async () => {
    // Call the original search function to filter data
    handleSearchAddress();
    
    // If address is provided, try to geocode and center map
    if (address && address.trim()) {
      try {
        // Use OpenStreetMap's Nominatim for geocoding
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}, Calgary, AB, Canada&limit=1`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          
          // Create a leak marker at the geocoded location
          if (setLeakMarker) {
            setLeakMarker({
              lat: lat,
              lng: lng,
              address: address,
              fromSearch: true, // Flag to indicate this is from search
            });
          }
          
          // Center the map on the found location with zoom level 16
          if (setMapCenter) {
            setMapCenter({
              lat: lat,
              lng: lng,
              zoom: 16
            });
          }
          
          console.log(`Address geocoded to: ${lat},${lng}`);
        } else {
          console.warn("No results found for the address");
          alert("Address not found. Please try a different address.");
        }
      } catch (error) {
        console.error("Error geocoding address:", error);
        alert("Error searching for address. Please try again.");
      }
    }
  };

  return (
    <div style={{
      display: "flex",
      gap: "15px",
      margin: "20px 0", // Remove horizontal margins
      padding: "15px",
      alignItems: "flex-end",
      flexWrap: "nowrap",
      width: "100%",
      boxSizing: "border-box",
      backgroundColor: "#f5f5f5", // Light grey background
      borderRadius: "8px"
    }}>
      {/* Building Type Filter */}
      <div style={{ 
        width: "20%",
        backgroundColor: "#e0e0e0", // Added grey background
        padding: "10px",
        borderRadius: "6px",
        boxSizing: "border-box"
      }}>
        <label style={{ 
          display: "block", 
          marginBottom: "6px", 
          fontSize: "1.5em",
          fontWeight: "bold"
        }}>
          Building Type
        </label>
        <select
          style={{...selectStyle, width: "100%", maxWidth: "100%" }}
          onChange={(e) => setBuildingType(e.target.value)}
        >
          <option value="">All</option>
          <option value="Single Family">Single Family</option>
          <option value="Triplex">Triplex</option>
          <option value="Duplex">Duplex</option>
          <option value="Commercial">Commercial</option>
        </select>
      </div>

      {/* Material Type Filter */}
      <div style={{ 
        width: "26%",  // Increased slightly from 25%
        backgroundColor: "#e0e0e0", 
        padding: "10px",
        borderRadius: "6px",
        boxSizing: "border-box"
      }}>
        <label style={{ 
          display: "block", 
          marginBottom: "6px", 
          fontSize: "1.5em",
          fontWeight: "bold"
        }}>
          Material Type
        </label>
        <select
          style={{...selectStyle, width: "100%", maxWidth: "100%" }}
          onChange={(e) => setMaterialType(e.target.value)}
        >
          <option value="">All</option>
          <option value="Copper">Copper</option>
          <option value="Cross-linked Polyethylene (PEX)">
            Cross-linked Polyethylene (PEX)
          </option>
          <option value="Lead">Lead</option>
        </select>
      </div>

      {/* Address Filter with integrated search button */}
      <div style={{ 
        width: "49%",  // Increased from 42% to fill remaining space
        backgroundColor: "#e0e0e0", 
        padding: "10px",
        borderRadius: "6px",
        boxSizing: "border-box"
      }}>
        <label style={{ 
          display: "block", 
          marginBottom: "6px", 
          fontSize: "1.5em",
          fontWeight: "bold"
        }}>
          Address Search
        </label>
        <div style={{ position: "relative", width: "100%" }}>
          <input
            type="text"
            placeholder="Enter address"
            value={address}
            onChange={handleAddressChange}
            onKeyPress={(e) => e.key === 'Enter' && handleEnhancedSearch()}
            style={{
              ...inputStyle, 
              width: "100%",
              paddingRight: "40px"
            }}
          />
          <button 
            onClick={handleEnhancedSearch}
            style={{
              position: "absolute",
              right: "4px",
              top: "4px",
              bottom: "4px",
              padding: "0 10px",
              borderRadius: "4px",
              backgroundColor: "#0078d7",
              color: "white",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            🔍
          </button>
        </div>
      </div>
    </div>
  );
}

export default Filters;
