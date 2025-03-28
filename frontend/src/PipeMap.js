import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Optional: Fix default icon path issue in Leaflet + Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const PipeMap = ({ pipes }) => {
  return (
    <MapContainer center={[51.045, -114.057]} zoom={12} style={{ height: '500px', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      {pipes.map((pipe, index) => {
        const coordinates = pipe.line?.coordinates?.[0]; // Adjust if your structure differs
        if (!coordinates) return null;

        const [lng, lat] = coordinates[0]; // Take the first point
        return (
          <Marker key={index} position={[lat, lng]}>
            <Popup>
              <strong>{pipe.BUILDING_TYPE}</strong><br />
              {pipe.WATER_SERVICE_ADDRESS}<br />
              {pipe.MATERIAL_TYPE}, {pipe["PIPE_DIAMETER (mm)"]}mm
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default PipeMap;
