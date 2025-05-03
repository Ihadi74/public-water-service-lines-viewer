import React, { useState } from "react";
import EmergencyShareIcon from '@mui/icons-material/EmergencyShare';

const NotificationButton = ({ setLeakMarker, setMapCenter }) => {
  const [isLocating, setIsLocating] = useState(false);
  const [isMarkerPlaced, setIsMarkerPlaced] = useState(false);

  const handleLocateMe = () => {
    if (isMarkerPlaced) {
      // Remove the marker if it's already placed
      setLeakMarker(null);
      setIsMarkerPlaced(false);
      return;
    }

    setIsLocating(true);

    // Request user's geolocation
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Use reverse geocoding to get address (for demonstration purposes)
        // In a production app, you'd use a geocoding service like Google Maps or Mapbox
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          .then(response => response.json())
          .then(data => {
            const address = data.display_name || "Your Current Location";
            
            // Place marker at user's location
            setLeakMarker({
              lat: latitude,
              lng: longitude,
              address: address,
              showLeakReportForm: true, // Special flag to show form
              iconType: "emergencyShare", // For custom icon rendering
              formProps: {
                address: address,
                coordinates: { lat: latitude, lng: longitude }
              }
            });

            // Center map on user's location
            if (setMapCenter) {
              setMapCenter({ lat: latitude, lng: longitude });
            }
            
            setIsMarkerPlaced(true);
            setIsLocating(false);
          })
          .catch(err => {
            console.error("Error getting address:", err);
            
            // Still place marker even if address lookup fails
            setLeakMarker({
              lat: latitude,
              lng: longitude,
              address: "Your Current Location",
              showLeakReportForm: true,
              iconType: "emergencyShare",
              formProps: {
                address: "Location coordinates: " + latitude.toFixed(6) + ", " + longitude.toFixed(6),
                coordinates: { lat: latitude, lng: longitude }
              }
            });
            
            if (setMapCenter) {
              setMapCenter({ lat: latitude, lng: longitude });
            }
            
            setIsMarkerPlaced(true);
            setIsLocating(false);
          });
      },
      (error) => {
        let errorMessage = "Unable to get your location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location services.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "The request to get your location timed out.";
            break;
          default:
            errorMessage = "An unknown error occurred.";
        }
        
        alert(errorMessage);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <button
      className={`location-btn ${isMarkerPlaced ? "active" : ""} ${isLocating ? "locating" : ""}`}
      onClick={handleLocateMe}
      disabled={isLocating}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 15px',
        borderRadius: '4px',
        fontWeight: 'bold',
        cursor: isLocating ? 'wait' : 'pointer',
        border: 'none',
        backgroundColor: isMarkerPlaced ? '#c0392b' : '#e74c3c',
        color: 'white',
        opacity: isLocating ? 0.7 : 1
      }}
    >
      <EmergencyShareIcon fontSize="small" style={{ marginRight: '5px' }} />
      {isLocating ? "Locating..." : 
       isMarkerPlaced ? "Cancel Report" : "Report Water Issue"}
    </button>
  );
};

export default NotificationButton;
