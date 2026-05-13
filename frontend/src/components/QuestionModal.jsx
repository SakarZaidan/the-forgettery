import { useState } from "react";
import { useGameStore } from "../store";
import { submitAnswer } from "../api/client";

export default function QuestionModal() {
  const { playerId, question, clearQuestion } = useGameStore();
  const [selected, setSelected]     = useState(null);
  const [feedback, setFeedback]     = useState(null);
  const [isSubmitting, setSubmitting] = useState(false);

  if (!question) return null;
  const q = question.question;

  const handleSubmit = async () => {
    if (selected === null || isSubmitting) return;
    setSubmitting(true);
    const correct = selected === q.correct_index;
    const rt = Date.now() - question.started_at;
    try {
      const result = await submitAnswer({
        player_id:       playerId,
        concept_key:     question.concept.key,
        correct,
        response_time_ms: rt,
      });
      setFeedback({ correct, explanation: q.explanation, result });
      setTimeout(() => {
        setFeedback(null); setSelected(null); setSubmitting(false); clearQuestion();
      }, 3000);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(0,0,0,0.8)",
      backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      <div style={{
        background: "rgba(10,14,28,0.98)",
        border: "1px solid rgba(0,229,255,0.2)",
        borderRadius: 16,
        padding: 32,
        maxWidth: 520,
        width: "100%",
        boxShadow: "0 0 60px rgba(168,85,247,0.15), 0 0 120px rgba(0,229,255,0.05)",
      }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <span style={{
            padding: "3px 10px",
            background: "rgba(168,85,247,0.15)",
            border: "1px solid rgba(168,85,247,0.3)",
            borderRadius: 20,
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 10,
            color: "#a855f7",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
            {question.concept.category.replace(/_/g, " ")}
          </span>
          <span className="font-mono text-[10px] text-text3">
            Difficulty {question.concept.difficulty}/5
          </span>
        </div>

        {/* Concept name */}
        <p className="font-mono text-[11px] uppercase tracking-widest text-text3 mb-1.5">
          Scanning: {question.concept.name}
        </p>

        {/* Question */}
        <h2 style={{
          color: "#dfe0f0", fontSize: 20, fontWeight: 700,
          lineHeight: 1.35, marginBottom: 24,
        }}>
          {q.question}
        </h2>

        {/* Choices */}
        <div className="flex flex-col gap-2.5">
          {q.choices.map((choice, i) => {
            let borderColor = "rgba(255,255,255,0.06)";
            let bg = "rgba(255,255,255,0.02)";
            let textColor = "#dfe0f0";

            if (!feedback && selected === i) {
              borderColor = "#00e5ff"; bg = "rgba(0,229,255,0.08)"; textColor = "#00e5ff";
            }
            if (feedback) {
              if (i === q.correct_index) {
                borderColor = "#10b981"; bg = "rgba(16,185,129,0.12)"; textColor = "#10b981";
              } else if (selected === i) {
                borderColor = "#ef4444"; bg = "rgba(239,68,68,0.12)"; textColor = "#ef4444";
              } else {
                textColor = "rgba(255,255,255,0.25)";
              }
            }

            return (
              <button
                key={i}
                disabled={!!feedback}
                onClick={() => setSelected(i)}
                style={{
                  width: "100%", textAlign: "left",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `1px solid ${borderColor}`,
                  background: bg,
                  color: textColor,
                  cursor: feedback ? "default" : "pointer",
                  display: "flex", alignItems: "center", gap: 12,
                  transition: "all 0.2s",
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: selected === i && !feedback ? "#00e5ff" : "rgba(255,255,255,0.06)",
                  color: selected === i && !feedback ? "#06060f" : "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 700,
                  flexShrink: 0, transition: "all 0.2s",
                }}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  {choice.replace(/^[A-D]\)\s*/, "")}
                </span>
              </button>
            );
          })}
        </div>

        {/* Feedback / Submit */}
        {feedback ? (
          <div className="mt-6">
            <div style={{
              fontSize: 15, fontWeight: 700, marginBottom: 8,
              color: feedback.correct ? "#10b981" : "#ef4444",
              fontFamily: "Orbitron, sans-serif",
            }}>
              {feedback.correct ? "✓ NEURAL LINK STABILISED" : "✗ RECALL FAILURE"}
            </div>
            <p className="text-text3 text-sm leading-relaxed p-3 rounded-lg"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              {feedback.explanation}
            </p>
            <div className="mt-3 flex gap-5 font-mono text-[10px] text-text3 uppercase tracking-widest">
              <span>
                Half-life: <span style={{ color: "#00e5ff" }}>{feedback.result.updated.half_life.toFixed(1)}s</span>
              </span>
              <span>
                Streak: <span style={{ color: "#a855f7" }}>{feedback.result.updated.streak}</span>
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={selected === null || isSubmitting}
            style={{
              marginTop: 24,
              width: "100%",
              padding: "14px 0",
              background: "#00e5ff",
              color: "#06060f",
              fontFamily: "Orbitron, sans-serif",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.2em",
              borderRadius: 10,
              border: "none",
              cursor: selected !== null && !isSubmitting ? "pointer" : "not-allowed",
              opacity: selected !== null && !isSubmitting ? 1 : 0.25,
              transition: "all 0.2s",
            }}
          >
            {isSubmitting ? "PROCESSING…" : "COMMIT ANSWER"}
          </button>
        )}
      </div>
    </div>
  );
}
