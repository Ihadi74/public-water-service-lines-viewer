import React from "react";
import { useState, useEffect } from "react";
import "./App.css";

function Pagination({ currentPage, setCurrentPage, totalResults, limit }) {
  const [goToPageInput, setGoToPageInput] = useState("");
  const totalPages = totalResults ? Math.ceil(totalResults / limit) : 1;
  useEffect(() => {
    setGoToPageInput(currentPage);
  }, [currentPage]);


  if (!totalResults) return null; 

  return (
    <div style={{ textAlign: "right", marginTop: "20px", marginBottom: "20px" }}>
      <button
        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
        disabled={currentPage === 1}
      >
        Previous
      </button>

      <span style={{ margin: "0 10px" }}>Page {currentPage}</span>
      <button
        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
        disabled={currentPage === totalPages}
      >
        Next
      </button>

      <div>
        <label htmlFor="goToPage">Go to page:</label>{" "}
        <input
          id="goToPage"
          type="number"
          min="1"
          max={totalPages}
          value={goToPageInput}
          onChange={(e) => setGoToPageInput(e.target.value)}
          style={{ width: "60px" }}
        />
        <button
          onClick={() => {
            const pageNum = parseInt(goToPageInput, 10);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
              setCurrentPage(pageNum);
              setGoToPageInput("");
            }
          }}
        >
          Go
        </button>
      </div>
    </div>
  );
}

export default Pagination;