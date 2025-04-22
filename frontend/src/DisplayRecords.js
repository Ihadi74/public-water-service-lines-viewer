// DisplayRecords.js
import React, { useEffect, useState } from "react";
import Pagination from "./Pagination";
import "./App.css";

function DisplayRecords({ buildingType, materialType, addressSearch, onRowClick }) {
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
        // console.log("API Response:", data);
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
      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalResults={totalResults}
        limit={limit}
      />

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
          }}
        >
          <thead
            style={{
              position: "sticky",
              top: "0",
              backgroundColor: "#007bff",
              color: "white",
              zIndex: "2",
            }}
          >
            <tr style={{ backgroundColor: "#007bff", color: "white" }}>
              <th>Building Type</th>
              <th>Address</th>
              <th>Material</th>
              <th>Diameter (mm)</th>
              <th>Installed Date</th>
              <th>Geo Location</th>
            </tr>
          </thead>
          <tbody>
            {pipes.map((pipe, index) => (
              <tr
                key={index}
                style={{ borderBottom: "1px solid #ddd", cursor: "pointer" }}
                onClick={() => {
                  if (onRowClick) {
                    onRowClick(pipe);
                  }
                }}
              >
                <td>{pipe.BUILDING_TYPE}</td>
                <td>{pipe.WATER_SERVICE_ADDRESS}</td>
                <td>{pipe.MATERIAL_TYPE}</td>
                <td>{pipe["PIPE_DIAMETER (mm)"]}</td>
                <td>{pipe.INSTALLED_DATE}</td>
                <td>{pipe.GEO_LOCATION}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default DisplayRecords;
