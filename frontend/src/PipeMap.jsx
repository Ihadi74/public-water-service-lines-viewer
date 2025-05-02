// PipeMap.jsx
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'; // Added useRef
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import FormatColorResetIcon from '@mui/icons-material/FormatColorReset';
import ReactDOMServer from 'react-dom/server';
import WaterOutageAlert from './WaterOutageAlert'; // Import WaterOutageAlert

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
const materialColors = { Copper: 'green', Lead: 'red', 'Cast Iron': 'orange', 'Cross-linked Polyethylene (PEX)': 'blue', Unknown: 'gray' };
const legendDotStyle = { display: 'inline-block', width: '16px', height: '16px', borderRadius: '50%', marginRight: '10px', verticalAlign: 'middle' };
const legendStyle = { position: 'absolute', bottom: '10px', right: '10px', backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: '10px', borderRadius: '5px', fontSize: '12px', boxShadow: '0 0 5px rgba(0,0,0,0.3)', zIndex: 1000, maxWidth: '200px' };
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default || require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png').default || require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png').default || require('leaflet/dist/images/marker-shadow.png'),
});
const parseMultiLineString = (wkt) => {
  if (!wkt || !wkt.startsWith('MULTILINESTRING')) return [];
  try {
    const cleaned = wkt.replace(/^MULTILINESTRING \s*\(\(/, '').replace(/\)\)$/, '');
    return cleaned.split(/,\s*/).map((pair) => {
      const coords = pair.split(/\s+/).map(Number);
      return [coords[1], coords[0]]; // Swap to [lat, lng]
    }).filter(pos => pos.length === 2 && !isNaN(pos[0]) && !isNaN(pos[1]));
  } catch (error) { console.error("Error parsing MULTILINESTRING:", wkt, error); return []; }
};
// parseGeoLocation removed - no longer needed
const createWaterdropIcon = () => L.divIcon({ html: ReactDOMServer.renderToString(<FormatColorResetIcon style={{ color: 'blue', fontSize: 30 }} />), className: 'waterdrop-icon', iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -30] });
const waterDropIcon = createWaterdropIcon();
// createPoliceSirenIcon removed


// --- HELPER COMPONENTS ---
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("Map rendering error caught:", error, errorInfo); }
  render() { if (this.state.hasError) { return <div>Map Error: {this.state.error?.message}</div>; } return this.props.children; }
}

// DynamicCenter removed

const CenterOnLeak = ({ leakMarker }) => {
  const map = useMap();
  useEffect(() => {
    // Check if leakMarker is an object with lat/lng
    if (leakMarker && typeof leakMarker.lat === 'number' && typeof leakMarker.lng === 'number') {
      map.setView([leakMarker.lat, leakMarker.lng], 17, { animate: true, duration: 1 });
    }
    // Note: This component doesn't handle string "lat,lng" format anymore as parseGeoLocation was removed
  }, [leakMarker, map]);
  return null;
};

const ZoomListener = ({ setShowMarkers }) => {
  const map = useMap();
  useEffect(() => {
    const handleZoom = () => {
      const currentZoom = map.getZoom();
      setShowMarkers(currentZoom >= 15); // Example threshold
    };
    map.on('zoomend', handleZoom);
    handleZoom(); // Initial check
    return () => { map.off('zoomend', handleZoom); };
  }, [map, setShowMarkers]);
  return null;
};

const CenterMap = ({ pipes, selectedPipe }) => {
  const map = useMap();
   useEffect(() => {
    if (selectedPipe?.positions?.length > 0) {
      map.fitBounds(selectedPipe.positions, { padding: [50, 50], maxZoom: 18 });
    } else if (!selectedPipe && pipes?.length > 0) {
      const allPositions = pipes.flatMap(p => p.positions || []);
      if (allPositions.length > 0) {
        try { map.fitBounds(allPositions, { padding: [20, 20] }); } catch (e) { map.setView([51.0447, -114.0719], 11); }
      }
    }
  }, [pipes, selectedPipe, map]);
  return null;
};

// This component makes the map instance available outside the MapContainer
const MapController = ({ setMapRef }) => {
  const map = useMap();
  
  // Effect to set the map ref when the map is ready
  useEffect(() => {
    if (map) {
      setMapRef(map);
      console.log("Map instance is ready and accessible via ref");
    }
    return () => setMapRef(null); // Clean up ref on unmount
  }, [map, setMapRef]);
  
  return null;
};

