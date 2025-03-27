import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [pipes, setPipes] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5001/api/pipes')
      .then(response => {
        console.log("Data from API:", response.data); // ✅ Add this
        setPipes(response.data);
      })
      .catch(error => {
        console.error('Error fetching pipe data:', error);
      });
  }, []);  

  return (
    <div style={{ padding: '20px' }}>
      <h1>Public Water Service Lines</h1>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Building Type</th>
            <th>Address</th>
            <th>Material</th>
            <th>Diameter (mm)</th>
            <th>Installed Date</th>
          </tr>
        </thead>
        <tbody>
        {pipes.slice(0, 20).map((pipe, index) => {
          console.log("Pipe:", pipe); // Log to console
          return (
            <tr key={index}>
            <td>{pipe.BUILDING_TYPE}</td>
            <td>{pipe.WATER_SERVICE_ADDRESS}</td>
            <td>{pipe.MATERIAL_TYPE}</td>
            <td>{pipe["PIPE_DIAMETER (mm)"]}</td>
            <td>{pipe.INSTALLED_DATE}</td>
    </tr>
  );
})}

        </tbody>
      </table>
    </div>
  );
}

export default App;

