// ParentComponent.jsx
import React, { useState } from "react";
import WaterOutageAlert from "./WaterOutageAlert"; // Notice the file name
import PipeMap from "./PipeMap";

const ParentComponent = () => {
  const [alertCenter, setAlertCenter] = useState(null);

  // A proper callback that updates state (or triggers map recenter logic)
  const centerMapCallback = (location) => {
    console.log("Centering map to:", location);
    setAlertCenter({ lat: location.lat, lng: location.lng });
    // You can add additional logic here (e.g. triggering a police marker)
  };

  // Dummy data (adjust as needed)
  const pipes = [];
  const selectedPipe = null;
  const leakMarker = null;
  const policeMarker = null;

  return (
    <div>
      {/* IMPORTANT: Pass the centerMapCallback prop here */}
      <WaterOutageAlert centerMapCallback={centerMapCallback} />

      
      {/* PipeMap now receives the alertCenter which can be used to recenter the map */}
      <PipeMap
        pipes={pipes}
        selectedPipe={selectedPipe}
        setSelectedPipe={() => {}}
        leakMarker={leakMarker}
        setLeakMarker={() => {}}
        alertCenter={alertCenter}
        policeMarker={policeMarker}
      />
    </div>
  );
};

export default ParentComponent;
