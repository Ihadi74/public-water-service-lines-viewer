import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useMap } from 'react-leaflet';

// Helper function to get color based on break status
function getStatusColor(status) {
  if (!status) return 'gray';
  const statusColors = {
    ACTIVE: 'red',
    INACTIVE: 'orange',
    RETIRED: 'gray',
  };
  return statusColors[status] || 'blue';
}

// Custom Leaflet Icon
const createCustomIcon = (color) => {
  return L.divIcon({
    className: `custom-marker-${color}`,
    html: `<div style="background-color:${color}; width:14px; height:14px; border-radius:50%;"></div>`,
  });
};

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Auto-fit map bounds based on water breaks
const FitBounds = ({ waterBreaks }) => {
  const map = useMap();

  useEffect(() => {
    if (!waterBreaks || waterBreaks.length === 0) return;

    const allCoordinates = waterBreaks
      .filter(breakInfo => breakInfo.coordinates) // Ensure valid coordinates
      .map(breakInfo => breakInfo.coordinates);

    if (allCoordinates.length > 0) {
      map.fitBounds(allCoordinates);
    }
  }, [waterBreaks, map]);

  return null;
};

// WaterBreakMap Component
const WaterBreakMap = () => {
  const [waterBreaks, setWaterBreaks] = useState([]);
  const [showMarkers, setShowMarkers] = useState(false);

  // Fetch water break data with filtering for post-2000 entries
  useEffect(() => {
    async function fetchWaterBreaks() {
      try {
        const response = await fetch('https://data.calgary.ca/resource/dpcu-jr23.json');
        if (!response.ok) throw new Error('Failed to fetch water break data');

        const data = await response.json();

        // Filter data to include only water breaks from 2000 onwards
        const filteredData = data.filter(breakInfo => {
          const breakYear = new Date(breakInfo.break_date).getFullYear();
          return (
            breakYear >= 2000 &&
            breakInfo.status === "ACTIVE" && // Filter only ACTIVE status
            breakInfo.point?.coordinates
          );
        });

        // Transform data into expected format for Leaflet markers
        const formattedData = filteredData.map(breakInfo => ({
          break_date: breakInfo.break_date,
          break_type: breakInfo.break_type,
          status: breakInfo.status,
          coordinates: [
            parseFloat(breakInfo.point.coordinates[1]),
            parseFloat(breakInfo.point.coordinates[0])
          ]
        }));

        setWaterBreaks(formattedData);
      } catch (error) {
        console.error('Error fetching water breaks:', error);
      }
    }

    fetchWaterBreaks();
  }, []);

  // Listen to map zoom level
  const ZoomListener = () => {
    const map = useMap();

    useEffect(() => {
      const onZoom = () => {
        const zoomLevel = map.getZoom();
        const maxZoom = map.getMaxZoom(); // Get maximum zoom level of the map
        setShowMarkers(zoomLevel === maxZoom - 4); // Display markers only at the second-highest zoom level
      };

      map.on('zoomend', onZoom);

      return () => {
        map.off('zoomend', onZoom);
      };
    }, [map]);

    return null;
  };

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer
        center={[51.045, -114.057]}
        zoom={10}
        scrollWheelZoom={true}
        dragging={true}
        style={{ height: '600px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <FitBounds waterBreaks={waterBreaks} />
        <ZoomListener />

        {/* Display Active Water Break Markers Only When at Second-Highest Zoom Level */}
        {showMarkers &&
          waterBreaks.map((breakInfo, index) => (
            breakInfo.coordinates ? (
              <Marker
                key={index}
                position={breakInfo.coordinates}
                icon={createCustomIcon(getStatusColor(breakInfo.status))}
              >
                <Popup>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100px', // Adjust width
                    height: '100px', // Adjust height
                    backgroundColor: 'lightblue',
                    borderRadius: '50%', // Circular shape
                    textAlign: 'center',
                    overflow: 'hidden', // Prevent text overflow
                    fontSize: '9px', // Adjust font size
                    padding: '0',
                    border: 'none',
                  }}>
                    <div>
                      <strong>Break Date:</strong> {breakInfo.break_date.split('T')[0]} <br /> {/* Only show date */}
                      <strong>Break Type:</strong> {breakInfo.break_type} <br />
                      <strong>Status:</strong> {breakInfo.status}
                    </div>
                  </div>
                </Popup>
                <Tooltip sticky>
                  <div>
                    <strong>Break Type:</strong> {breakInfo.break_type} <br />
                    <strong>Status:</strong> {breakInfo.status} <br />
                    <strong>Break Date:</strong> {breakInfo.break_date.split('T')[0]} {/* Only show date */}
                  </div>
                </Tooltip>
              </Marker>
            ) : null
          ))
        }
      </MapContainer>
    </div>
  );
};

export default WaterBreakMap;

