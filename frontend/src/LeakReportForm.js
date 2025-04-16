
// components/LeakReportForm.js
import React, { useState, useEffect } from "react";
import axios from "axios";

const LeakReportForm = ({
  address,
  coordinates,
  setLeakMarker,
  setMapCenter,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [description, setDescription] = useState("");

  const handleSearchAddress = async (address, showAlert = true) => {
    if (!address || address.trim() === "") {
      if (showAlert) alert("Please enter a valid address.");
      return;
    }

    try {
      const query = encodeURIComponent(`${address}, Calgary`);
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (response.data.length > 0) {
        const location = response.data[0];
        setLeakMarker({
          lat: parseFloat(location.lat),
          lng: parseFloat(location.lon),
          address: location.display_name,
        });

        setMapCenter({ lat: location.lat, lng: location.lon }, 18);
      } else if (showAlert) {
        alert("No results found for this address in Calgary.");
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      if (showAlert) alert("Failed to fetch location. Try again.");
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (address.trim().length < 5) return;
      handleSearchAddress(address, false);
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [address]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = {
      name,
      email,
      contact,
      description,
      address,
    };

       try {
         await axios.post(
      "http://localhost:5001/api/leak-report",
      formData,
      {
        headers: {
          "Content-Type": "application/json", // Optional, depending on your backend
        },
      }
    );
      alert("Report submitted successfully!");
      setName("");
      setEmail("");
      setContact("");
      setDescription("");
    } catch (err) {
      console.error("Failed to submit leak report:", err);
      alert("Failed to send report. Please try again later.");
    }
  };

  return (
    <div style={styles.wrapper}>
      <h3 style={styles.heading}>Water Leak Report Form</h3>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>Your Name</label>
        <input
          type="text"
          placeholder="John Doe"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
        />

        <label style={styles.label}>Email Address</label>
        <input
          type="email"
          placeholder="your@email.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <label style={styles.label}>Phone Number</label>
        <input
          type="text"
          placeholder="(123) 456-7890"
          required
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          style={styles.input}
        />

        <label style={styles.label}>Description of the Leak</label>
        <textarea
          placeholder="Briefly describe the issue"
          rows="4"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={styles.textarea}
        />

        <button type="submit" style={styles.button}>
          Report Leak
        </button>
      </form>
    </div>
  );
};

const styles = {
  wrapper: {
    maxWidth: "400px",
    margin: "10px auto",
    padding: "20px",
    backgroundColor: "#f5f5f5",
    borderRadius: "10px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  },
  heading: {
    marginBottom: "5px",
    textAlign: "center",
    color: "#0077cc",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    marginBottom: "5px",
    fontWeight: "bold",
  },
  input: {
    padding: "8px",
    marginBottom: "15px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  textarea: {
    padding: "8px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    marginBottom: "15px",
    resize: "vertical",
  },
  button: {
    backgroundColor: "#0077cc",
    color: "white",
    padding: "10px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default LeakReportForm;

