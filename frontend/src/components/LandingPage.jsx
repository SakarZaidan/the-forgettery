import { useState } from "react";
import { useGameStore } from "../store";
import { startGame, startPreset, getState, getQuestion } from "../api/client";

export default function LandingPage() {
  const [topic, setTopic] = useState("");
  const [isSkipping, setSkipping] = useState(false);
  const { isGenerating, setGenerating, setPlayerId, setState, setView, setConnectionError, setQuestion } = useGameStore();

  // Shared: after a session is created, load state + show spawn tile question
  const launchSession = async (session) => {
    setPlayerId(session.player_id);
    const state = await getState(session.player_id);
    setState(state);
    const spawnTile = state.tiles.find(
      t => t.x === state.player.x && t.y === state.player.y
    );
    if (spawnTile) {
      try {
        const qData = await getQuestion(session.player_id, spawnTile.key);
        setQuestion({ ...qData, started_at: Date.now() });
      } catch {
        // question fetch failing shouldn't block the game from starting
      }
    }
    setView("game");
  };

  const handleSkip = async () => {
    if (isGenerating || isSkipping) return;
    setSkipping(true);
    try {
      const session = await startPreset("competitive_programming");
      await launchSession(session);
    } catch (err) {
      console.error(err);
      setConnectionError("Failed to load preset. Make sure the backend is running.");
    } finally {
      setSkipping(false);
    }
  };

  const handleStart = async (e) => {
    e.preventDefault();
    if (!topic.trim() || isGenerating) return;
    setGenerating(true);
    try {
      const session = await startGame({ topic });
      await launchSession(session);
    } catch (err) {
      console.error(err);
      setConnectionError("Neural Sync Failed. Gemini might be overloaded or your API key is invalid.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-6">
      <div className="flex flex-col items-center mb-12 text-center max-w-2xl w-full">

        {/* Title */}
        <h1 style={{
          fontFamily: "Orbitron, sans-serif",
          fontWeight: 900,
          fontSize: "clamp(28px, 5vw, 48px)",
          color: "#00e5ff",
          letterSpacing: "0.05em",
          textShadow: "0 0 40px rgba(0,229,255,0.3)",
          marginBottom: 8,
          lineHeight: 1.1,
        }}>
          THE FORGETTERY
        </h1>
        <p className="text-text3 font-mono text-sm tracking-[0.2em] uppercase">
          Spatio-Temporal Memory Cartography
        </p>
      </div>

      {/* Input */}
      <form onSubmit={handleStart} className="w-full max-w-2xl relative group">
        <div style={{
          position: "absolute", inset: -4,
          background: "linear-gradient(135deg, rgba(0,229,255,0.15), rgba(168,85,247,0.15))",
          borderRadius: 20,
          filter: "blur(8px)",
          opacity: isGenerating ? 0.6 : 0.3,
          transition: "opacity 0.5s",
        }} />
        <div style={{
          position: "relative",
          background: "rgba(10,14,28,0.9)",
          border: "1px solid rgba(0,229,255,0.2)",
          borderRadius: 16,
          padding: 8,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            disabled={isGenerating}
            placeholder="What sector of knowledge shall we map? (e.g. Quantum Physics, Ancient History…)"
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              padding: "16px 24px",
              color: "#dfe0f0",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 16,
              flex: 1,
            }}
          />
          <button
            type="submit"
            disabled={!topic.trim() || isGenerating}
            style={{
              background: isGenerating ? "rgba(0,229,255,0.3)" : "#00e5ff",
              color: "#06060f",
              fontFamily: "Orbitron, sans-serif",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.15em",
              padding: "14px 28px",
              borderRadius: 12,
              border: "none",
              cursor: topic.trim() && !isGenerating ? "pointer" : "not-allowed",
              opacity: topic.trim() && !isGenerating ? 1 : 0.4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s",
            }}
          >
            {isGenerating ? (
              <>
                <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>◈</span>
                SYNCING..
              </>
            ) : (
              <>INITIALIZE ›</>
            )}
          </button>
        </div>
      </form>

      {/* Skip / preset button */}
      <div className="mt-4 w-full max-w-2xl flex items-center gap-3">
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        <button
          onClick={handleSkip}
          disabled={isGenerating || isSkipping}
          style={{
            background: "transparent",
            border: "1px solid rgba(168,85,247,0.35)",
            borderRadius: 10,
            padding: "9px 20px",
            color: isSkipping ? "rgba(168,85,247,0.5)" : "#a855f7",
            fontFamily: "Orbitron, sans-serif",
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: "0.15em",
            cursor: isGenerating || isSkipping ? "not-allowed" : "pointer",
            opacity: isGenerating || isSkipping ? 0.5 : 1,
            display: "flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
            transition: "all 0.2s",
          }}
        >
          {isSkipping ? (
            <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>◈</span> LOADING...</>
          ) : (
            <>⚡ SKIP — COMPETITIVE PROGRAMMING</>
          )}
        </button>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
      </div>

      {/* Status terminal */}
      {isGenerating && (
        <div className="mt-8 w-full max-w-2xl font-mono text-[10px] text-text3 space-y-1 animate-pulse">
          <div className="flex justify-between">
            <span>› HANDSHAKING WITH GEMINI NEURAL CORE...</span>
            <span style={{ color: "#00e5ff" }}>[OK]</span>
          </div>
          <div className="flex justify-between">
            <span>› GENERATING SPATIAL CURRICULUM GRID...</span>
            <span style={{ color: "#f59e0b" }}>[WAIT]</span>
          </div>
          <div className="flex justify-between border-t border-white/5 pt-1">
            <span>› MAPPING TEMPORAL DECAY VECTORS...</span>
            <span style={{ color: "#6b7294" }}>[PENDING]</span>
          </div>
        </div>
      )}

      {/* Features footer */}
      <div className="mt-12 grid grid-cols-3 gap-8 w-full max-w-2xl border-t border-white/5 pt-8 opacity-40">
        <Feature color="#00e5ff" label="HLR DECAY"      desc="Real-time knowledge erosion" />
        <Feature color="#a855f7" label="GAUSSIAN FOG"   desc="Uncertainty visualisation" />
        <Feature color="#f59e0b" label="GEMINI-POWERED" desc="Procedural MCQs" />
      </div>
    </div>
  );
}

function Feature({ color, label, desc }) {
  return (
    <div className="text-center">
      <div className="w-1.5 h-1.5 rounded-full mx-auto mb-2" style={{ background: color }} />
      <div className="font-mono text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color }}>{label}</div>
      <div className="font-mono text-[8px] text-text3 uppercase leading-tight">{desc}</div>
    </div>
  );
}
