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
import ReactDOMServer from 'react-dom/server';
import Pressure from './Pressure';
import FormatColorResetIcon from '@mui/icons-material/FormatColorReset';
import LeakReportForm from './LeakReportForm';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Legend styles
const legendDotStyle = {
  display: "inline-block",
  width: "16px",
  height: "16px",
  borderRadius: "50%",
  marginRight: "10px",
};

const legendStyle = {
  position: "absolute",
  bottom: "10px",
  right: "10px",
  backgroundColor: "white",
  padding: "10px",
  borderRadius: "5px",
  fontSize: "14px",
  boxShadow: "0 0 5px rgba(0,0,0,0.3)",
  zIndex: 1000,
};

// Helpers
const getAgeColor = (installedDate) => {
  if (!installedDate) return 'gray';
  const age = new Date().getFullYear() - new Date(installedDate).getFullYear();
  if (age <= 10) return 'green';
  if (age <= 25) return 'orange';
  if (age <= 50) return 'red';
  return 'gray';
};

const parseMultiLineString = (wkt) => {
  if (!wkt) return [];
  return wkt
    .replace("MULTILINESTRING ((", "")
    .replace("))", "")
    .split(", ")
    .map((pair) => {
      const [lng, lat] = pair.trim().split(" ").map(Number);
      return [lat, lng];
    });
};

const parseGeoLocation = (geoString) => {
  if (!geoString) return null;
  const [lat, lng] = geoString.split(",").map(Number);
  return [lat, lng];
};

const createWaterdropIcon = () =>
  L.divIcon({
    className: 'custom-waterdrop-icon',
    html: ReactDOMServer.renderToString(
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: 24,
        height: 24,
        borderRadius: '50%',
        filter: 'invert(31%) sepia(90%) saturate(500%) hue-rotate(190deg) brightness(1.2)',
      }}>
        <FormatColorResetIcon style={{ color: 'blue', fontSize: '24px' }} />
      </div>
    )
  });

const ZoomListener = ({ setShowMarkers }) => {
  const map = useMap();
  useEffect(() => {
    const handleZoom = () => setShowMarkers(map.getZoom() >= 15);
    map.on('zoomend', handleZoom);
    return () => map.off('zoomend', handleZoom);
  }, [map, setShowMarkers]);
  return null;
};

const CombinedCenterMap = ({ pipes, selectedPipe }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedPipe?.line) {
      const coords = parseMultiLineString(selectedPipe.line);
      if (coords.length) return map.fitBounds(coords, { maxZoom: 17 });
    }
    if (selectedPipe?.GEO_LOCATION) {
      const geo = parseGeoLocation(selectedPipe.GEO_LOCATION);
      if (geo) return map.setView(geo, 17);
    }
    const allCoords = pipes.flatMap((p) => p.line ? parseMultiLineString(p.line) : []);
    if (allCoords.length) return map.fitBounds(allCoords, { maxZoom: 17 });
    map.setView([51.045, -114.057], 10);
  }, [pipes, selectedPipe, map]);
  return null;
};

const CenterOnLeak = ({ leakMarker }) => {
  const map = useMap();
  useEffect(() => {
    if (leakMarker) map.setView([leakMarker.lat, leakMarker.lng], 18);
  }, [leakMarker, map]);
  return null;
};

// ------------------- MAIN COMPONENT -------------------

