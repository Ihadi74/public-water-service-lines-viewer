// PipeMap.jsx
import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import FormatColorResetIcon from '@mui/icons-material/FormatColorReset';
import ReactDOMServer from 'react-dom/server';
import Pressure from './Pressure'; // Pressure overlay component

// ---------------- Helper Functions ----------------

// Returns a color based on the age of the pipe.
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

// Parses a WKT MULTILINESTRING into an array of [lat, lng] coordinate pairs.
function parseMultiLineString(wkt) {
  if (!wkt) return [];
  const cleaned = wkt.replace("MULTILINESTRING ((", "").replace("))", "");
  return cleaned.split(", ").map(pair => {
    const [lng, lat] = pair.trim().split(" ").map(Number);
    return [lat, lng];
  });
}

// Parses a GEO_LOCATION string (e.g., "51.045, -114.057") into a [lat, lng] array.
function parseGeoLocation(geoString) {
  if (!geoString) return null;
  const parts = geoString.split(",").map((p) => parseFloat(p.trim()));
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts;
  }
  return null;
}

// Creates a custom water break icon using Material UI's FormatColorResetIcon.
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

// ---------------- Custom Map Helpers ----------------

// Listens for zoom changes to conditionally show water break markers.
const ZoomListener = ({ setShowMarkers }) => {
  const map = useMap();
  useEffect(() => {
    const onZoom = () => {
      const zoomLevel = map.getZoom();
      setShowMarkers(zoomLevel >= 15);
    };
    map.on('zoomend', onZoom);
    return () => {
      map.off('zoomend', onZoom);
    };
  }, [map, setShowMarkers]);
  return null;
};
/*
  CombinedCenterMap:
  - If a selected pipe is provided:
      • If it has a `line` property, parse and fit bounds using its line data.
      • Otherwise, if it has a `GEO_LOCATION` field, center the map on that coordinate at zoom level 17.
  - If no selected pipe is provided, try to fit bounds around all pipes that have line data.
  - If none of these are available, fall back to a default view.
*/
function CombinedCenterMap({ pipes, selectedPipe }) {
  const map = useMap();

  useEffect(() => {
    if (selectedPipe) {
      if (selectedPipe.line) {
        const coordinates = parseMultiLineString(selectedPipe.line);
        if (coordinates.length > 0) {
          map.fitBounds(coordinates, { maxZoom: 17 });
          return;
        }
      }
      const coords = parseGeoLocation(selectedPipe.GEO_LOCATION);
      if (coords) {
        map.setView(coords, 17);
        return;
      }
    }
    if (pipes && pipes.length > 0) {
      const allCoordinates = pipes.flatMap(pipe => pipe.line ? parseMultiLineString(pipe.line) : []
      );
      if (allCoordinates.length > 0) {
        map.fitBounds(allCoordinates, { maxZoom: 17 });
        return;
      }
    }
    // Fallback view.
    map.setView([51.045, -114.057], 10);
  }, [pipes, selectedPipe, map]);

  return null;
}

// ---------------- Main Map Component ----------------

const PipeMap = ({ pipes, selectedPipe }) => {
  const [waterBreaks, setWaterBreaks] = useState([]);
  const [polygonData, setPolygonData] = useState([]); // For the Pressure overlay
  const [showMarkers, setShowMarkers] = useState(false);

  // Fetch water break data
  useEffect(() => {
    async function fetchWaterBreaks() {
      try {
        const response = await fetch('https://data.calgary.ca/resource/dpcu-jr23.json');
        if (!response.ok) throw new Error('Failed to fetch water break data');
        const data = await response.json();
        const formattedData = data.map(breakInfo => ({
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

    // Fetch polygon data for Pressure overlay
    async function fetchPolygonData() {
      try {
        const response = await fetch('https://data.calgary.ca/resource/xn3q-y49u.json');
        if (!response.ok) throw new Error('Failed to fetch polygon data');
        const data = await response.json();
        setPolygonData(data);
      } catch (error) {
        console.error('Error fetching polygon data:', error);
      }
    }

    fetchWaterBreaks();
    fetchPolygonData();
  }, []);

  // Filter active water break records.
  const activeWaterBreaks = waterBreaks.filter(
    breakInfo => breakInfo.status === 'ACTIVE'
  );

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer
        center={[51.0443, -114.0631]}
        zoom={10.5}
        maxZoom={20}
        minZoom={3}
        scrollWheelZoom
        dragging
        style={{ height: '600px', width: '100%' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Centering logic */}
        <CombinedCenterMap pipes={pipes} selectedPipe={selectedPipe} />

        {/* Listen for zoom changes to toggle water break markers */}
        <ZoomListener setShowMarkers={setShowMarkers} />

        {/* Render pipes as polylines with popups and tooltips */}
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
                <div
                  style={{
                    backgroundColor: 'blue',
                    padding: '0.5px',
                    borderRadius: '50%',
                    color: 'transparent',
                    textAlign: 'center'
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

        {/* Render active water break markers */}
        {showMarkers &&
          activeWaterBreaks.map((breakInfo, index) => (
            breakInfo.coordinates && (
              <Marker
                key={index}
                position={breakInfo.coordinates}
                icon={createWaterdropIcon()}
              >
                <Popup>
                  <div
                    style={{
                      backgroundColor: 'blue',
                      padding: '0px',
                      borderRadius: '20px',
                      color: 'white',
                      textAlign: 'center'
                    }}
                  >
                    <strong>Break Date:</strong> {breakInfo.break_date.split('T')[0]}
                    <br />
                    <strong>Break Type:</strong> {breakInfo.break_type}
                  </div>
                </Popup>
              </Marker>
            )
          ))
        }

        {/* Render the Pressure overlay */}
        <Pressure data={polygonData} />
      </MapContainer>
    </div>
  );
};

export default PipeMap;
