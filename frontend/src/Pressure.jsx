import React, { useEffect, useState } from 'react';
import { Polygon, Tooltip } from 'react-leaflet';

// Helper function to parse MultiPolygon data (assumes a GeoJSON-like structure)
function parseMultiPolygon(multiPolygon) {
    if (!multiPolygon || multiPolygon.type !== 'MultiPolygon') return [];
    return multiPolygon.coordinates.map((polygon) =>
        polygon[0].map((point) => [point[1], point[0]]) // Convert [lng, lat] to [lat, lng]
    );
}

// Helper function to generate a random hex color for styling polygons
function generateRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
const Pressure = ({ data }) => {


const [cycle, setCycle] = useState(0);




// Auto-transition from state 1 back to state 0 after 8 seconds.


useEffect(() => {


if (cycle === 1) {
  const timer = setTimeout(() => {
    setCycle(0);
  }, 18000);
  return () => clearTimeout(timer);
}

}, [cycle]);




if (!data || data.length === 0) return null;




// Polygons are visible only when cycle === 1.


const polygonsVisible = cycle === 1;




// Button Handlers


const handleShow = () => {


setCycle(1);

};




const handleTroubleshoot = () => {


window.open(
  'https://www.calgary.ca/water/drinking-water/water-pressure.html',
  '_blank'
);
setCycle(0);

};




const handleHidePressureZone = () => {


setCycle(0);

};




return (
  <>
    {/* Render Pressure Polygons when visible */}
    {polygonsVisible &&
      data.map((item, index) => {
        const polygons = parseMultiPolygon(item.multipolygon);
        return polygons.map((polygon, polyIndex) => {
          const color = generateRandomColor();
          return (
            <Polygon
              key={`${index}-${polyIndex}`}
              positions={polygon}
              pathOptions={{ color, fillOpacity: 0.5, weight: 2 }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                {item.zone || "Unnamed Zone"}
              </Tooltip>
            </Polygon>
          );
        });
      })}

    {/* Toggle Button positioned in the Leaflet map container */}
    <div className="toggle-container">
      {cycle === 0 && (
        <button className="toggle-button" onClick={handleShow}>
          Show Pressure Zone
        </button>
      )}
      {cycle === 1 && (
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="toggle-button" onClick={handleTroubleshoot}>
            Troubleshoot
          </button>
          <button className="toggle-button" onClick={handleHidePressureZone}>
            Hide Pressure Zone
          </button>
        </div>
      )}
    </div>

    {/* Inline CSS styles for positioning and button styling */}
    <style>{`
  .toggle-container {
    position: absolute;
    bottom: 20px;
    left: 20px;
    z-index: 1000;
    
    background: rgba(255, 255, 255, 0); /* Completely transparent background for the container */
    border-radius: 8px;
    display: flex;
    gap: 8px;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  }

  .toggle-button {
    padding: 6px 12px;
     font-size: 14px;
     font-family: revert;
    background-color: transparent; /* Fully transparent background initially */
    color:rgb(9, 9, 9);  /* Light blue text color */
    border: none;  /* No border */
    border-radius: 4px;
    cursor: pointer;
    white-space: nowrap;
    transition: background-color 0.3s ease, color 0.3s ease;
    outline: none;  /* Remove outline */
  }

  .toggle-button:hover {
    background-color: rgb(12, 123, 241);  /* Light blue background on hover */
    color:rgb(16, 16, 17);  /* Darker text color on hover */
  }
`}</style>
  </>
);


};




export default Pressure;