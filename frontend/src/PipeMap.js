import React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";

import { useMap } from "react-leaflet";
import { useEffect } from "react";
import LeakReportForm from "./LeakReportForm";
import "./App.js";
// Helper to get color by age
function getAgeColor(installedDate) {
  if (!installedDate) return "gray";
  const currentYear = new Date().getFullYear();
  const yearInstalled = new Date(installedDate).getFullYear();
  const age = currentYear - yearInstalled;

  if (age <= 10) return "green";
  if (age <= 25) return "orange";
  if (age <= 50) return "red";
  return "gray";
}

// Legend dot style
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

const parseMultiLineString = (wkt) => {
  // Remove the prefix and brackets
  const cleaned = wkt.replace("MULTILINESTRING ((", "").replace("))", "");

  // Split into coordinate pairs
  return cleaned.split(", ").map((pair) => {
    const [lng, lat] = pair.trim().split(" ").map(Number);
    return [lat, lng]; // Leaflet uses [lat, lng]
  });
};

const FitBounds = ({ pipes }) => {
  const map = useMap();

  useEffect(() => {
    if (!pipes || pipes.length === 0) return;

    const allCoordinates = [];

    pipes.forEach((pipe) => {
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

const PipeMap = ({ pipes, leakMarker, mapCenter }) => {
  if (!Array.isArray(pipes)) {
    return <p>Loading map data...</p>;
  }
  

  return (
    <div style={{ position: "relative" }}>
      <MapContainer
        center={[51.045, -114.057]}
        zoom={10}
        scrollWheelZoom={false}
        dragging={true}
        style={{ height: "600px", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds pipes={pipes} />

        {leakMarker && (
          <Marker position={[leakMarker.lat, leakMarker.lng]}>
            <Popup>
              <span>{leakMarker.address}</span>
              <LeakReportForm
                address={leakMarker.address}
                coordinates={leakMarker.coordinates}
                setLeakMarker={leakMarker.setMapCenter}
                setMapCenter={leakMarker.setMapCenter}
                //selectedCoordinates={leakMarker.selectedCoordinates}
               //setSelectedCoordinates={setSelectedCoordinates}
                //coordinates={{ lat: leakMarker.lat, lng: leakMarker.lng }}
               // address={leakMarker.address}
              />
            </Popup>
          </Marker>
        )}

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
                {pipe.MATERIAL_TYPE}, {pipe["PIPE_DIAMETER (mm)"]}mm
              </Popup>
              {/* ✅ Tooltip on Hover */}
              <Tooltip sticky>
                <div>
                  <strong>{pipe.BUILDING_TYPE}</strong>
                  <br />
                  Diameter: {pipe["PIPE_DIAMETER (mm)"]}mm
                  <br />
                  Installed: {pipe.INSTALLED_DATE}
                </div>
              </Tooltip>
            </Polyline>
          );
        })}
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
      </div>
    </div>
  );
};

export default PipeMap;
