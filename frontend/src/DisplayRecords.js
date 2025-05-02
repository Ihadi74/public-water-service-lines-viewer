// DisplayRecords.js
import React, { useEffect, useState } from "react";
import Pagination from "./Pagination";
import "./App.css";

// Helper function to format the date to YYYY, MMM format
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${year}, ${month}`;
}

// Determine pipe age color based on installed date (matching PipeMap legend)
const getAgeColor = (installedDate) => {
  if (!installedDate) return 'gray';
  const currentYear = new Date().getFullYear();
  const installationYear = new Date(installedDate).getFullYear();
  const age = currentYear - installationYear;
  return age <= 10 ? 'green' : age <= 25 ? 'orange' : age <= 50 ? 'red' : 'gray';
};

function DisplayRecords({
  buildingType,
  materialType,
  addressSearch,
  setSelectedPipe, // Provided from parent for updating the selected pipe
  selectedPipe     // Optionally provided to, for example, highlight the selected row
}) {
  const [pipes, setPipes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const limit = 100;

  useEffect(() => {
    const fetchPipes = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/pipes?page=${currentPage}&limit=${limit}&buildingType=${buildingType}&materialType=${materialType}&address=${addressSearch}`
        );
        const data = await response.json();
        console.log("Sample pipe data:", data.pipes[0]); // Debug first pipe object
        setTotalResults(data.total);
        setPipes(data.pipes);
      } catch (error) {
        console.error("Error fetching pipe data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPipes();
  }, [currentPage, buildingType, materialType, addressSearch]);

  if (loading) {
    return <p>Loading...</p>;
  }
  if (pipes.length === 0) {
    return <p>No data available...</p>;
  }

  return (
    <>
      <div
        style={{
          maxHeight: "500px",
          overflowY: "auto",
          border: "1px solid #ddd",
          borderRadius: "8px",
          position: "relative",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "16px",
            tableLayout: "fixed" // Fixed layout ensures columns respect width settings
          }}
        >
          <colgroup>
            <col style={{ width: "20%" }} />
            <col style={{ width: "30%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "20%" }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "8px" }}>Building Type</th>
              <th style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "8px" }}>Address</th>
              <th style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "8px" }}>Material</th>
              <th style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "8px" }}>Diameter (mm)</th>
              <th style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "8px" }}>Installed Date</th>
            </tr>
          </thead>
          <tbody>
            {pipes.map((pipe, index) => {
              // Get the age color for this pipe's installed date
              const ageColor = getAgeColor(pipe.INSTALLED_DATE || pipe.installedDate);
              
              return (
                <tr
                  key={index}
                  style={{
                    borderBottom: "1px solid #ddd",
                    cursor: "pointer",
                    backgroundColor: selectedPipe === pipe ? "#eef" : "transparent",
                    fontSize: "clamp(10px, 1vw, 16px)" // Responsive font size
                  }}
                  onClick={() => {
                    // On row click, update the selected pipe.
                    setSelectedPipe(pipe);
                  }}
                >
                  <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "6px" }}>
                    {pipe.buildingType || pipe.BUILDING_TYPE || 'N/A'}
                  </td>
                  <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "6px" }}>
                    {pipe.address || pipe.WATER_SERVICE_ADDRESS || 'N/A'}
                  </td>
                  <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "6px" }}>
                    {pipe.material || pipe.MATERIAL_TYPE || 'N/A'}
                  </td>
                  <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "6px" }}>
                    {pipe.diameter || pipe.PIPE_DIAMETER || pipe["PIPE_DIAMETER (mm)"] || 'N/A'}
                  </td>
                  <td style={{ 
                    overflow: "hidden", 
                    textOverflow: "ellipsis", 
                    whiteSpace: "nowrap", 
                    padding: "6px",
                    backgroundColor: ageColor,
                    color: ageColor === 'green' ? 'black' : 'white' // Improve text visibility
                  }}>
                    {(pipe.INSTALLED_DATE || pipe.installedDate) ? formatDate(pipe.INSTALLED_DATE || pipe.installedDate) : 'N/A'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalResults={totalResults}
        limit={limit}
      />
    </>
  );
}

export default DisplayRecords;
