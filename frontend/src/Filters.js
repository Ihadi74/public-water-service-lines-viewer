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
  const styleFilters = {
    display: "flex",
    gap: "20px",
    margin: "20px",
    alignItems: "center",
    flexWrap: "wrap",
  };

  const selectStyle = {
    padding: "6px 10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  };

  const inputStyle = {
    padding: "6px 10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    minWidth: "200px",
  };

  const handleAddressChange = (e) => {
    const value = e.target.value.trim();
    setAddress(value);
    if (value.length > 0) {
      setAddressSearch(value);
    }
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
    <div style={styleFilters}>
      {/* Building Type Filter */}
      <label>
        Building Type:{" "}
        <select
          style={selectStyle}
          onChange={(e) => setBuildingType(e.target.value)}
        >
          <option value="">All</option>
          <option value="Single Family">Single Family</option>
          <option value="Triplex">Triplex</option>
          <option value="Duplex">Duplex</option>
          <option value="Commercial">Commercial</option>
        </select>
      </label>

      <label>
        Material Type:{" "}
        <select
          style={selectStyle}
          onChange={(e) => setMaterialType(e.target.value)}
        >
          <option value="">All</option>
          <option value="Copper">Copper</option>
          <option value="Cross-linked Polyethylene (PEX)">
            Cross-linked Polyethylene (PEX)
          </option>
          <option value="Lead">Lead</option>
        </select>
      </label>

      {/* Address Filter */}
      <label>
        Address Search:{" "}
        <input
          type="text"
          placeholder="Enter address"
          value={address}
          onChange={handleAddressChange}
          style={inputStyle}
        />
      </label>

      {/* Search Button - Use the enhanced search function */}
      <button onClick={handleEnhancedSearch} style={{ padding: "6px 12px" }}>
        Search
      </button>
    </div>
  );
}

export default Filters;
