import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import FormatColorResetIcon from '@mui/icons-material/FormatColorReset'; // Import Material UI icon
import ReactDOMServer from 'react-dom/server'; // Import ReactDOMServer for rendering React components as HTML strings

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
  const cleaned = wkt.replace('MULTILINESTRING ((', '').replace('))', '');
  return cleaned.split(', ').map((pair) => {
    const [lng, lat] = pair.trim().split(' ').map(Number);
    return [lat, lng];
  });
}

// Create custom water break icon using FormatColorResetIcon
const createWaterdropIcon = () => {
  return L.divIcon({
    className: 'custom-waterdrop-icon',
    html: `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        width: 24px; 
        height: 24px; 
        background: transparent;
        border-radius: 50%;
        filter: invert(31%) sepia(90%) saturate(500%) hue-rotate(190deg) brightness(1.2);
      ">
        ${ReactDOMServer.renderToString(
          <FormatColorResetIcon style={{ color: 'blue', fontSize: '24px' }} />
        )}
      </div>
    `,
  });
};

// Component for handling map zoom changes
const ZoomListener = ({ setShowMarkers }) => {
  const map = useMap();
  useEffect(() => {
    const onZoom = () => {
      const zoomLevel = map.getZoom();
      setShowMarkers(zoomLevel === 15);
    };
    map.on('zoomend', onZoom);
    return () => {
      map.off('zoomend', onZoom);
    };
  }, [map, setShowMarkers]);
  return null;
};

// **NEW: Center Map Dynamically**
const CenterMap = ({ pipes }) => {
  const map = useMap();

  useEffect(() => {
    if (!pipes || pipes.length === 0) {
      map.setView([51.045, -114.057], 11); // Default center if no pipes exist
      return;
    }

    const allCoordinates = pipes.flatMap((pipe) =>
      pipe.line ? parseMultiLineString(pipe.line) : []
    );

    if (allCoordinates.length > 0) {
      map.fitBounds(allCoordinates); // Center dynamically on pipe data
    }
  }, [pipes, map]);

  return null;
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
        const formattedData = data.map((breakInfo) => ({
          break_date: breakInfo.break_date,
          break_type: breakInfo.break_type,
          status: breakInfo.status,
          coordinates: breakInfo.point?.coordinates
            ? [breakInfo.point.coordinates[1], breakInfo.point.coordinates[0]]
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
  const activeWaterBreaks = waterBreaks.filter((breakInfo) => breakInfo.status === 'ACTIVE');

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer
        center={[51.045, -114.057]}
        zoom={11}
        maxZoom={20}
        minZoom={3}
        scrollWheelZoom={true}
        dragging={true}
        style={{ height: '600px', width: '100%' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CenterMap pipes={pipes} /> {/* NEW: Dynamically adjust center */}
        <ZoomListener setShowMarkers={setShowMarkers} />
        {/* Render Pipes */}
        {pipes.map((pipe, index) => {
          if (!pipe.line) return null;
          const positions = parseMultiLineString(pipe.line);
          const color = getAgeColor(pipe.INSTALLED_DATE);
          return (
            <Polyline key={index} positions={positions} pathOptions={{ color, weight: 6 }}>
              <Popup>
                <div
                  style={{
                    backgroundColor: 'blue',
                    height: 'auto',
                    width: 'auto',
                    border: 'none',
                    padding: '0.5px',
                    borderRadius: '50%',
                    color: 'transparent',
                    textAlign: 'center',
                  }}
                >
                  <strong>{pipe.BUILDING_TYPE}</strong>
                  <br />
                  {pipe.WATER_SERVICE_ADDRESS}
                  <br />
                  {pipe.MATERIAL_TYPE}, {pipe['PIPE_DIAMETER (mm)']}mm
                </div>
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
              <Marker key={index} position={breakInfo.coordinates} icon={createWaterdropIcon()}>
                <Popup>
                  <div
                    style={{
                      backgroundColor: 'blue',
                      border: 'none',
                      padding: '0px',
                      borderRadius: '20px',
                      color: 'white',
                      textAlign: 'center',
                    }}
                  >
                    <strong>Break Date:</strong> {breakInfo.break_date.split('T')[0]} <br />
                    <strong>Break Type:</strong> {breakInfo.break_type}
                  </div>
                </Popup>
              </Marker>
            ) : null
          )}
      </MapContainer>
    </div>
  );
};

export default PipeMap;