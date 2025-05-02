// PipeMap.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, Tooltip, } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import FormatColorResetIcon from '@mui/icons-material/FormatColorReset';
import ReactDOMServer from 'react-dom/server';
import LeakReportForm from './LeakReportForm';
import Pressure from './Pressure';
import { createRoot } from 'react-dom/client';
import WaterDropTwoToneIcon from '@mui/icons-material/WaterDropTwoTone';
import { formatDate } from "./utils/dateUtils";

// --- CONFIGURATION & UTILITY FUNCTIONS ---
const breakTypeDescriptions = { A: 'Full Circular', B: 'Split', C: 'Corrosion', D: 'Fitting', E: 'Joint', F: 'Diagonal Crack', G: 'Hole', S: 'Saddle' };
const getAgeColor = (installedDate) => {
  if (!installedDate) return 'gray';
  const currentYear = new Date().getFullYear();
  const installationYear = new Date(installedDate).getFullYear();
  if (isNaN(installationYear)) return 'gray';
  const age = currentYear - installationYear;
  return age <= 10 ? 'green' : age <= 25 ? 'orange' : age <= 50 ? 'red' : 'gray';
};

// Legend styles
const legendDotStyle = {
  display: 'inline-block',
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  marginRight: '10px',
};

// Removed unused legendStyle object

// Address style for tooltips
const addressStyle = {
  width: '200px',
  wordWrap: 'break-word', 
  overflowWrap: 'break-word',
  whiteSpace: 'normal',
  textAlign: 'left'
};

// Configure default icons for Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Define a red waterdrop icon
const createRedWaterDropIcon = () => {
  return L.divIcon({
    className: 'custom-red-waterdrop-icon',
    html: `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        width: 28px; 
        height: 28px; 
        background: transparent;
        border-radius: 50%;
      ">
        ${ReactDOMServer.renderToString(
          <WaterDropTwoToneIcon style={{ color: '#ff0000', fontSize: '28px' }} />
        )}
      </div>
    `,
  });
};

const redWaterDropIcon = createRedWaterDropIcon();

// Parse MULTILINESTRING WKT format
const parseMultiLineString = (wkt) => {
  if (!wkt) return [];
  try {
    // Handle both formats that might come from different data sources
    if (wkt.startsWith('MULTILINESTRING')) {
      const cleaned = wkt.replace(/^MULTILINESTRING\s*\(\(/, '').replace(/\)\)$/, '');
      return cleaned.split(/,\s*/).map((pair) => {
        const coords = pair.trim().split(/\s+/).map(Number);
        return [coords[1], coords[0]]; // Swap to [lat, lng]
      }).filter(pos => pos.length === 2 && !isNaN(pos[0]) && !isNaN(pos[1]));
    } else {
      // Handle simpler format from reference implementation
      const cleaned = wkt.replace('MULTILINESTRING ((', '').replace('))', '');
      return cleaned.split(', ').map((pair) => {
        const [lng, lat] = pair.trim().split(' ').map(Number);
        return [lat, lng];
      });
    }
  } catch (error) {
    console.error("Error parsing MULTILINESTRING:", wkt, error);
    return [];
  }
};

// Parse GEO_LOCATION string
const parseGeoLocation = (geoString) => {
  if (!geoString) return null;
  return geoString.split(',').map(Number);
};

// Create waterdrop icon
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

const waterDropIcon = createWaterdropIcon();

// --- HELPER COMPONENTS ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("Map Error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong with the map view.</h1>;
    }
    return this.props.children;
  }
}

// DynamicCenter recenters the map based on an external alert center
const DynamicCenter = ({ mapCenter }) => {
  const map = useMap();
  useEffect(() => {
    if (mapCenter) {
      map.setView([mapCenter.lat, mapCenter.lng], 16, { animate: true });
    }
  }, [mapCenter, map]);
  return null;
};

