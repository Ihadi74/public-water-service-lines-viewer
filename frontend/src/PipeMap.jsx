import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import FormatColorResetIcon from '@mui/icons-material/FormatColorReset';
import ReactDOMServer from 'react-dom/server';
import LeakReportForm from './LeakReportForm';
import 'leaflet/dist/leaflet.css';
import Pressure from './Pressure';

const getAgeColor = (installedDate) => {
  if (!installedDate) return 'gray';
  const currentYear = new Date().getFullYear();
  const installationYear = new Date(installedDate).getFullYear();
  const age = currentYear - installationYear;
  return age <= 10 ? 'green' : age <= 25 ? 'orange' : age <= 50 ? 'red' : 'gray';
};

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

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const materialColors = {
  Copper: "green",
  Lead: "red",
  "Cast Iron": "orange",
  "Cross-linked Polyethylene (PEX)": "blue",
  Unknown: "gray",
};

function parseMultiLineString(wkt) {
  const cleaned = wkt.replace('MULTILINESTRING ((', '').replace('))', '');
  return cleaned.split(', ').map((pair) => {
    const [lng, lat] = pair.trim().split(' ').map(Number);
    return [lat, lng];
  });
}

const parseGeoLocation = (geoString) => {
  if (!geoString) return null;
  return geoString.split(",").map(Number);
};

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

const CenterMap = ({ pipes, selectedPipe }) => {
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
      const allCoords = pipes.flatMap((p) =>
        p.line ? parseMultiLineString(p.line) : []
      );
      if (allCoords.length) {
        map.fitBounds(allCoords, { maxZoom: 17 });
        return;
      }
      map.setView([51.045, -114.057], 10);
    } catch (error) {
      console.error("Error in CenterMap:", error);
    }
  }, [pipes, map, selectedPipe]);
  return null;
};

const CenterOnLeak = ({ leakMarker }) => {
  const map = useMap();
  useEffect(() => {
    if (leakMarker) {
      map.setView([leakMarker.lat, leakMarker.lng], 18);
    }
  }, [leakMarker, map]);
  return null;
};

const PipeMap = ({ pipes, selectedPipe, setSelectedPipe, leakMarker, address, setLeakMarker }) => {
  const [waterBreaks, setWaterBreaks] = useState([]);
  const [showMarkers, setShowMarkers] = useState(false);
  const [polygonData, setPolygonData] = useState([]);

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

  const activeWaterBreaks = waterBreaks.filter(b => b.status === "ACTIVE");

  // Calculate the position for the selected pipe (if provided)
  let selectedPipePosition = null;
  if (selectedPipe) {
    if (selectedPipe.GEO_LOCATION) {
      selectedPipePosition = parseGeoLocation(selectedPipe.GEO_LOCATION);
    } else if (selectedPipe.line) {
      const coords = parseMultiLineString(selectedPipe.line);
      if (coords.length) selectedPipePosition = coords[0];
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer
        center={[51.045, -114.057]}
        zoom={10.5}
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

        <ErrorBoundary>
          <CenterMap pipes={pipes} selectedPipe={selectedPipe} />
        </ErrorBoundary>

        <ZoomListener setShowMarkers={setShowMarkers} />

        {/* Render each pipe as a Polyline with an onClick handler */}
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
                  // Set the clicked pipe as selected.
                  setSelectedPipe(pipe);
                  // Bind a custom popup with details about the pipe.
                  const popupContent = ReactDOMServer.renderToString(
                    <div
                      style={{
                        height: 'auto',
                        width: 'auto',
                        border: 'none',
                        padding: '0.5px',
                        textAlign: 'center',
                      }}
                    >
                      <strong>{pipe.BUILDING_TYPE}</strong>
                      <br />
                      {pipe.WATER_SERVICE_ADDRESS}
                      <br />
                      {pipe.MATERIAL_TYPE}
                      <br />
                      {pipe['PIPE_DIAMETER (mm)']}mm
                    </div>
                  );
                  e.target.bindPopup(popupContent).openPopup();
                },
              }}
            >
              <Tooltip sticky>
                <div>
                  <strong>{pipe.BUILDING_TYPE}</strong>
                  <br />Diameter: {pipe['PIPE_DIAMETER (mm)']}mm
                  <br />Installed: {pipe.INSTALLED_DATE}
                </div>
              </Tooltip>
            </Polyline>
          );
        })}

        {/* Render active water break markers if zoom is sufficient */}
        {showMarkers &&
          activeWaterBreaks.map((breakInfo, index) =>
            breakInfo.coordinates ? (
              <Marker key={index} position={breakInfo.coordinates} icon={createWaterdropIcon()}>
                <Popup>
                  <div
                    style={{
                      border: 'none',
                      padding: '0px',
                      borderRadius: '20px',
                      textAlign: 'center',
                    }}
                  >
                    <strong>Break Date:</strong> {breakInfo.break_date.split('T')[0]} <br />
                    <strong>Break Type:</strong> {breakInfo.break_type}
                  </div>
                </Popup>
              </Marker>
            ) : null
          )
        }

        {/* Render a leak marker if one is set */}
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

      {/* Legend (outside the map container) */}
      <div style={legendStyle}>
        <strong>Legend: Pipe Age</strong>
        <div>
          <span style={{ backgroundColor: "green", ...legendDotStyle }}></span>{" "}
          0–10 years
        </div>
        <div>
          <span style={{ backgroundColor: "orange", ...legendDotStyle }}></span>{" "}
          11–25 years
        </div>
        <div>
          <span style={{ backgroundColor: "red", ...legendDotStyle }}></span>{" "}
          26–50 years
        </div>
        <div>
          <span style={{ backgroundColor: "gray", ...legendDotStyle }}></span>{" "}
          51+ years / Unknown
        </div>
        <div style={{ marginTop: '10px' }}>
          <span>
            <FormatColorResetIcon style={{ color: 'blue', fontSize: '18px', marginRight: "8px"}} />
          </span>
          Water Main Break
        </div>
      </div>
    </div>
  );
};

export default PipeMap;
