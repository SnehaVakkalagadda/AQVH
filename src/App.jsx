import { useState } from "react";
import axios from "axios";
import "./App.css";

const decodingInfo = {
  "00": {
    description: `Bits "00" are decoded by measuring the qubits directly after entanglement. No additional gates are needed.`,
    svg: (
      <svg width="100%" height="100" viewBox="0 0 320 100">
        <line x1="10" y1="20" x2="310" y2="20" stroke="#fff" strokeWidth="2"/>
        <line x1="10" y1="60" x2="310" y2="60" stroke="#fff" strokeWidth="2"/>
        <text x="0" y="25" fontSize="12" fill="#fff">Q0</text>
        <text x="0" y="65" fontSize="12" fill="#fff">Q1</text>
        <rect x="250" y="10" width="20" height="20" fill="rgba(0,224,255,0.6)" stroke="#00e0ff" strokeWidth="1"/>
        <text x="260" y="25" fontSize="12" fill="#000" textAnchor="middle">M</text>
        <rect x="250" y="50" width="20" height="20" fill="rgba(0,224,255,0.6)" stroke="#00e0ff" strokeWidth="1"/>
        <text x="260" y="65" fontSize="12" fill="#000" textAnchor="middle">M</text>
      </svg>
    )
  },
  "10": {
    description: `Bits "01" require a Pauli-X (NOT) gate on Qubit 0 before measurement.`,
    svg: (
      <svg width="100%" height="100" viewBox="0 0 320 100">
        <line x1="10" y1="20" x2="310" y2="20" stroke="#fff" strokeWidth="2"/>
        <line x1="10" y1="60" x2="310" y2="60" stroke="#fff" strokeWidth="2"/>
        <text x="0" y="25" fontSize="12" fill="#fff">Q0</text>
        <text x="0" y="65" fontSize="12" fill="#fff">Q1</text>
        <rect x="50" y="10" width="20" height="20" fill="rgba(255,0,0,0.6)" stroke="#ff0000" strokeWidth="1"/>
        <text x="60" y="25" fontSize="12" fill="#000" textAnchor="middle">X</text>
        <rect x="250" y="10" width="20" height="20" fill="rgba(0,224,255,0.6)" stroke="#00e0ff" strokeWidth="1"/>
        <text x="260" y="25" fontSize="12" fill="#000" textAnchor="middle">M</text>
        <rect x="250" y="50" width="20" height="20" fill="rgba(0,224,255,0.6)" stroke="#00e0ff" strokeWidth="1"/>
        <text x="260" y="65" fontSize="12" fill="#000" textAnchor="middle">M</text>
      </svg>
    )
  },
  "01": {
    description: `Bits "10" require a Pauli-Z gate on Qubit 0 before measurement.`,
    svg: (
      <svg width="100%" height="100" viewBox="0 0 320 100">
        <line x1="10" y1="20" x2="310" y2="20" stroke="#fff" strokeWidth="2"/>
        <line x1="10" y1="60" x2="310" y2="60" stroke="#fff" strokeWidth="2"/>
        <text x="0" y="25" fontSize="12" fill="#fff">Q0</text>
        <text x="0" y="65" fontSize="12" fill="#fff">Q1</text>
        <rect x="50" y="10" width="20" height="20" fill="rgba(0,255,0,0.6)" stroke="#00ff00" strokeWidth="1"/>
        <text x="60" y="25" fontSize="12" fill="#000" textAnchor="middle">Z</text>
        <rect x="250" y="10" width="20" height="20" fill="rgba(0,224,255,0.6)" stroke="#00e0ff" strokeWidth="1"/>
        <text x="260" y="25" fontSize="12" fill="#000" textAnchor="middle">M</text>
        <rect x="250" y="50" width="20" height="20" fill="rgba(0,224,255,0.6)" stroke="#00e0ff" strokeWidth="1"/>
        <text x="260" y="65" fontSize="12" fill="#000" textAnchor="middle">M</text>
      </svg>
    )
  },
  "11": {
    description: `Bits "11" require both Pauli-X and Pauli-Z gates on Qubit 0 before measurement.`,
    svg: (
      <svg width="100%" height="100" viewBox="0 0 320 100">
        <line x1="10" y1="20" x2="310" y2="20" stroke="#fff" strokeWidth="2"/>
        <line x1="10" y1="60" x2="310" y2="60" stroke="#fff" strokeWidth="2"/>
        <text x="0" y="25" fontSize="12" fill="#fff">Q0</text>
        <text x="0" y="65" fontSize="12" fill="#fff">Q1</text>
        <rect x="50" y="10" width="20" height="20" fill="rgba(255,0,255,0.6)" stroke="#ff00ff" strokeWidth="1"/>
        <text x="60" y="25" fontSize="12" fill="#000" textAnchor="middle">XZ</text>
        <rect x="250" y="10" width="20" height="20" fill="rgba(0,224,255,0.6)" stroke="#00e0ff" strokeWidth="1"/>
        <text x="260" y="25" fontSize="12" fill="#000" textAnchor="middle">M</text>
        <rect x="250" y="50" width="20" height="20" fill="rgba(0,224,255,0.6)" stroke="#00e0ff" strokeWidth="1"/>
        <text x="260" y="65" fontSize="12" fill="#000" textAnchor="middle">M</text>
      </svg>
    )
  }
};

function App() {
  const [bits, setBits] = useState("10");
  const [shots, setShots] = useState(512);
  const [circuitImg, setCircuitImg] = useState(null);
  const [histogramImg, setHistogramImg] = useState(null);
  const [decodedBits, setDecodedBits] = useState(null);
  const [successRate, setSuccessRate] = useState(null);

  const handleSubmit = async () => {
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/send", {
        bits,
        shots: Number(shots),
      });

      if (response.data.ok) {
        const result = response.data.data;

        setCircuitImg("data:image/png;base64," + result.circuit_png_base64);
        setHistogramImg("data:image/png;base64," + result.histogram_png_base64);
        setDecodedBits(result.decoded_bits);
        setSuccessRate((result.success_rate * 100).toFixed(2)); // % format
      } else {
        alert("Error: " + response.data.error);
      }
    } catch (err) {
      alert("Request failed: " + err.message);
    }
  };

  return (
  <div className="container">
    <h1>Superdense Coding Demo</h1>

    <h2 className="center-heading">Quantum Circuit Generator</h2>

    <div className="input-wrapper">
  <div className="card input-card">
    <h2>Configure Experiment</h2>
    <label>
      Bits to send:
      <select value={bits} onChange={(e) => setBits(e.target.value)}>
        <option value="00">00</option>
        <option value="01">01</option>
        <option value="10">10</option>
        <option value="11">11</option>
      </select>
    </label>
    <label>
      Number of Shots:
      <input
        type="number"
        value={shots}
        onChange={(e) => setShots(e.target.value)}
      />
    </label>
    <button onClick={handleSubmit}>Run Quantum Transmission</button>
  </div>
</div>


    {decodedBits && (
  <div className="card decoded-card">
    <h3>Decoded Bits Explanation</h3>
    <p>{decodingInfo[decodedBits].description}</p>
    {decodingInfo[decodedBits].svg}
  </div>
)}



    <div className="row">
      {circuitImg && (
        <div className="card">
          <h3>Circuit</h3>
          <img src={circuitImg} alt="Quantum Circuit" />
        </div>
      )}

      {histogramImg && (
        <div className="card">
          <h3>Histogram</h3>
          <img src={histogramImg} alt="Histogram" />
        </div>
      )}
    </div>
  </div>
);
}

export default App;
