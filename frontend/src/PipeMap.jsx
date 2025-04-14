import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useMap } from 'react-leaflet';

// Helper functions for pipes and water breaks
function getAgeColor(installedDate) {
  if (!installedDate) return 'gray';
  const currentYear = new Date().getFullYear();
  const yearInstalled = new Date(installedDate).getFullYear();
  const age = currentYear - yearInstalled;
  if (age <= 10) return 'green';
  if (age <= 25) return 'orange';
  if (age <= 50) return 'red';
  return 'gray';
}
function parseMultiLineString(wkt) {
  const cleaned = wkt
    .replace('MULTILINESTRING ((', '')
    .replace('))', '');
  return cleaned.split(', ').map(pair => {
    const [lng, lat] = pair.trim().split(' ').map(Number);
    return [lat, lng];
  });
}
const createCustomIcon = (color) => {
  return L.divIcon({
    className: `custom-marker-${color}`,
    html: `<div style="background-color:${color}; width:14px; height:14px; border-radius:50%;"></div>`,
  });
};

// FitBounds Component (from the first code snippet)
const FitBounds = ({ pipes }) => {
  const map = useMap();

  useEffect(() => {
    if (!pipes || pipes.length === 0) return;

    const allCoordinates = [];

    pipes.forEach(pipe => {
      if (pipe.line) {
        const positions = parseMultiLineString(pipe.line);
        allCoordinates.push(...positions);
      }
    });

    if (allCoordinates.length > 0) {
      map.fitBounds(allCoordinates);
    }
  }, [pipes, map]);

  return null;
};

// ZoomListener Component
const ZoomListener = ({ setShowMarkers }) => {
  const map = useMap();
  useEffect(() => {
    const onZoom = () => {
      const zoomLevel = map.getZoom(); // Get the current zoom level
      setShowMarkers(zoomLevel === 15); // Update state when zoom level is 15
    };
    map.on('zoomend', onZoom); // Attach zoomend event listener
    return () => {
      map.off('zoomend', onZoom); // Clean up on unmount
    };
  }, [map, setShowMarkers]);
  return null;
};

// Legend Style
const legendStyle = {
  position: 'absolute',
  bottom: '10px',
  right: '10px',
  backgroundColor: 'white',
  padding: '10px',
  borderRadius: '5px',
  fontSize: '14px',
  boxShadow: '0 0 5px rgba(0,0,0,0.3)',
  zIndex: 1000,
};

// Main Map Component
const PipeMap = ({ pipes }) => {
  const [waterBreaks, setWaterBreaks] = useState([]);
  const [showMarkers, setShowMarkers] = useState(false);

  // Fetch water break data separately
  useEffect(() => {
    async function fetchWaterBreaks() {
      try {
        const response = await fetch('https://data.calgary.ca/resource/dpcu-jr23.json');
        if (!response.ok) throw new Error('Failed to fetch water break data');
        const data = await response.json();
        // Process data to extract necessary fields
        const formattedData = data.map((breakInfo) => ({
          break_date: breakInfo.break_date,
          break_type: breakInfo.break_type,
          status: breakInfo.status,
          coordinates: breakInfo.point?.coordinates
            ? [breakInfo.point.coordinates[1], breakInfo.point.coordinates[0]] // Convert to [lat, lng]
            : null,
        }));
        setWaterBreaks(formattedData);
      } catch (error) {
        console.error('Error fetching water breaks:', error);
      }
    }
    fetchWaterBreaks();
  }, []);

  // Filter water breaks to only include active ones
  const activeWaterBreaks = waterBreaks.filter(
    (breakInfo) => breakInfo.status === 'ACTIVE'
  );

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer
        center={[51.045, -114.057]}
        zoom={11} // Start map at zoom level 11
        maxZoom={20} // Ensure zoom range allows transitions
        minZoom={3} // Minimum zoom level
        scrollWheelZoom={true}
        dragging={true}
        style={{ height: '600px', width: '100%' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomListener setShowMarkers={setShowMarkers} />
        <FitBounds pipes={pipes} />
        {/* Render Pipes */}
        {pipes.map((pipe, index) => {
          if (!pipe.line) return null;
          const positions = parseMultiLineString(pipe.line);
          const color = getAgeColor(pipe.INSTALLED_DATE);
          return (
            <Polyline
              key={index}
              positions={positions}
              pathOptions={{ color, weight: 6 }}
            >
              <Popup>
                <strong>{pipe.BUILDING_TYPE}</strong>
                <br />
                {pipe.WATER_SERVICE_ADDRESS}
                <br />
                {pipe.MATERIAL_TYPE}, {pipe['PIPE_DIAMETER (mm)']}mm
              </Popup>
              <Tooltip sticky>
                <div>
                  <strong>{pipe.BUILDING_TYPE}</strong>
                  <br />
                  Diameter: {pipe['PIPE_DIAMETER (mm)']}mm
                  <br />
                  Installed: {pipe.INSTALLED_DATE}
                </div>
              </Tooltip>
            </Polyline>
          );
        })}
        {/* Render Active Water Break Markers */}
        {showMarkers &&
          activeWaterBreaks.map((breakInfo, index) =>
            breakInfo.coordinates ? (
              <Marker
                key={index}
                position={breakInfo.coordinates}
                icon={createCustomIcon('blue')} // Active water breaks are blue
              >
                <Popup>
                  <strong>Break Date:</strong> {breakInfo.break_date.split('T')[0]} <br />
                  <strong>Break Type:</strong> {breakInfo.break_type}
                </Popup>
                <Tooltip sticky>
                  <div>
                    <strong>Break Type:</strong> {breakInfo.break_type}
                    <br />
                    <strong>Break Date:</strong> {breakInfo.break_date.split('T')[0]}
                  </div>
                </Tooltip>
              </Marker>
            ) : null
          )}
      </MapContainer>
      {/* Legend (from the first code snippet) */}
      <div style={legendStyle}>
        <strong>Legend: Pipe Age</strong>
        <div><span style={{ backgroundColor: 'green', display: 'inline-block', width: '16px', height: '16px', borderRadius: '50%', marginRight: '10px' }}></span> 0–10 years</div>
        <div><span style={{ backgroundColor: 'orange', display: 'inline-block', width: '16px', height: '16px', borderRadius: '50%', marginRight: '10px' }}></span> 11–25 years</div>
        <div><span style={{ backgroundColor: 'red', display: 'inline-block', width: '16px', height: '16px', borderRadius: '50%', marginRight: '10px' }}></span> 26–50 years</div>
        <div><span style={{ backgroundColor: 'gray', display: 'inline-block', width: '16px', height: '16px', borderRadius: '50%', marginRight: '10px' }}></span> 51+ years / Unknown</div>
      </div>
    </div>
  );
};

export default PipeMap;