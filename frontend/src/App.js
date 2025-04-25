import React, { useEffect, useState } from "react";
import axios from "axios";
import PipeMap from "./PipeMap";
import DisplayRecords from "./DisplayRecords";
import Filters from "./Filters";
import Header from "./Header";
import NotificationButton from "./NotificationButton";

function App() {
  const [buildingType, setBuildingType] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [addressSearch, setAddressSearch] = useState("");

  const [pipes, setPipes] = useState([]);
  const [address, setAddress] = useState("");
  const [leakMarker, setLeakMarker] = useState(null); // Added state for leakMarker

  const handleSearchAddress = () => {
    console.log("Searching for address:", address);
    // Implement search logic if needed
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

    // Cleanup function (if needed)
    return () => {
      console.log("Component unmounted, cleanup here!");
    };
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
        setAddress={setAddress}
        address={address}
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
          <PipeMap
            pipes={pipes}
            leakMarker={leakMarker} // Pass the leakMarker state
            setLeakMarker={setLeakMarker} // Pass the setLeakMarker function
            address={address}
          />
        </div>

        <div style={{ flex: "1 1 45%", overflowY: "auto" }}>
          <DisplayRecords
            buildingType={buildingType}
            materialType={materialType}
            addressSearch={addressSearch}
          />
        </div>
        <NotificationButton/>
      </div>
    </>
  );
}

export default App;