// CenterOnLeak recenters the map if a leak marker is provided
const CenterOnLeak = ({ leakMarker }) => {
  const map = useMap();
  useEffect(() => {
    if (leakMarker) {
      map.setView([leakMarker.lat, leakMarker.lng], 18);
    }
  }, [leakMarker, map]);
  return null;
};

// ZoomListener toggles water break marker visibility at zoom >= 15
const ZoomListener = ({ setShowMarkers }) => {
  const map = useMap();
  useEffect(() => {
    const onZoom = () => {
      const zoomLevel = map.getZoom();
      setShowMarkers(zoomLevel >= 14);
    };
    map.on("zoomend", onZoom);
    // Set initial visibility
    onZoom();
    return () => map.off("zoomend", onZoom);
  }, [map, setShowMarkers]);
  return null;
};

// CenterMap adjusts the map bounds based on pipes
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
      
      if (selectedPipe?.the_geom) {
        const coords = parseMultiLineString(selectedPipe.the_geom);
        if (coords.length) {
          map.fitBounds(coords, { maxZoom: 17 });
          return;
        }
      }
      
      const allCoords = pipes.flatMap((p) => {
        if (p.line) return parseMultiLineString(p.line);
        if (p.the_geom) return parseMultiLineString(p.the_geom);
        return [];
      });
      
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

// Add a MapController to capture the map instance
const MapController = ({ setMapRef }) => {
  const map = useMap();
  
  useEffect(() => {
    if (map && setMapRef) {
      setMapRef(map);
    }
  }, [map, setMapRef]);
  
  return null;
};

// Create a custom Legend Control for Leaflet
const MapLegend = () => {
  const map = useMap();
  
  useEffect(() => {
    // Create a custom control
    const legendControl = L.control({ position: 'bottomright' });
    
    legendControl.onAdd = function () {
      const div = L.DomUtil.create('div', 'info legend');
      div.style.backgroundColor = 'white';
      div.style.padding = '10px';
      div.style.borderRadius = '5px';
      div.style.fontSize = '14px';
      div.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';
      
      // Create a root for React to render into
      const root = createRoot(div);
      
      // Render the legend content
      root.render(
        <div>
          <strong>Legend: Pipe Age</strong>
          <div>
            <span style={{ ...legendDotStyle, backgroundColor: "green" }}></span>{" "}
            0–10 years
          </div>
          <div>
            <span style={{ ...legendDotStyle, backgroundColor: "orange" }}></span>{" "}
            11–25 years
          </div>
          <div>
            <span style={{ ...legendDotStyle, backgroundColor: "red" }}></span>{" "}
            26–50 years
          </div>
          <div>
            <span style={{ ...legendDotStyle, backgroundColor: "gray" }}></span>{" "}
            51+ years / Unknown
          </div>
          <div style={{ marginTop: "10px" }}>
            <span>
              <FormatColorResetIcon
                style={{ color: "blue", fontSize: "18px", marginRight: "8px" }}
              />
            </span>
            Water Main Break
          </div>
        </div>
      );
      
      return div;
    };
    
    // Add the control to the map
    legendControl.addTo(map);
    
    // Clean up on unmount
    return () => {
      legendControl.remove();
    };
  }, [map]);
  
  return null;
};

