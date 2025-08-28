import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Joyride from "react-joyride";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";


const gateInfo = {
  H: {
    title: "Hadamard Gate (H)",
    img: "/gates/hadamard.png",
    desc: "Creates superposition — puts qubit into a 'coin toss' state."
  },
  X: {
    title: "Pauli-X Gate",
    img: "/gates/pauli-x.png",
    desc: "Flips |0⟩ ↔ |1⟩, like a NOT gate."
  },
  Z: {
    title: "Pauli-Z Gate",
    img: "/gates/pauli-z.png",
    desc: "Flips the phase of |1⟩, keeps |0⟩ unchanged."
  },
  CNOT: {
    title: "CNOT Gate",
    img: "/gates/cnot.png",
    desc: "If control qubit = 1, flips target qubit. Used to entangle."
  }
};
// --- Beginner Glossary ---
const GATE_GLOSSARY = [
  {
    name: "Hadamard (H)",
    plain: "Creates superposition — like a fair coin toss.",
  },
  {
    name: "CNOT",
    plain: "If control is 1, flips the target qubit.",
  },
  {
    name: "Pauli-X (X)",
    plain: "Classical NOT — swaps |0⟩ and |1⟩.",
  },
  {
    name: "Pauli-Z (Z)",
    plain: "Flips the phase of |1⟩ — invisible until interference.",
  },
];

const DECODING_INFO = {
  "00": {
    title: "Message 00",
    description:
      "No extra gates for encoding. After entanglement, Bob decodes and measures.",
  },
  "01": {
    title: "Message 01",
    description:
      "Alice applies a Z gate on her qubit before sending. Bob decodes and measures.",
  },
  "10": {
    title: "Message 10",
    description:
      "Alice applies an X gate on her qubit before sending. Bob decodes and measures.",
  },
  "11": {
    title: "Message 11",
    description:
      "Alice applies X then Z. Bob decodes and measures.",
  },
};

const StepCard = ({ title, children, id, footer }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.25 }}
    className="card"
    id={id}
  >
    <h2>{title}</h2>
    {children}
    {footer}
  </motion.div>
);

const BitsSelector = ({ value, onChange }) => {
  const options = ["00", "01", "10", "11"];
  return (
    <div className="bit-grid" id="bits-picker">
      {options.map((opt) => (
        <button
          type="button"
          key={opt}
          className={`btn-bit ${value === opt ? "active" : ""}`}
          onClick={() => onChange(opt)}
          aria-pressed={value === opt}
        >
          <span className="bit-dot" aria-hidden>●</span>
          <span className="bit-label">Send {opt}</span>
        </button>
      ))}
    </div>
  );
};

const ProgressBar = ({ percent }) => (
  <div className="progress" aria-label="Success rate">
    <div className="progress-bar" style={{ width: `${percent}%` }} />
  </div>
);

