import React, { useEffect, useState } from "react";
import axios from "axios";
import PipeMap from "./PipeMap";
import DisplayRecords from "./DisplayRecords";
import Filters from "./Filters";
//import Pagination from "./Pagination";
import Header from "./Header"

function App() {
  const [buildingType, setBuildingType] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [addressSearch, setAddressSearch] = useState("");

  const [pipes, setPipes] = useState([]);

  const [leakMarker, setLeakMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 51.0447, lng: -114.0719 }); // Default to Calgary

  // Handle search address
const handleSearchAddress = async (address, showAlert = true) => {
  if (!address || address.trim() === "") {
    if (showAlert) alert("Please enter a valid address.");
    return;
  }

  try {
    const query = encodeURIComponent(`${address}, Calgary`);
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}`,
    );

    if (response.data.length > 0) {
      const location = response.data[0];
      setLeakMarker({
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lon),
        address: location.display_name,
      });

      setMapCenter({ lat: location.lat, lng: location.lon }, 18);
    } else if (showAlert) {
      alert("No results found for this address in Calgary.");
    }
  } catch (err) {
    console.error("Geocoding error:", err);
    if (showAlert) alert("Failed to fetch location. Try again.");
  }
};

useEffect(() => {
  const delayDebounce = setTimeout(() => {
    if (addressSearch.trim().length < 5) return; // Only search after 5 characters
    handleSearchAddress(addressSearch);
  }, 600); // Wait 600ms after typing stops

  return () => clearTimeout(delayDebounce);
}, [addressSearch]);

  

  useEffect(() => {
    const fetchPipes = async () => {
      try {
        const response = await axios.get("http://localhost:5001/api/pipes", {
          params: {
            buildingType,
            materialType,
            address: addressSearch,
          },
        });
        setPipes(response.data.pipes);
      } catch (error) {
        console.error("Failed to fetch pipes:", error);
      }
    };

    fetchPipes();
  }, [buildingType, materialType, addressSearch]);

  return (
    <>
      <Header
        buildingType={buildingType}
        materialType={materialType}
        addressSearch={addressSearch}
      />

      <Filters
        setBuildingType={setBuildingType}
        setMaterialType={setMaterialType}
        setAddressSearch={setAddressSearch}
        handleSearchAddress={handleSearchAddress}
      />

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          padding: "20px",
          justifyContent: "space-between",
        }}
      >
        {/* Map and Table */}
        <div style={{ flex: "1 1 50%", minWidth: "40%" }}>
          <PipeMap pipes={pipes} leakMarker={leakMarker} mapCenter={mapCenter} />
        </div>

        <div
          style={{
            flex: "1 1 45%",
            overflowY: "auto",
          }}
        >
          <DisplayRecords
            buildingType={buildingType}
            materialType={materialType}
            addressSearch={addressSearch}
          />
        </div>
      </div>
    </>
  );
}

export default App;