const PipeMap = ({ pipes, leakMarker, address, setLeakMarker, selectedPipe }) => {
  const [waterBreaks, setWaterBreaks] = useState([]);
  const [polygonData, setPolygonData] = useState([]);
  const [showMarkers, setShowMarkers] = useState(false);

  useEffect(() => {
    const fetchWaterBreaks = async () => {
      try {
        const res = await fetch('https://data.calgary.ca/resource/dpcu-jr23.json');
        const data = await res.json();
        setWaterBreaks(data.map(b => ({
          break_date: b.break_date,
          break_type: b.break_type,
          status: b.status,
          coordinates: b.point?.coordinates ? [b.point.coordinates[1], b.point.coordinates[0]] : null,
        })));
      } catch (err) {
        console.error('Failed to fetch water breaks:', err);
      }
    };

    const fetchPressure = async () => {
      try {
        const res = await fetch('https://data.calgary.ca/resource/xn3q-y49u.json');
        const data = await res.json();
        setPolygonData(data);
      } catch (err) {
        console.error('Failed to fetch pressure data:', err);
      }
    };

    fetchWaterBreaks();
    fetchPressure();
  }, []);

  const activeWaterBreaks = waterBreaks.filter(b => b.status === 'ACTIVE');

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer
        center={[51.0443, -114.0631]}
        zoom={10.5}
        maxZoom={20}
        minZoom={3}
        scrollWheelZoom
        style={{ height: '600px', width: '100%' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CombinedCenterMap pipes={pipes} selectedPipe={selectedPipe} />
        <ZoomListener setShowMarkers={setShowMarkers} />

        {pipes.map((pipe, index) => {
          if (!pipe.line) return null;
          const positions = parseMultiLineString(pipe.line);
          const color = getAgeColor(pipe.INSTALLED_DATE);
          return (
            <Polyline key={index} positions={positions} pathOptions={{ color, weight: 6 }}
              eventHandlers={{
                click: (e) => {
                  const popupContent = ReactDOMServer.renderToString(
                    <div>
                      <strong>{pipe.BUILDING_TYPE}</strong><br />
                      {pipe.WATER_SERVICE_ADDRESS}<br />
                      {pipe.MATERIAL_TYPE}<br />
                      {pipe['PIPE_DIAMETER (mm)']}mm
                    </div>
                  );
                  e.target.bindPopup(popupContent).openPopup();
                }
              }}
            >
              <Tooltip sticky>
                <div>
                  <strong>{pipe.BUILDING_TYPE}</strong><br />
                  Diameter: {pipe['PIPE_DIAMETER (mm)']}mm<br />
                  Installed: {pipe.INSTALLED_DATE}
                </div>
              </Tooltip>
            </Polyline>
          );
        })}

        {showMarkers &&
          activeWaterBreaks.map((b, idx) => b.coordinates && (
            <Marker key={idx} position={b.coordinates} icon={createWaterdropIcon()}>
              <Popup>
                <div>
                  <strong>Break Date:</strong> {b.break_date?.split('T')[0]}<br />
                  <strong>Break Type:</strong> {b.break_type}
                </div>
              </Popup>
            </Marker>
          ))
        }

        {leakMarker && (
          <Marker position={[leakMarker.lat, leakMarker.lng]}>
            <Popup>
              <LeakReportForm
                address={leakMarker.address}
                coordinates={[leakMarker.lat, leakMarker.lng]}
                setLeakMarker={setLeakMarker}
              />
            </Popup>
          </Marker>
        )}

        <CenterOnLeak leakMarker={leakMarker} />
        <Pressure data={polygonData} />
      </MapContainer>

      {/* Legend */}
      <div style={legendStyle}>
        <strong>Legend: Pipe Age</strong>
        <div><span style={{ backgroundColor: "green", ...legendDotStyle }}></span> 0–10 years</div>
        <div><span style={{ backgroundColor: "orange", ...legendDotStyle }}></span> 11–25 years</div>
        <div><span style={{ backgroundColor: "red", ...legendDotStyle }}></span> 26–50 years</div>
        <div><span style={{ backgroundColor: "gray", ...legendDotStyle }}></span> 51+ years / Unknown</div>
        <div style={{ marginTop: '10px' }}>
          <span style={{
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            filter: 'invert(31%) sepia(90%) saturate(500%) hue-rotate(190deg) brightness(1.2)',
            marginRight: '10px'
          }}>
            <FormatColorResetIcon style={{ color: 'blue', fontSize: '18px' }} />
          </span>
          Water Main Break
        </div>
      </div>
    </div>
  );
};

export default PipeMap;
