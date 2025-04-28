import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PipeMap from './PipeMap';
import DisplayRecords from './DisplayRecords';
import Filters from './Filters';
import Header from './Header';
import NotificationButton from './NotificationButton';

function App() {
  // Existing state for pipes and filters
  const [buildingType, setBuildingType] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [addressSearch, setAddressSearch] = useState("");
  const [pipes, setPipes] = useState([]);
  const [address, setAddress] = useState("");
  const [leakMarker, setLeakMarker] = useState(null);
  const [selectedPipe, setSelectedPipe] = useState(null);

  // New state for tweet scraping (latest across 3 accounts)
  const [latestTweet, setLatestTweet] = useState(null);
  const [tweetLoading, setTweetLoading] = useState(false);

  // Existing search address handler
  const handleSearchAddress = () => {
    console.log("Searching for address:", address);
  };

  // Function to fetch the latest tweet from all three accounts
  const fetchLatestTweetAll = async () => {
    setTweetLoading(true);
    try {
      const response = await axios.get("http://localhost:5001/api/latest-tweet-all");
      setLatestTweet(response.data.tweet);
    } catch (error) {
      console.error("Error fetching latest tweet:", error);
      setLatestTweet({ text: "Error fetching tweet", account: "", timestamp: "" });
    } finally {
      setTweetLoading(false);
    }
  };

  // Automatically fetch the latest tweet every 60 seconds.
  useEffect(() => {
    // Immediately fetch on mount.
    fetchLatestTweetAll();

    // Set up an interval to fetch the tweet every 60 seconds (60000 ms)
    const intervalId = setInterval(() => {
      fetchLatestTweetAll();
    }, 60000);

    // Cleanup the interval on component unmount.
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchPipes = async () => {
      try {
        const response = await axios.get("http://localhost:5001/api/pipes", {
          params: {
            buildingType,
            materialType,
            address: addressSearch,
          },
        });
        setPipes(response.data.pipes);
      } catch (error) {
        console.error("Failed to fetch pipes:", error);
      }
    };

    fetchPipes();

    return () => {
      console.log("Component unmounted, cleanup here!");
    };
  }, [buildingType, materialType, addressSearch]);

  return (
    <>
      <Header
        buildingType={buildingType}
        materialType={materialType}
        addressSearch={addressSearch}
      />
      <Filters
        setBuildingType={setBuildingType}
        setMaterialType={setMaterialType}
        setAddressSearch={setAddressSearch}
        handleSearchAddress={handleSearchAddress}
        setAddress={setAddress}
        address={address}
      />
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          padding: "20px",
          justifyContent: "space-between",
        }}
      >
        {/* Map and Table */}
        <div style={{ flex: "1 1 50%", minWidth: "40%" }}>
          <PipeMap
            pipes={pipes}
            leakMarker={leakMarker}
            setLeakMarker={setLeakMarker}
            address={address}
            selectedPipe={selectedPipe}
            setSelectedPipe={setSelectedPipe}
          />
        </div>
        <div style={{ flex: "1 1 45%", overflowY: "auto" }}>
          <DisplayRecords
            buildingType={buildingType}
            materialType={materialType}
            addressSearch={addressSearch}
            selectedPipe={selectedPipe}
            setSelectedPipe={setSelectedPipe}
          />
        </div>
        <NotificationButton />
      </div>

      {/* Inline Tweet Scraper UI for Latest Tweet Across All 3 Accounts */}
      <div
        style={{
          padding: "20px",
          borderTop: "1px solid #ccc",
          marginTop: "20px",
        }}
      >
        <h2>Latest Tweet (from all 3 accounts)</h2>
        {tweetLoading ? (
          <p>Fetching latest tweet...</p>
        ) : (
          latestTweet && (
            <div
              style={{
                marginTop: "10px",
                padding: "10px",
                border: "1px solid #ccc",
                backgroundColor: "#f9f9f9",
              }}
            >
              <strong>Account:</strong> {latestTweet.account} <br />
              <strong>Tweet:</strong> {latestTweet.text} <br />
              <strong>Timestamp:</strong> {latestTweet.timestamp}
            </div>
          )
        )}
      </div>
    </>
  );
}

export default App;
