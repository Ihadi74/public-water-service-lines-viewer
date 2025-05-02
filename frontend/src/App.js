import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
import Filters from './Filters';
import PipeMap from './PipeMap';
import DisplayRecords from './DisplayRecords';
import NotificationButton from './NotificationButton';
import WaterOutageAlert from './WaterOutageAlert'; // Import WaterOutageAlert

// Add this helper function before the useEffect
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  // Split at 'T' and return only the date part
  return dateString.split('T')[0];
};

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
    setAddressSearch(address.trim());
    
    // When address is searched, clear any previously selected pipe
    // to focus on the new address marker
    setSelectedPipe(null);
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
    <div style={{ 
      maxWidth: '100vw', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
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
        setMapCenter={setMapCenter}
      />

      {/* Main Content Area */}
      <div
        style={{
          display: "flex",
          flex: "1 1 auto",
          flexWrap: "wrap",
          gap: "20px",
          padding: "20px",
          justifyContent: "space-between",
          width: "100%",
          boxSizing: "border-box",
          minHeight: 0,
        }}
      >
        {/* Pipe Map */}
        <div style={{
          flex: "1 1 50%",
          minWidth: "300px",
          maxWidth: "100%",
          minHeight: "400px",
          height: "100%",
          boxSizing: "border-box",
          overflow: "hidden"
        }}>
          <PipeMap
            pipes={pipes}
            leakMarker={leakMarker}
            setLeakMarker={setLeakMarker}
            address={address}
            selectedPipe={selectedPipe}
            setSelectedPipe={setSelectedPipe}
            setMapInstance={setMapInstance}
            mapCenter={mapCenter}
            formatDate={formatDate} // Add this line
          />
        </div>

        {/* Display Records */}
        <div style={{
          flex: "1 1 45%",
          minWidth: "300px",
          maxWidth: "100%",
          overflowY: "auto",
          overflowX: "hidden",
          height: "100%",
          boxSizing: "border-box",
          wordBreak: "break-word",
          whiteSpace: "pre-line"
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

      {/* Water Outage Alert - sticky footer */}
      {mapInstance && (
        <WaterOutageAlert 
          map={mapInstance} 
          id="page-alert" 
          setLeakMarker={setLeakMarker}
          setMapCenter={setMapCenter}
        />
      )}
    </div>
  );
}

export default App;
