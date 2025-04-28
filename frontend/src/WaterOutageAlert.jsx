// frontend/src/WaterOutageAlert.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function WaterOutageAlert() {
  const [alertContent, setAlertContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Using useCallback to keep fetchAlert reference stable
  const fetchAlert = useCallback(async () => {
    try {
      setLoading(true);
      // Use your backend endpoint to fetch the alert data
      const response = await axios.get('http://localhost:5001/api/wateroutage');
      setAlertContent(response.data.content);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  },); // Empty dependency array because fetchAlert only uses stable state updater functions

  useEffect(() => {
    fetchAlert();
    // Set an interval to refresh the alert every 5 minutes
    const intervalId = setInterval(fetchAlert, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [fetchAlert]); // Include fetchAlert in the dependency array

  if (loading) {
    return <div>Loading water outage information...</div>;
  }

  if (error) {
    return <div>Error fetching water outage information: {error.message}</div>;
  }

  return (
    <div>
      <h2>Water Outage Alert</h2>
<div>{alertContent || "No alert data available."}</div>
    </div>
  );
}

export default WaterOutageAlert;