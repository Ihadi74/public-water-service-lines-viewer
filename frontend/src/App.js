import React, { useEffect, useState } from "react";
import axios from "axios";
import PipeMap from "./PipeMap";
import DisplayRecords from "./DisplayRecords";
import Filters from "./Filters";
//import Pagination from "./Pagination";
import Header from "./Header";

function App() {
  const [buildingType, setBuildingType] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [addressSearch, setAddressSearch] = useState("");

  const [pipes, setPipes] = useState([]);
  const [leakMarker, setLeakMarker] = useState(null);
  const [selectedPipe, setSelectedPipe] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 51.0447, lng: -114.0719 }); // Default to Calgary

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

  // Handle the address search (geocoding function)
  const handleSearchAddress = async (address, showAlert = true) => {
    if (!address || address.trim() === "") {
      if (showAlert) alert("Please enter a valid address.");
      return;
    }

    try {
      const query = encodeURIComponent(`${address}, Calgary`);
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
      );

      if (response.data.length > 0) {
        const location = response.data[0];
        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lon);

        setLeakMarker({ lat, lng, address: location.display_name });
        setMapCenter({ lat, lng });
      } else if (showAlert) {
        alert("No results found for this address in Calgary.");
      }
    } catch (err) {
      console.error("Geocoding error:", err);
     // if (showAlert) alert("Failed to fetch location. Try again.");
    }
  };

  // This function is called when a row is clicked in DisplayRecords.
  // It updates the selectedPipe state so that the map centers on that pipe's address.
  const handleRowClick = (pipe) => {
    setSelectedPipe(pipe);
    console.log("Row clicked:", pipe);
  };

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
        handleSearchAddress={handleSearchAddress} // Pass it down to Filters
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
        {/* The Map container is exclusively in PipeMap.js */}
        <div style={{ flex: "1 1 50%", minWidth: "40%" }}>
          <PipeMap
            pipes={pipes}
            selectedPipe={selectedPipe}
            leakMarker={leakMarker}
            mapCenter={mapCenter}
          />
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
            onRowClick={handleRowClick}
          />
        </div>
      </div>
    </>
  );
}

export default App;
