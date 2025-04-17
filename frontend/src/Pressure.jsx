import React, { useState, useEffect } from 'react';
import { Polygon } from 'react-leaflet';

// Helper function to parse MultiPolygon data
function parseMultiPolygon(multiPolygon) {
  if (!multiPolygon || multiPolygon.type !== 'MultiPolygon') return [];
  return multiPolygon.coordinates.map((polygon) =>
    polygon[0].map((point) => [point[1], point[0]]) // Convert [lng, lat] to [lat, lng]
  );
}

// Helper function to generate a random color
function generateRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color; // Return random hex color
}

// Main Pressure Component
const Pressure = ({ data }) => {
  const [showPolygons, setShowPolygons] = useState(true); // Show polygons initially

  // Automatically hide polygons after 10 seconds
  useEffect(() => {
    const timeout = setTimeout(() => setShowPolygons(false), 8000); // Hides after 10 seconds
    return () => clearTimeout(timeout); // Cleanup timeout
  }, []);

  if (!data || data.length === 0) return null;

  return (
    <>
      {showPolygons &&
        data.map((item, index) => {
          const polygons = parseMultiPolygon(item.multipolygon);
          return polygons.map((polygon, polyIndex) => {
            const color = generateRandomColor(); // Generate a random color for each polygon

            return (
              <Polygon
                key={`${index}-${polyIndex}`}
                positions={polygon}
                pathOptions={{
                  color, // Apply unique random color
                  fillOpacity: 0.5, // Consistent opacity
                  weight: 2,
                }}
              />
            );
          });
        })}
    </>
  );
};

export default Pressure;