export default function App() {
  const [step, setStep] = useState(1); // 1: choose, 2: preview/run, 3: results, 4: explain
  const [bits, setBits] = useState("00");
  const [shots, setShots] = useState(512);
  const [learnMode, setLearnMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
const [selectedGate, setSelectedGate] = useState(null);
  const [circuitImg, setCircuitImg] = useState(null);
  const [histogramImg, setHistogramImg] = useState(null);
  const [decodedBits, setDecodedBits] = useState(null);
  const [successRate, setSuccessRate] = useState(null);

  // 
  // Guided tour (beginner tutorial overlay)
  //
  const [runTour, setRunTour] = useState(() => {
    const seen = localStorage.getItem("sd_tour_seen");
    return !seen; // run once for new users
  });

  const tourSteps = useMemo(
    () => [
      {
        target: "#bits-picker",
        content:
          "Pick the two classical bits you want to transmit using one qubit + entanglement.",
        disableBeacon: true,
      },
      {
        target: "#shots-input",
        content:
          "Shots = how many times we repeat the experiment to build statistics.",
      },
      {
        target: "#run-btn",
        content: "Run the simulation on a local quantum circuit simulator.",
      },
      {
        target: "#circuit-card",
        content:
          "This is the full circuit: entanglement → encoding (Alice) → decoding (Bob).",
      },
      {
        target: "#histogram-card",
        content: "The measurement outcomes across all shots.",
      },
      {
        target: "#explain-card",
        content: "Explanation of what the gates did and how the bits were decoded.",
      },
    ],
    []
  );

  useEffect(() => {
    if (runTour === false) return;
    // mark as seen after first start
    localStorage.setItem("sd_tour_seen", "1");
  }, [runTour]);

  const validate = () => {
    if (!["00", "01", "10", "11"].includes(bits)) {
      setError("❌ Oops! Please pick one of the valid bit options: 00, 01, 10, or 11.");
      return false;
    }
    const n = Number(shots);
    if (!Number.isInteger(n) || n < 1 || n > 16384) {
      setError("❌ Shots must be a whole number between 1 and 16384.");
      return false;
    }
    setError("");
    return true;
  };

  const handleRun = async () => {
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/send", {
        bits,
        shots: Number(shots),
      });
      if (res.data?.ok) {
        const r = res.data.data;
        setCircuitImg("data:image/png;base64," + r.circuit_png_base64);
        setHistogramImg("data:image/png;base64," + r.histogram_png_base64);
        setDecodedBits(r.decoded_bits);
        setSuccessRate(Number((r.success_rate * 100).toFixed(2)));
        setStep(3);
      } else {
        setError(
          res.data?.error ||
            "Something went wrong while running the simulation. Please try again."
        );
      }
    } catch (e) {
      setError(
        e?.message || "Failed to connect to the backend. Is FastAPI running on :8000?"
      );
    } finally {
      setLoading(false);
    }
  };

  const next = () => setStep((s) => Math.min(4, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));
  const reset = () => {
    setStep(1);
    setCircuitImg(null);
    setHistogramImg(null);
    setDecodedBits(null);
    setSuccessRate(null);
    setError("");
  };

  return (
    <div className="container">
      {/* Tutorial overlay */}
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        styles={{ options: { primaryColor: "#00e0ff" } }}
        callback={(data) => {
          if (data.status === "finished" || data.status === "skipped") {
            setRunTour(false);
          }
        }}
      />

      <header className="page-header">
        <h1>Superdense Coding — Beginner Mode</h1>
        <div className="header-actions">
          <label className="toggle">
            <input
              type="checkbox"
              checked={learnMode}
              onChange={(e) => setLearnMode(e.target.checked)}
            />
            <span>Learn Mode</span>
          </label>
          <button className="btn-outline" onClick={() => setRunTour(true)}>
            ❓ Guided Tour
          </button>
        </div>
      </header>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="error-banner"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 1: Choose bits and shots */}
      {step === 1 && (
        <StepCard title="Step 1 — Choose your message" id="step-1">
          <p>
            Pick the <b>two classical bits</b> to send using one qubit plus
            shared entanglement.
          </p>
          <BitsSelector value={bits} onChange={setBits} />

          <label htmlFor="shots-input" className="mt-16">
            Number of shots (repetitions)
          </label>
          <input
            id="shots-input"
            className="shots-input"
            type="number"
            min={1}
            max={16384}
            value={shots}
            onChange={(e) => setShots(e.target.value)}
          />

          {learnMode && (
            <details className="info details">
              <summary>What happens in this protocol?</summary>
              <ol>
                <li>
                  <b>Entanglement</b>: We create a Bell pair between Alice (q0)
                  and Bob (q1).
                </li>
                <li>
                  <b>Encoding</b>: Alice applies X/Z combinations based on the
                  bits.
                </li>
                <li>
                  <b>Decoding</b>: Bob runs CNOT then H, then measures.
                </li>
              </ol>
            </details>
          )}
<div className="gate-buttons">
  {Object.keys(gateInfo).map((gate) => (
    <button key={gate} onClick={() => setSelectedGate(gate)}>
      {gate}
    </button>
  ))}
</div>
{selectedGate && (
  <div className="modal">
    <div className="modal-content">
      <h3>{gateInfo[selectedGate].title}</h3>
      <img src={gateInfo[selectedGate].img} alt={selectedGate} />
      <p>{gateInfo[selectedGate].desc}</p>
      <button onClick={() => setSelectedGate(null)}>Close</button>
    </div>
  </div>
)}

          <div className="actions">
            <button className="btn" onClick={() => setStep(2)}>
              Next →
            </button>
          </div>
        </StepCard>
      )}

      {/* Step 2: Preview + Run */}
      {step === 2 && (
        <StepCard title="Step 2 — Preview & Run" id="step-2">
          <p>
            We will build the circuit for your message <b>{bits}</b> and run it
            on a simulator for <b>{shots}</b> shots.
          </p>

          {learnMode && (
            <div className="glossary">
              <h3>Gate Glossary</h3>
              <ul>
                {GATE_GLOSSARY.map((g) => (
                  <li key={g.name}>
                    <b>{g.name}:</b> {g.plain}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="actions">
            <button
              id="run-btn"
              className="btn"
              onClick={handleRun}
              disabled={loading}
            >
              {loading ? "Running…" : "Run Simulation ▶️"}
            </button>
            <button className="btn-outline" onClick={back}>
              ← Back
            </button>
          </div>
        </StepCard>
      )}

      {/* Step 3: Results */}
      {step === 3 && (
        <StepCard title="Step 3 — Results" id="step-3">
          <div className="row">
            {circuitImg && (
              <div className="card sub" id="circuit-card">
                <h3>Circuit</h3>
                <img src={circuitImg} alt="Quantum Circuit" />
              </div>
            )}
            {histogramImg && (
              <div className="card sub" id="histogram-card">
                <h3>Histogram</h3>
                <img src={histogramImg} alt="Histogram" />
              </div>
            )}
          </div>
          <div className="actions">
            <button className="btn" onClick={next}>
              Next →
            </button>
            <button className="btn-outline" onClick={back}>
              ← Back
            </button>
          </div>
        </StepCard>
      )}

      {/* Step 4: Explanation */}
      {step === 4 && (
        <StepCard title="Step 4 — What happened?" id="explain-card">
          <div className="explain-grid">
            <div>
              <p>
                <b>Input bits:</b> {bits}
              </p>
              <p>
                <b>Decoded bits:</b> {decodedBits ?? "—"}
              </p>
              {successRate != null && (
                <>
                  <p>
                    <b>Success rate:</b>
                  </p>
                  <ProgressBar percent={successRate} />
                  <p className="muted">{successRate}% of shots matched the target.</p>
                </>
              )}
            </div>
            <div>
              {decodedBits && (
    <div className="result-card">
    {decodedBits === bits ? (
      <p>✅ Successfully decoded <strong>{decodedBits}</strong></p>
    ) : (
      <p>❌ Decoding failed. Expected {bits}, but got <strong>{decodedBits}</strong></p>
    )}
  </div>
)}
<div className="info-card">
  <h3>🔗 Entanglement</h3>
  <p>
    Entanglement is a special quantum link between two qubits. 
    Measuring one instantly gives us information about the other. 
    This is the foundation of superdense coding.
  </p>
</div>

              {decodedBits && (
                <div className="info">
                  <h3>{DECODING_INFO[decodedBits]?.title}</h3>
                  <p>{DECODING_INFO[decodedBits]?.description}</p>
                </div>
              )}
              {learnMode && (
                <details className="info details">
                  <summary>Show step-by-step explanation</summary>
                  <ol>
                    <li>
                      <b>Entanglement</b> via H on q0 then CNOT(q0→q1).
                    </li>
                    <li>
                      <b>Encoding</b> on Alice (q0): 00→I, 01→Z, 10→X, 11→XZ.
                    </li>
                    <li>
                      <b>Decoding</b> on Bob: CNOT(q0→q1) then H on q0; measure.
                    </li>
                  </ol>
                </details>
              )}
            </div>
          </div>
          <div className="actions">
            <button className="btn" onClick={reset}>
              🔄 Try another message
            </button>
          </div>
        </StepCard>
      )}
    </div>
  );
}