import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
const SAMPLE_QUESTIONS = [
    "Should facial recognition be banned in public spaces?",
    "Should cities implement a four-day work week?",
    "Should social media platforms be liable for user-generated content?",
];
function App() {
    const [question, setQuestion] = useState(SAMPLE_QUESTIONS[0]);
    const [maxIterations, setMaxIterations] = useState(3);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
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
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setStage(0);
        }
        finally {
            setLoading(false);
        }
    };
    const stageStatus = (idx) => {
        if (stage === 0)
            return "";
        if (stage > idx)
            return "done";
        if (stage === idx)
            return "active";
        return "";
    };
    return (_jsxs("div", { className: "app", children: [_jsxs("header", { children: [_jsx("h1", { children: "Polaris Council" }), _jsx("p", { children: "Multi-agent policy debate through the 4-layer Polaris pipeline." })] }), _jsx("div", { className: "stages", children: [
                    { id: 1, title: "Diverge", desc: "5 agents explore" },
                    { id: 2, title: "Inquire", desc: "Filter weak arguments" },
                    { id: 3, title: "Synthesize", desc: "Weave a draft" },
                    { id: 4, title: "Orchestrate", desc: "Quality gate" },
                    { id: 5, title: "Deliver", desc: "Final recommendation" },
                ].map((s) => (_jsxs("div", { className: `stage ${stageStatus(s.id)}`, children: [_jsx("h3", { children: s.title }), _jsx("p", { children: s.desc })] }, s.id))) }), _jsxs("div", { className: "form", children: [_jsx("label", { htmlFor: "question", children: "Policy question" }), _jsx("textarea", { id: "question", value: question, onChange: (e) => setQuestion(e.target.value), placeholder: "Pose a hard policy question..." }), _jsxs("label", { htmlFor: "iterations", children: ["Max iterations: ", maxIterations] }), _jsx("input", { id: "iterations", type: "range", min: 1, max: 5, value: maxIterations, onChange: (e) => setMaxIterations(parseInt(e.target.value, 10)) }), _jsx("button", { onClick: run, disabled: loading || !question.trim(), children: loading ? "Council in session..." : "Convene Council" })] }), error && _jsx("div", { className: "error", children: error }), result && (_jsxs("div", { className: "result", children: [_jsx("h2", { children: "Recommendation" }), _jsxs("div", { className: "meta", children: [_jsxs("span", { children: ["Iterations: ", result.totalIterations] }), _jsxs("span", { children: ["Tokens: ", result.totalTokensConsumed] }), _jsx("span", { className: "badge", children: result.forcedDelivery ? "Forced delivery" : "Clean delivery" }), result.lastVerdict?.errorDelta !== undefined && (_jsxs("span", { className: "badge", children: ["Error delta: ", result.lastVerdict.errorDelta.toFixed(2)] }))] }), result.forcedDeliveryReason && (_jsxs("div", { className: "meta", children: ["Reason: ", result.forcedDeliveryReason] })), result.lastVerdict?.deficiencies && result.lastVerdict.deficiencies.length > 0 && (_jsxs("div", { className: "meta", children: ["Deficiencies: ", result.lastVerdict.deficiencies.join("; ")] })), _jsx("div", { className: "recommendation", children: result.finalOutput })] }))] }));
}
export default App;
