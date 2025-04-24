
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

/*
  Cycle state definition:
    0: (Troubleshoot) – Polygons visible; button displays "Troubleshoot".  
       On press, opens the troubleshoot URL in a new tab and advances to state 1.
    1: (Hide Pressure) – Polygons visible; button displays "Hide Pressure".  
       On press, hides the polygons (advances to state 2).
    2: (Show Pressure) – Polygons hidden; button displays "Show Pressure".  
       On press, shows the polygons (advances to state 0).
*/
const Pressure = ({ data }) => {
  const [cycle, setCycle] = useState(0);

  // Auto-transition from "Show" to "Trouble Shoot" (only in the Show state)
useEffect(() => {
  if (cycle === 1) {
    const timer = setTimeout(() => {
      setCycle(2);
    }, 8000);
    return () => clearTimeout(timer);
  }
}, [cycle]);

if (!data || data.length === 0) return null;

// Only render polygons when in the "Show" state.
const polygonsVisible = cycle === 1;

const handleToggle = () => {
  if (cycle === 0) {
    // State 0: "Not Show" – clicking here will change to "Show"
    setCycle(1);
  } else if (cycle === 1) {
    // State 2: "Trouble Shoot" – clicking opens troubleshooting link and cycles back to "Not Show"
    window.open(
      'https://www.calgary.ca/water/drinking-water/water-pressure.html',
      '_blank'
    );
    setCycle(0);
  }
};

  // Set the button's label based on current cycle.
  const buttonLabel =
    cycle === 0 ? 'Pressure zone Map' : cycle === 1 ? 'Troubleshoot' : 'Hide Pressure Zones';

  return (
    <>
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
                {/* Tooltip displays the polygon's zone on hover.
                    If item.zone is not provided, it falls back to "Unnamed Zone".
                 */}
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                  {item.zone || 'Unnamed Zone'}
                </Tooltip>
              </Polygon>
            );
          });
        })}

      {/* Single Toggle Button positioned within the Leaflet map container */}
      <div className="toggle-container">
        <button className="toggle-button" onClick={handleToggle}>
          {buttonLabel}
        </button>
      </div>

  {/* Inline CSS styles for positioning and button styling */}
<style>{`
  .toggle-container {
    position: absolute;
    bottom: 20px;
    left: 20px;
    z-index: 1000;
    color: black;
    padding: 10px;
  }
  .toggle-button {
    padding: 10px 20px;
    background-color: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    color: black;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    transition: background-color 0.3s ease;
  }
  .toggle-button:hover {
    background-color: #0056b3;
  }
`}</style>
    </>
  );
}

export default Pressure;
