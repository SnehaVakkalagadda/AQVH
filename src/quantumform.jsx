import React, { useState } from "react";
import axios from "axios";

function QuantumForm() {
  const [bits, setBits] = useState("");
  const [shots, setShots] = useState("");
  const [circuitImg, setCircuitImg] = useState(null);
  const [histogramImg, setHistogramImg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("https://aqvh-backend.onrender.com", {
        bits,
        shots: parseInt(shots),
      });

      if (response.data.ok) {
        const result = response.data.data; // access "data"
        setCircuitImg("data:image/png;base64," + result.circuit_png_base64);
        setHistogramImg("data:image/png;base64," + result.histogram_png_base64);
        } else {
            alert("Error: " + response.data.error);
            }

    } catch (error) {
      console.error(error);
      alert("Failed to connect to backend");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Quantum Circuit Generator</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Bits: </label>
          <input
            type="text"
            value={bits}
            onChange={(e) => setBits(e.target.value)}
          />
        </div>
        <div>
          <label>Shots: </label>
          <input
            type="number"
            value={shots}
            onChange={(e) => setShots(e.target.value)}
          />
        </div>
        <button type="submit">Run</button>
      </form>

      {circuitImg && (
        <div>
          <h3>Circuit</h3>
          <img src={circuitImg} alt="Quantum Circuit" />
        </div>
      )}

      {histogramImg && (
        <div>
          <h3>Histogram</h3>
          <img src={histogramImg} alt="Histogram" />
        </div>
      )}
    </div>
  );
}

export default QuantumForm;
