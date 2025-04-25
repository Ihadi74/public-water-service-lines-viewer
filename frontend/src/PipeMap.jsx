import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup,  useMap } from 'react-leaflet';
import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import Pressure from './Pressure';
import FormatColorResetIcon from '@mui/icons-material/FormatColorReset';
import LeakReportForm from './LeakReportForm';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const breakTypeMapping = {
  A: "Full Circular",
  B: "Split",
  C: "Corrosion",
  D: "Fitting",
  E: "Joint",
  F: "Diagonal Crack",
  G: "Hole",
  S: "Saddle",
};

const getAgeColor = (installedDate) => {
  if (!installedDate) return 'gray';

  const currentYear = new Date().getFullYear();
  const installationYear = new Date(installedDate).getFullYear();
  const age = currentYear - installationYear;

  return age <= 10 ? 'green' : age <= 25 ? 'orange' : age <= 50 ? 'red' : 'gray';
};


const parseMultiLineString = (wkt) => {
  if (!wkt) return [];
  return wkt.replace("MULTILINESTRING ((", "").replace("))", "").split(", ").map((pair) => {
    const [lng, lat] = pair.trim().split(" ").map(Number);
    return [lat, lng];
  });
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

const parseGeoLocation = (geoString) => {
  if (!geoString) return null;
  return geoString.split(",").map(Number);
};

const CenterOnLeak = ({ leakMarker }) => {
  const map = useMap();
  useEffect(() => {
    if (leakMarker?.lat && leakMarker?.lng) {
      map.setView([leakMarker.lat, leakMarker.lng], 18);
    }
  }, [leakMarker, map]);
  return null;
};

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
  }, [pipes, map, selectedPipe]);

  return null;
};

const PipeMap = ({ pipes, selectedPipe, leakMarker, address, setLeakMarker }) => {
  const [waterBreaks, setWaterBreaks] = useState([]);
  const [polygonData, setPolygonData] = useState([]);
  const [showMarkers, setShowMarkers] = useState(false);

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
              break_type_description: breakTypeMapping[b.break_type] || "Unknown",
              status: b.status,
              coordinates: b.point?.coordinates ? [b.point.coordinates[1], b.point.coordinates[0]] : null,
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

  return (
    <MapContainer center={[51.0443, -114.0631]} zoom={10.5} maxZoom={20} minZoom={3} scrollWheelZoom={true} style={{ height: '600px', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <CombinedCenterMap pipes={pipes} selectedPipe={selectedPipe} />
      <ZoomListener setShowMarkers={setShowMarkers} />
      {showMarkers && activeWaterBreaks.map((b, idx) =>
        b.coordinates && (
          <Marker key={idx} position={b.coordinates} icon={createWaterdropIcon()}>
            <Popup>
              <div>
                <strong>Break Date:</strong> {b.break_date?.split('T')[0]}<br />
                <strong>Break Type:</strong> {b.break_type} ({b.break_type_description})
              </div>
            </Popup>
          </Marker>
        )
      )}
      {leakMarker && (
        <Marker position={[leakMarker.lat, leakMarker.lng]}>
          <Popup>
            <LeakReportForm address={leakMarker.address} coordinates={[leakMarker.lat, leakMarker.lng]} setLeakMarker={setLeakMarker} />
          </Popup>
        </Marker>
      )}
      <CenterOnLeak leakMarker={leakMarker} />
      <Pressure data={polygonData} />
    </MapContainer>
  );
};

export default PipeMap;
