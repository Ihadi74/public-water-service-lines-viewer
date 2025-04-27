import React, { useEffect, useState } from "react";
import Pagination from "./Pagination";
import "./App.css";

// Helper function to format the date
function formatDate(dateString) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", options); // Format as "November 10, 2021"
}

function DisplayRecords({
  buildingType,
  materialType,
  addressSearch,
  setSelectedPipe,
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
          `http://localhost:5001/api/pipes?page=${currentPage}&limit=${limit}&buildingType=${buildingType}&materialType=${materialType}&address=${addressSearch}`
        );
        const data = await response.json();
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

  return pipes.length === 0 ? (
    <p>No data available...</p>
  ) : (
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
          }}
        >
          <thead
          
          >
            <tr>
              <th>Building Type</th>
              <th>Address</th>
              <th>Material</th>
              <th>Diameter (mm)</th>
              <th style={{ whiteSpace: "nowrap", width: "200px" }}>
                Installed Date
              </th>
            </tr>
          </thead>
          <tbody>
            {pipes.map((pipe, index) => (
              <tr
                key={index}
                style={{ borderBottom: "1px solid #ddd", cursor: "pointer" }}
              >
                <td style={{ padding: "8px" }}>{pipe.BUILDING_TYPE}</td>
                <td style={{ padding: "8px" }}>{pipe.WATER_SERVICE_ADDRESS}</td>
                <td style={{ padding: "8px" }}>{pipe.MATERIAL_TYPE}</td>
                <td style={{ padding: "8px" }}>{pipe["PIPE_DIAMETER (mm)"]}</td>
                <td style={{ padding: "8px", whiteSpace: "nowrap" }}>
                  {formatDate(pipe.INSTALLED_DATE)}
                </td>
              </tr>
            ))}
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
