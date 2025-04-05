import React, { useState, useEffect } from "react";

function Header({ buildingType, materialType, addressSearch }) {
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    const fetchTotalResults = async () => {
      try {
        // Make the API call with filters applied as query parameters
        const response = await fetch(
          `http://localhost:5001/api/pipes?buildingType=${buildingType}&materialType=${materialType}&address=${addressSearch}`
        );
        const data = await response.json();
        setTotalResults(data.total); // Update the count based on filtered results
      } catch (error) {
        console.error("Error fetching total results:", error);
      }
    };

    fetchTotalResults();
  }, [buildingType, materialType, addressSearch]); // Re-fetch whenever filters change

  return (
    <div>
      <h1>Public Water Service Lines</h1>
      <p>{totalResults} results found</p>
    </div>
  );
}

export default Header;
