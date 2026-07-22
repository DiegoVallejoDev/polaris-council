import { useState } from "react";

interface CouncilResult {
  finalOutput: string;
  totalIterations: number;
  forcedDelivery: boolean;
  forcedDeliveryReason?: string;
  totalTokensConsumed: number;
  lastVerdict: {
    decision?: string;
    errorDelta?: number;
    deficiencies?: string[];
  } | null;
}

const SAMPLE_QUESTIONS = [
  "Should facial recognition be banned in public spaces?",
  "Should cities implement a four-day work week?",
  "Should social media platforms be liable for user-generated content?",
];

function App() {
  const [question, setQuestion] = useState(SAMPLE_QUESTIONS[0]);
  const [maxIterations, setMaxIterations] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CouncilResult | null>(null);
  const [stage, setStage] = useState(0);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setStage(1);

    try {
      const res = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, maxIterations, tokenBudget: 100_000 }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unknown error");
      }

      setResult(data);
      setStage(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStage(0);
    } finally {
      setLoading(false);
    }
  };

  const stageStatus = (idx: number) => {
    if (stage === 0) return "";
    if (stage > idx) return "done";
    if (stage === idx) return "active";
    return "";
  };

  return (
    <div className="app">
      <header>
        <h1>Polaris Council</h1>
        <p>Multi-agent policy debate through the 4-layer Polaris pipeline.</p>
      </header>

      <div className="stages">
        {[
          { id: 1, title: "Diverge", desc: "5 agents explore" },
          { id: 2, title: "Inquire", desc: "Filter weak arguments" },
          { id: 3, title: "Synthesize", desc: "Weave a draft" },
          { id: 4, title: "Orchestrate", desc: "Quality gate" },
          { id: 5, title: "Deliver", desc: "Final recommendation" },
        ].map((s) => (
          <div key={s.id} className={`stage ${stageStatus(s.id)}`}>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="form">
        <label htmlFor="question">Policy question</label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Pose a hard policy question..."
        />

        <label htmlFor="iterations">
          Max iterations: {maxIterations}
        </label>
        <input
          id="iterations"
          type="range"
          min={1}
          max={5}
          value={maxIterations}
          onChange={(e) => setMaxIterations(parseInt(e.target.value, 10))}
        />

        <button onClick={run} disabled={loading || !question.trim()}>
          {loading ? "Council in session..." : "Convene Council"}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="result">
          <h2>Recommendation</h2>
          <div className="meta">
            <span>Iterations: {result.totalIterations}</span>
            <span>Tokens: {result.totalTokensConsumed}</span>
            <span className="badge">
              {result.forcedDelivery ? "Forced delivery" : "Clean delivery"}
            </span>
            {result.lastVerdict?.errorDelta !== undefined && (
              <span className="badge">
                Error delta: {result.lastVerdict.errorDelta.toFixed(2)}
              </span>
            )}
          </div>
          {result.forcedDeliveryReason && (
            <div className="meta">Reason: {result.forcedDeliveryReason}</div>
          )}
          {result.lastVerdict?.deficiencies && result.lastVerdict.deficiencies.length > 0 && (
            <div className="meta">
              Deficiencies: {result.lastVerdict.deficiencies.join("; ")}
            </div>
          )}
          <div className="recommendation">{result.finalOutput}</div>
        </div>
      )}
    </div>
  );
}

export default App;
