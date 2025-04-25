import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import Pressure from './Pressure';
import FormatColorResetIcon from '@mui/icons-material/FormatColorReset';
import LeakReportForm from './LeakReportForm';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issues
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

// Helper Functions
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
      // WKT typically provides coordinates as "lng lat" so we reverse them for [lat, lng]
      const [lng, lat] = pair.trim().split(" ").map(Number);
      return [lat, lng];
    });
};

const parseGeoLocation = (geoString) => {
  if (!geoString) return null;
  return geoString.split(",").map(Number);
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
        filter:
          'invert(31%) sepia(90%) saturate(500%) hue-rotate(190deg) brightness(1.2)',
      }}>
        <FormatColorResetIcon style={{ color: 'blue', fontSize: '24px' }} />
      </div>
    )
  });

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("Error Boundary caught an error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong with the map view.</h1>;
    }
    return this.props.children;
  }
}

// Component to center the map on a leak marker
const CenterOnLeak = ({ leakMarker }) => {
  const map = useMap();
  useEffect(() => {
    if (leakMarker?.lat && leakMarker?.lng) {
      map.setView([leakMarker.lat, leakMarker.lng], 18);
    }
  }, [leakMarker, map]);
  return null;
};

// Component to listen for zoom changes and toggle marker visibility
const ZoomListener = ({ setShowMarkers }) => {
  const map = useMap();
  useEffect(() => {
    const handleZoom = () => setShowMarkers(map.getZoom() >= 15);
    map.on('zoomend', handleZoom);
    return () => map.off('zoomend', handleZoom);
  }, [map, setShowMarkers]);
  return null;
};

// CombinedCenterMap component with error handling
const CombinedCenterMap = ({ pipes, selectedPipe }) => {
  const map = useMap();
  useEffect(() => {
    try {
      if (selectedPipe?.line) {
        const coords = parseMultiLineString(selectedPipe.line);
        if (coords.length) {
          map.fitBounds(coords, { maxZoom: 17 });
          return;
        }
      }
      if (selectedPipe?.GEO_LOCATION) {
        const geo = parseGeoLocation(selectedPipe.GEO_LOCATION);
        if (geo) {
          map.setView(geo, 17);
          return;
        }
      }
      const allCoords = pipes.flatMap(p => p.line ? parseMultiLineString(p.line) : []);
      if (allCoords.length) {
        map.fitBounds(allCoords, { maxZoom: 17 });
        return;
      }
      map.setView([51.045, -114.057], 10);
    } catch (error) {
      console.error("Error in CombinedCenterMap:", error);
    }
  }, [pipes, selectedPipe, map]);
  return null;
};

// Main PipeMap Component
// Accepts props: pipes, selectedPipe, leakMarker, setLeakMarker.
// Water break data and pressure data are fetched within this component.
const PipeMap = ({ pipes, selectedPipe, leakMarker, setLeakMarker }) => {
  const [waterBreaks, setWaterBreaks] = useState([]);
  const [polygonData, setPolygonData] = useState([]);
  const [showMarkers, setShowMarkers] = useState(false);

  // Fetch water break and pressure data
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [res1, res2] = await Promise.all([
          fetch("https://data.calgary.ca/resource/dpcu-jr23.json"),
          fetch("https://data.calgary.ca/resource/xn3q-y49u.json")
        ]);
        const [waterBreaksData, pressureData] = await Promise.all([
          res1.json(),
          res2.json()
        ]);
        if (isMounted) {
          setWaterBreaks(
            waterBreaksData.map(b => ({
              break_date: b.break_date,
              break_type: b.break_type,
              status: b.status,
              coordinates: b.point?.coordinates
                ? [b.point.coordinates[1], b.point.coordinates[0]]
                : null,
            }))
          );
          setPolygonData(pressureData);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Derive active water breaks from fetched waterBreaks data
  const activeWaterBreaks = waterBreaks.filter(b => b.status === "ACTIVE");

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer
        center={[51.0443, -114.0631]}
        zoom={10.5}
        maxZoom={20}
        minZoom={3}
        scrollWheelZoom={true}
        style={{ height: '600px', width: '100%' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Wrap CombinedCenterMap in an error boundary */}
        <ErrorBoundary>
          <CombinedCenterMap pipes={pipes} selectedPipe={selectedPipe} />
        </ErrorBoundary>

        <ZoomListener setShowMarkers={setShowMarkers} />

        {/* Render pipes as polylines */}
        {pipes.map((pipe, index) => {
          if (!pipe.line) return null;
          const positions = parseMultiLineString(pipe.line);
          const color = getAgeColor(pipe.INSTALLED_DATE);
          return (
            <Polyline
              key={index}
              positions={positions}
              pathOptions={{ color, weight: 6 }}
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

        {/* Render active water break markers if zoom level allows */}
        {showMarkers &&
          activeWaterBreaks.map((b, idx) =>
            b.coordinates && (
              <Marker key={idx} position={b.coordinates} icon={createWaterdropIcon()}>
                <Popup>
                  <div>
                    <strong>Break Date:</strong> {b.break_date?.split('T')[0]}<br />
                    <strong>Break Type:</strong> {b.break_type}
                  </div>
                </Popup>
              </Marker>
            )
          )}

        {/* Render leak marker */}
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

        {/* Center map on leak marker if available */}
        <CenterOnLeak leakMarker={leakMarker} />

        {/* Render pressure zones */}
        <Pressure data={polygonData} />
      </MapContainer>

      {/* Legend */}
      <div style={legendStyle}>
        <strong>Legend: Pipe Age</strong>
        <div>
          <span style={{ backgroundColor: "green", ...legendDotStyle }}></span> 0–10 years
        </div>
        <div>
          <span style={{ backgroundColor: "orange", ...legendDotStyle }}></span> 11–25 years
        </div>
        <div>
          <span style={{ backgroundColor: "red", ...legendDotStyle }}></span> 26–50 years
        </div>
        <div>
          <span style={{ backgroundColor: "gray", ...legendDotStyle }}></span> 51+ years / Unknown
        </div>
        <div style={{ marginTop: '10px' }}>
          <span
            style={{
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              filter:
                'invert(31%) sepia(90%) saturate(500%) hue-rotate(190deg) brightness(1.2)',
              marginRight: '10px',
            }}
          >
            <FormatColorResetIcon style={{ color: 'blue', fontSize: '18px' }} />
          </span>
          Water Main Break
        </div>
      </div>
    </div>
  );
};

export default PipeMap;
