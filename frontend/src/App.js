import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PipeMap from './PipeMap';

function App() {
  const [pipes, setPipes] = useState([]);
  const [buildingType, setBuildingType] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [addressSearch, setAddressSearch] = useState('');
  const [goToPageInput, setGoToPageInput] = useState('');


  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const limit = 100;
  const totalPages = Math.ceil(totalResults / limit);
  const handleFilterChange = (e) => setBuildingType(e.target.value);
  const handleMaterialChange = (e) => setMaterialType(e.target.value);
  const handleAddressSearch = (e) => setAddressSearch(e.target.value.toLowerCase());

  useEffect(() => {
    const fetchPipes = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/pipes', {
          params: {
            page: currentPage,
            limit,
            address: addressSearch || undefined,
            buildingType: buildingType || undefined,
            materialType: materialType || undefined
          }
        });

        setPipes(response.data.pipes);
        setTotalResults(response.data.total); // ✅ Use this instead of response outside
      } catch (error) {
        console.error("Error fetching pipe data:", error);
      }
    };

    fetchPipes();
  }, [currentPage, addressSearch, buildingType, materialType]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Public Water Service Lines</h1>
      <p>{totalResults} results found</p> {/* ✅ Updated to use safe variable */}

      {/* Filters... (unchanged) */}
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

      <div>
        <label htmlFor="addressSearch">Filter by Address:</label>{' '}
        <input
          id="addressSearch"
          type="text"
          value={addressSearch}
          onChange={handleAddressSearch}
          placeholder="e.g., MARTHA'S HAVEN"
        />
      </div>

      {/* Pagination */}
      <div style={{ marginTop: '10px' }}>
        <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
          Previous
        </button>
  
        <span style={{ margin: '0 10px' }}>Page {currentPage} of {totalPages}</span>
  
        <button
          onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>

        <div style={{ marginTop: '10px' }}>
          <label htmlFor="goToPage">Go to page:</label>{' '}
          <input
            id="goToPage"
            type="number"
            min="1"
            max={totalPages}
            value={goToPageInput}
            onChange={(e) => setGoToPageInput(e.target.value)}
            style={{ width: '60px' }}
          />
        <button
          onClick={() => {
            const pageNum = parseInt(goToPageInput, 10);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
              setCurrentPage(pageNum);
              setGoToPageInput('');
            }
          }}
         >
            Go
          </button>
        </div>
      </div>


      {/* Map and Table */}
      <PipeMap pipes={pipes} />

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
            {pipes.map((pipe, index) => (
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
