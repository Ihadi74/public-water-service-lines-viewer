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

  // Function to handle address search
  const handleSearchAddress = (searchValue) => {
    setAddressSearch(searchValue); // Update the state
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
        handleSearchAddress={handleSearchAddress} // Fixed: Passing the function here
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
          <PipeMap pipes={pipes} />
        </div>

        <div style={{ flex: "1 1 45%", overflowY: "auto" }}>
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