// --- MAIN PIPEMAP COMPONENT ---
const PipeMap = ({
  pipes,
  selectedPipe,
  setSelectedPipe,
  leakMarker,
  setLeakMarker,
  mapCenter,
  setMapInstance = () => {},
}) => {
  const [waterBreaks, setWaterBreaks] = useState([]);
  const [polygonData, setPolygonData] = useState([]);
  const [showMarkers, setShowMarkers] = useState(false);
  const [loading, setLoading] = useState(true);

  // Use container styles directly in component rendering
  const containerStyle = { position: 'relative' };

  // Reference to map instance
  const mapRef = useRef(null);
  
  // Callback to set the map reference
  const setMapReference = useCallback((map) => {
    mapRef.current = map;
    setMapInstance(map);
  }, [setMapInstance]);

  useEffect(() => {
    // Just set loading to false since we already have pipes from props
    setLoading(false);
  }, []);

  // Fetch additional water break and pressure polygon data
  useEffect(() => {
    let isMounted = true;
    const fetchAdditionalData = async () => {
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
            waterBreaksData.map((b) => {
              const breakTypeStr = b.break_type || "";
              const breakTypeDesc = breakTypeStr.split("").map(
                (letter) =>
                  `${letter} - ${breakTypeDescriptions[letter] || "Unknown"}`
              );
              return {
                break_date: b.break_date,
                break_type: b.break_type,
                break_type_desc: breakTypeDesc,
                status: b.status,
                coordinates: b.point?.coordinates
                  ? [b.point.coordinates[1], b.point.coordinates[0]]
                  : null,
              };
            })
          );
          setPolygonData(pressureData);
        }
      } catch (err) {
        console.error("Failed to fetch water break data:", err);
      }
    };
    fetchAdditionalData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Render loading indicator conditionally
  if (loading) {
    return <div>Loading...</div>;
  }

  // Determine the selected pipe's position for a marker
  let selectedPipePosition = null;
  if (selectedPipe) {
    if (selectedPipe.GEO_LOCATION) {
      selectedPipePosition = parseGeoLocation(selectedPipe.GEO_LOCATION);
    } else if (selectedPipe.line) {
      const coords = parseMultiLineString(selectedPipe.line);
      if (coords.length) selectedPipePosition = coords[0];
    } else if (selectedPipe.the_geom) {
      const coords = parseMultiLineString(selectedPipe.the_geom);
      if (coords.length) selectedPipePosition = coords[0];
    }
  }

  return (
    <div style={containerStyle}>
      <MapContainer
        center={[51.045, -114.057]}
        zoom={10.5}
        maxZoom={20}
        minZoom={3}
        scrollWheelZoom={true}
        dragging={true}
        style={{ height: "600px", width: "100%" }}
      >
        {/* Add MapController to use setMapReference */}
        <MapController setMapRef={setMapReference} />
        
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ErrorBoundary>
          <CenterMap pipes={pipes} selectedPipe={selectedPipe} />
        </ErrorBoundary>

        <ZoomListener setShowMarkers={setShowMarkers} />

        {/* Recenter the map if an external map center is provided */}
        <DynamicCenter mapCenter={mapCenter} />

        {/* Render each pipe as a polyline with a popup and tooltip */}
        {Array.isArray(pipes) &&
          pipes.map((pipe, index) => {
            // Support both line and the_geom properties
            const geometry = pipe.line || pipe.the_geom;
            if (!geometry) return null;
            
            const positions = parseMultiLineString(geometry);
            if (!positions || positions.length === 0) return null;
            
            // Support different property naming conventions
            const installedDate = pipe.INSTALLED_DATE || pipe.installed_dt;
            const pipeColor = getAgeColor(installedDate);
            
            return (
              <Polyline
                key={index}
                positions={positions}
                pathOptions={{ color: pipeColor, weight: 6 }}
                eventHandlers={{
                  click: (e) => {
                    setSelectedPipe(pipe);
                    const popupContent = ReactDOMServer.renderToString(
                      <div>
                        <strong>{pipe.BUILDING_TYPE || pipe.building_type}</strong>
                        <br />
                        {pipe.WATER_SERVICE_ADDRESS || pipe.address}
                        <br />
                        {pipe.MATERIAL_TYPE || pipe.material}
                        <br />
                        {(pipe["PIPE_DIAMETER (mm)"] || pipe.diameter)}mm
                        <br />
                        Installed: {formatDate(installedDate)}
                      </div>
                    );
                    e.target.bindPopup(popupContent).openPopup();
                  },
                }}
              >
                <Tooltip sticky>
                  <div style={addressStyle}>
                    <strong>{pipe.BUILDING_TYPE || pipe.building_type}</strong>
                    <br />
                    Diameter: {(pipe["PIPE_DIAMETER (mm)"] || pipe.diameter)}mm
                    <br />
                    Installed: {formatDate(installedDate)}
                    <br />
                    Material: {(pipe.MATERIAL_TYPE || pipe.material) || "Unknown"}
                    {(pipe.ADDRESS || pipe.address) && (
                      <>
                        <br />
                        Address: {pipe.ADDRESS || pipe.address}
                      </>
                    )}
                  </div>
                </Tooltip>
              </Polyline>
            );
          })}

        {/* Render water break markers (only visible at zoom level 15+) */}
        {showMarkers &&
          waterBreaks
            .filter((b) => b.status === "ACTIVE")
            .map((breakInfo, idx) =>
              breakInfo.coordinates ? (
                <Marker
                  key={idx}
                  position={breakInfo.coordinates}
                  icon={waterDropIcon}
                >
                  <Popup>
                    <div style={{
                      ...addressStyle,
                      textAlign: "center",
                      border: "none",
                      padding: "5px",
                      borderRadius: "20px",
                    }}>
                      <strong>Break Date:</strong>{" "}
                      {formatDate(breakInfo.break_date)} <br />
                      <strong>Break Type:</strong>
                      <br />
                      {breakInfo.break_type_desc &&
                        breakInfo.break_type_desc.map((desc, i) => (
                          <div key={i}>{desc}</div>
                        ))}
                      {breakInfo.address && (
                        <>
                          <strong>Address:</strong><br />
                          {breakInfo.address}
                        </>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ) : null
            )}

        {/* Render leak marker if provided */}
        {leakMarker && (
          <Marker 
            position={[leakMarker.lat, leakMarker.lng]} 
            icon={leakMarker.iconType === 'redWaterDrop' ? redWaterDropIcon : waterDropIcon}
          >
            <Popup>
              <div>
                <h3>{leakMarker.message}</h3>
                {leakMarker.specificLocation && (
                  <p><strong>Repair Location:</strong> {leakMarker.specificLocation}</p>
                )}
                <p><strong>Priority:</strong> {leakMarker.priority}</p>
                <p><strong>Status:</strong> {leakMarker.status}</p>
                {leakMarker.dateReported && (
                  <p><strong>Date Reported:</strong> {formatDate(leakMarker.dateReported)}</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render selected pipe marker, if any - FIX HERE: Add LeakReportForm */}
        {selectedPipePosition && (
          <Marker position={selectedPipePosition}>
            <Popup>
              <div>
                <h3>Pipe Details</h3>
                <p><strong>Address:</strong> {selectedPipe.address || selectedPipe.WATER_SERVICE_ADDRESS || 'N/A'}</p>
                <p><strong>Building Type:</strong> {selectedPipe.buildingType || selectedPipe.BUILDING_TYPE || 'N/A'}</p>
                <p><strong>Material:</strong> {selectedPipe.material || selectedPipe.MATERIAL_TYPE || 'N/A'}</p>
                <p><strong>Diameter:</strong> {selectedPipe.diameter || selectedPipe.PIPE_DIAMETER || selectedPipe["PIPE_DIAMETER (mm)"] || 'N/A'} mm</p>
                <p><strong>Installed Date:</strong> {formatDate(selectedPipe.INSTALLED_DATE || selectedPipe.installedDate)}</p>
                {/* Add LeakReportForm */}
                <LeakReportForm
                  address={selectedPipe?.WATER_SERVICE_ADDRESS || selectedPipe?.address || `Location: ${selectedPipePosition[0].toFixed(6)}, ${selectedPipePosition[1].toFixed(6)}`}
                  coordinates={selectedPipePosition}
                  setLeakMarker={setLeakMarker}
                />
              </div>
            </Popup>
          </Marker>
        )}

        <CenterOnLeak leakMarker={leakMarker} />
        <Pressure data={polygonData} />
        <MapLegend />
      </MapContainer>

    </div>
  );
};

export default PipeMap;
