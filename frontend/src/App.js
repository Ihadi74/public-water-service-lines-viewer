// App.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import PipeMap from "./PipeMap";
import DisplayRecords from "./DisplayRecords";
import Filters from "./Filters";
import Header from "./Header";

function App() {
  const [buildingType, setBuildingType] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [addressSearch, setAddressSearch] = useState("");
  const [pipes, setPipes] = useState([]);
  const [selectedPipe, setSelectedPipe] = useState(null);

  // Function to handle address search
  const handleSearchAddress = (searchValue) => {
    setAddressSearch(searchValue);
    console.log("Searching for address:", searchValue);
  };

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
        {/* The Map container is exclusively in PipeMap.js */}
        <div style={{ flex: "1 1 50%", minWidth: "40%" }}>
          <PipeMap pipes={pipes} selectedPipe={selectedPipe} />
        </div>

        {/* The records table is rendered by DisplayRecords,
            which now receives an onRowClick callback */}
        <div style={{ flex: "1 1 45%", overflowY: "auto" }}>
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
