import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
import Filters from './Filters';
import PipeMap from './PipeMap';
import DisplayRecords from './DisplayRecords';
import NotificationButton from './NotificationButton';
import WaterOutageAlert from './WaterOutageAlert'; // Import WaterOutageAlert

function App() {
  // State variables for filters and data management
  const [buildingType, setBuildingType] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [addressSearch, setAddressSearch] = useState("");
  const [pipes, setPipes] = useState([]);
  const [address, setAddress] = useState("");
  const [leakMarker, setLeakMarker] = useState(null);
  const [selectedPipe, setSelectedPipe] = useState(null);
  
  // Add state for map instance
  const [mapInstance, setMapInstance] = useState(null);
  const [mapCenter, setMapCenter] = useState(null); // Add state for map center

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
    <div style={{ maxWidth: '100%', overflowX: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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
        setLeakMarker={setLeakMarker}
        setMapCenter={setMapCenter} // Pass the setMapCenter function
      />

      {/* Main Content Area */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          padding: "20px",
          justifyContent: "space-between",
          maxWidth: "100%",
          flex: "1 0 auto", // Allow this area to grow but not shrink
        }}
      >
        {/* Pipe Map */}
        <div style={{ 
          flex: "1 1 50%", 
          minWidth: "300px",
          maxWidth: "100%"
        }}>
          <PipeMap
            pipes={pipes}
            leakMarker={leakMarker}
            setLeakMarker={setLeakMarker}
            address={address}
            selectedPipe={selectedPipe}
            setSelectedPipe={setSelectedPipe}
            setMapInstance={setMapInstance} // Pass the setter function
            mapCenter={mapCenter} // Pass the mapCenter state
          />
        </div>

        {/* Display Records */}
        <div style={{ 
          flex: "1 1 45%", 
          minWidth: "300px",
          maxWidth: "100%",
          overflowY: "auto",
          overflowX: "hidden"
        }}>
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

      {/* Water Outage Alert - scrollable width */}
      {mapInstance && (
        <div style={{ 
          width: '100%',
          padding: '0',
          marginTop: 'auto',
          borderTop: '1px solid #ccc',
          backgroundColor: '#f8f8f8',
          height: 'auto',
          minHeight: '150px', // Set a minimum height
          maxHeight: '180px', // Set a maximum height
          overflowX: 'auto', // Enable horizontal scrolling
          overflowY: 'hidden' // Prevent vertical scrolling
        }}>
          <WaterOutageAlert map={mapInstance} id="page-alert" />
        </div>
      )}
    </div>
  );
}

export default App;