const Legend = () => (
   <div style={legendStyle}>
    <strong>Pipe Material</strong>
    {Object.entries(materialColors).map(([material, color]) => ( <div key={material}><span style={{ ...legendDotStyle, backgroundColor: color }}></span>{material}</div> ))}
    <hr style={{ margin: '5px 0' }} />
    <strong>Pipe Age (Years)</strong>
    <div><span style={{ ...legendDotStyle, backgroundColor: 'green' }}></span>0-10</div>
    <div><span style={{ ...legendDotStyle, backgroundColor: 'orange' }}></span>11-25</div>
    <div><span style={{ ...legendDotStyle, backgroundColor: 'red' }}></span>26-50</div>
    <div><span style={{ ...legendDotStyle, backgroundColor: 'gray' }}></span>50+ / Unknown</div>
  </div>
);


// --- MAIN PIPEMAP COMPONENT ---
const PipeMap = ({
  pipes = [],
  selectedPipe,
  setSelectedPipe = () => {},
  leakMarker, // Expects { lat, lng, type?, date? }
  setLeakMarker = () => {},
  // Add a prop to pass the map instance to parent
  setMapInstance = () => {},
}) => {

  // Use a stable ref instead of state for the map instance
  const mapRef = useRef(null);
  const [showBreakMarkers, setShowBreakMarkers] = useState(true); // For ZoomListener

  // Callback to set the map ref from the MapController component
  const setMapReference = useCallback((map) => {
    mapRef.current = map;
    // Pass map reference to parent component
    setMapInstance(map);
  }, [setMapInstance]);

  const processedPipes = useMemo(() => {
     return pipes.map(pipe => {
        const positions = parseMultiLineString(pipe.the_geom);
        const material = pipe.material || 'Unknown';
        const ageColor = getAgeColor(pipe.installed_dt);
        const materialColor = materialColors[material] || materialColors.Unknown;
        return { id: pipe.objectid || pipe.asset_id || Math.random(), positions, material, ageColor, materialColor, installedDate: pipe.installed_dt, diameter: pipe.diameter };
     }).filter(pipe => pipe.positions && pipe.positions.length > 0);
  }, [pipes]);

  const handlePipeClick = useCallback((pipe) => {
    setSelectedPipe(pipe);
  }, [setSelectedPipe]);

  const defaultCenter = [51.0447, -114.0719];
  const defaultZoom = 11;

  const wrapperStyle = { position: 'relative', height: '80vh', width: '100%' };

  return (
    <div style={{ position: 'relative', height: '80vh', width: '100%' }}>
      <ErrorBoundary>
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%' }} // Take dimensions from parent
          scrollWheelZoom={true}
          // No whenCreated - we use our custom MapController component instead
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />

          {/* MapController to set up map ref */}
          <MapController setMapRef={setMapReference} />

          {/* Pipe Polylines */}
          {processedPipes.map((pipe) => (
            <Polyline
              key={pipe.id}
              positions={pipe.positions}
              color={pipe.materialColor !== 'gray' ? pipe.materialColor : (pipe.ageColor || 'gray')}
              weight={selectedPipe?.id === pipe.id ? 6 : 3}
              opacity={selectedPipe?.id === pipe.id ? 1 : 0.7}
              eventHandlers={{ click: () => handlePipeClick(pipe) }}
            >
              <Popup>ID: {pipe.id}<br/>Material: {pipe.material}</Popup>
            </Polyline>
          ))}

          {/* Markers (Leak only) */}
          {/* Conditionally render based on zoom */}
          {showBreakMarkers && leakMarker && typeof leakMarker.lat === 'number' && typeof leakMarker.lng === 'number' && (
            <Marker position={[leakMarker.lat, leakMarker.lng]} icon={waterDropIcon}>
              <Popup>Water Leak Reported<br/>Type: {breakTypeDescriptions[leakMarker?.type] || leakMarker?.type || 'N/A'}</Popup>
            </Marker>
          )}
          {/* Police Marker removed */}

          {/* Map Centering Logic Components */}
          <CenterMap pipes={processedPipes} selectedPipe={selectedPipe} />
          <CenterOnLeak leakMarker={leakMarker} />
          {/* DynamicCenter removed */}
          <ZoomListener setShowMarkers={setShowBreakMarkers} />

          <Legend />

        </MapContainer>
      </ErrorBoundary>
    </div>
  );
};

export default PipeMap;
