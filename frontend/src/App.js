import PipeMap from './PipeMap';
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [pipes, setPipes] = useState([]);

  const [buildingType, setBuildingType] = useState('');

  const [materialType, setMaterialType] = useState('');

  const handleFilterChange = (e) => {
    setBuildingType(e.target.value);
  };

  const [addressSearch, setAddressSearch] = useState('');

  const handleAddressSearch = (e) => {
  setAddressSearch(e.target.value.toLowerCase());
  };

  const handleMaterialChange = (e) => {
    setMaterialType(e.target.value);
  }
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

  const filteredPipes = pipes
  .filter(pipe =>
    (!buildingType || pipe.BUILDING_TYPE === buildingType) &&
    (!materialType || pipe.MATERIAL_TYPE === materialType) &&
    (!addressSearch || (pipe.WATER_SERVICE_ADDRESS && pipe.WATER_SERVICE_ADDRESS.toLowerCase().includes(addressSearch)))
  )
  .slice(0, 5000);


  return (
    <div style={{ padding: '20px' }}>
      <h1>Public Water Service Lines</h1>
  
      {/* Filter Dropdown */}
      <div>
        <label htmlFor="buildingFilter">Filter by Building Type:</label>{' '}
        <select id="buildingFilter" onChange={handleFilterChange} value={buildingType}>
          <option value="">All</option>
          <option value="Single Family">Single Family</option>
          <option value="Commercial">Commercial</option>
          <option value="Multi Family">Multi Family</option>
          <option value="Duplex">Duplex</option>
        </select>
      </div>
  
      <div>
        <label htmlFor="materialFilter">Filter by Material Type:</label>{' '}
        <select id="materialFilter" onChange={handleMaterialChange} value={materialType}>
          <option value="">All</option>
          <option value="Copper">Copper</option>
          <option value="Lead">Lead</option>
          <option value="Cast Iron">Cast Iron</option>
          <option value="Cross-linked Polyethylene (PEX)">PEX</option>
          <option value="Unknown">Unknown</option>
        </select>
      </div>

      <label htmlFor="addressSearch">Filter by Address:</label>{' '}
      <input
        id="addressSearch"
        type="text"
        value={addressSearch}
        onChange={handleAddressSearch}
        placeholder="e.g., MARTHA'S HAVEN"
      />
  
      {/* 🗺️ Map Goes Here */}
      <PipeMap pipes={filteredPipes} />
        
  }
      
  
      {/* Safety Check */}
      {(!Array.isArray(pipes) || pipes.length === 0) ? (
        <p>Loading or no data available...</p>
      ) : (
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
            {filteredPipes.slice(0, 500).map((pipe, index) => (
              <tr key={index}>
                <td>{pipe.BUILDING_TYPE}</td>
                <td>{pipe.WATER_SERVICE_ADDRESS}</td>
                <td>{pipe.MATERIAL_TYPE}</td>
                <td>{pipe["PIPE_DIAMETER (mm)"]}</td>
                <td>{pipe.INSTALLED_DATE}</td>
              </tr>
            ))}

          </tbody>
        </table>
      )}
    </div>
  );
  
  
}

export default App;