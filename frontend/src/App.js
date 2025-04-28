import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
import Filters from './Filters';
import PipeMap from './PipeMap';
import DisplayRecords from './DisplayRecords';
import NotificationButton from './NotificationButton';
import WaterOutageAlert from './WaterOutageAlert';

function App() {
  // State variables for filters and data management
  const [buildingType, setBuildingType] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [addressSearch, setAddressSearch] = useState("");
  const [pipes, setPipes] = useState([]);
  const [address, setAddress] = useState("");
  const [leakMarker, setLeakMarker] = useState(null);
  const [selectedPipe, setSelectedPipe] = useState(null);

  // Handler for triggering an address search
  const handleSearchAddress = () => {
    console.log("Searching for address:", address);
  };

  // Effect to fetch pipes whenever filters change
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

    // Cleanup: log component unmounting if necessary
    return () => {
      console.log("Cleaning up pipes fetching...");
    };
  }, [buildingType, materialType, addressSearch]);

  return (
    <div>
      {/* Header and Filters */}
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

      {/* Main Content Area */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          padding: "20px",
          justifyContent: "space-between",
        }}
      >
        {/* Pipe Map */}
        <div style={{ flex: "1 1 50%", minWidth: "40%" }}>
          <PipeMap
            pipes={pipes}
            leakMarker={leakMarker}
            setLeakMarker={setLeakMarker}
            address={address}
            selectedPipe={selectedPipe}
            setSelectedPipe={setSelectedPipe}
          />
        </div>

        {/* Display Records */}
        <div style={{ flex: "1 1 45%", overflowY: "auto" }}>
          <DisplayRecords
            buildingType={buildingType}
            materialType={materialType}
            addressSearch={addressSearch}
            selectedPipe={selectedPipe}
            setSelectedPipe={setSelectedPipe}
          />
        </div>

        {/* Notification Button */}
        <NotificationButton />
      </div>

      {/* Water Outage Alert Section */}
      <div
        style={{
          padding: "20px",
          borderTop: "1px solid #ccc",
          marginTop: "20px",
        }}
      >
        <WaterOutageAlert />
      </div>
    </div>
  );
}

export default App;
