import React from "react";
import "./App.css";

function Filters({ setBuildingType, setMaterialType, setAddressSearch, handleSearchAddress }) {
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
  const handleChange = (e) => {
    const value = e.target.value;
    setAddressSearch(value);
    handleSearchAddress(value); // Trigger the address search handler
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
          <option value="Multi Family">Multi Family</option>
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
          <option value="PVC">PVC</option>
          <option value="Lead">Lead</option>
        </select>
      </label>

      {/* Address Filter */}
      <label>
        Address Search:{" "}
        <input
          type="text"
          placeholder="Enter address"
          onChange={handleChange}
          style={inputStyle}
        />
      </label>
    </div>
  );
}

export default Filters;
