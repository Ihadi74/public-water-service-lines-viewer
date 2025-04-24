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
  const [address, setAddress] = useState("");
  const [mapCenter, setMapCenter] = useState({ lat: 51.0447, lng: -114.0719 });
  const [leakMarker, setLeakMarker] = useState(null);

  const [pipes, setPipes] = useState([]);

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

       console.log("Setting leakMarker:", {
         lat,
         lng,
         address: location.display_name,
       });

       setLeakMarker({
         lat,
         lng,
         address: location.display_name,
       });
     } else if (showAlert) {
       alert("No results found for this address in Calgary.");
       setLeakMarker(null);
     }
   } catch (err) {
     console.error("Geocoding error:", err);
     if (showAlert) alert("Failed to fetch location. Try again.");
   }
 };

 useEffect(() => {
   const delayDebounce = setTimeout(() => {
     if (address.trim().length >= 5) {
       handleSearchAddress(address, false);
     }
   }, 600);

   return () => clearTimeout(delayDebounce);
 }, [address]);


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
            leakMarker={leakMarker}
            setLeakMarker={setLeakMarker}
            setMapCenter={setMapCenter}
            address={address}
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
          />
        </div>
      </div>
    </>
  );
}

export default App;