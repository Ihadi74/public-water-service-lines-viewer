import React from "react";

function Filters({
  setBuildingType,
  setMaterialType,
  setAddressSearch,
  handleSearchAddress,
  address,
  setAddress,
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

      {/* Search Button */}
      <button onClick={handleSearchAddress} style={{ padding: "6px 12px" }}>
        Search
      </button>
    </div>
  );
}

export default Filters;
