import { useMemo, useEffect, useState } from "react";
import { useGameStore } from "./store";
import { useGameLoop } from "./hooks/useGameLoop";
import { usePlayerMovement } from "./hooks/usePlayerMovement";
import { useML } from "./hooks/useML";
import IsometricGrid from "./components/IsometricGrid";
import Dashboard from "./components/Dashboard";
import Compass from "./components/Compass";
import QuestionModal from "./components/QuestionModal";
import LandingPage from "./components/LandingPage";

// ── Top HUD bar ──
function HUDTop({ sessionTime, masteryPct }) {
  const mins = String(Math.floor(sessionTime / 60)).padStart(2, "0");
  const secs = String(sessionTime % 60).padStart(2, "0");
  return (
    <div className="hud-bar hud-top">
      <div className="flex items-center gap-4">
        <span style={{
          fontFamily: "Orbitron, sans-serif",
          fontWeight: 700,
          fontSize: 14,
          color: "#00e5ff",
          letterSpacing: "0.15em",
          textShadow: "0 0 20px rgba(0,229,255,0.3)",
        }}>
          THE FORGETTERY
        </span>
        <span className="hidden sm:block text-[9px] text-text3 tracking-[0.2em] uppercase">
          Neural Cartography System
        </span>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[8px] text-text3 tracking-[0.15em]">SESSION</span>
          <span className="text-[13px] font-bold text-text1">{mins}:{secs}</span>
        </div>
        <div className="w-px h-6 bg-white/5" />
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[8px] text-text3 tracking-[0.15em]">MASTERY</span>
          <span
            className="text-[13px] font-bold"
            style={{ color: masteryPct > 50 ? "#00e5ff" : "#f59e0b" }}
          >
            {masteryPct.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Bottom HUD bar ──
function HUDBottom({ player, currentTile }) {
  return (
    <div className="hud-bar hud-bottom">
      <span className="font-mono text-cyan text-[11px]">
        PROBE [{String(player.y).padStart(2, "0")},{String(player.x).padStart(2, "0")}]
      </span>
      <span className="text-text1 text-[12px] truncate max-w-[240px] hidden sm:block">
        {currentTile?.name || "—"}
      </span>
      <span className="flex items-center gap-1 text-text2">
        {["W","A","S","D"].map(k => (
          <kbd key={k} style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            minWidth: 18, height: 18, padding: "0 4px",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 3, fontFamily: "var(--font-mono)", fontSize: 9,
            color: "var(--color-text2)",
          }}>{k}</kbd>
        ))}
        <span className="mx-1 text-text3 text-[9px]">MOVE</span>
        <span className="mx-1 text-text3">·</span>
        <kbd style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          minWidth: 42, height: 18, padding: "0 4px",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 3, fontFamily: "var(--font-mono)", fontSize: 9,
          color: "var(--color-text2)",
        }}>SPACE</kbd>
        <span className="ml-1 text-text3 text-[9px]">REVIEW</span>
      </span>
    </div>
  );
}

// ── Game view (mounts all hooks) ──
function GameView() {
  useGameLoop();
  usePlayerMovement();
  useML();

  const { player, tiles } = useGameStore();
  const [sessionTime, setSessionTime] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSessionTime(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const masteryPct = useMemo(() => {
    if (!tiles.length) return 0;
    const visited = tiles.filter(t => t.n_exposures > 0);
    if (!visited.length) return 0;
    return (visited.reduce((s, t) => s + t.recall_probability, 0) / tiles.length) * 100;
  }, [tiles]);

  const currentTile = useMemo(
    () => tiles.find(t => t.x === player.x && t.y === player.y),
    [tiles, player]
  );

  return (
    <>
      <HUDTop sessionTime={sessionTime} masteryPct={masteryPct} />
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Centre: isometric grid */}
        <div className="flex-1 flex items-center justify-center overflow-hidden p-4 relative" style={{ isolation: "isolate" }}>
          <IsometricGrid />
          <Compass />
        </div>
        {/* Right: telemetry sidebar */}
        <Dashboard currentTile={currentTile} sessionTime={sessionTime} />
      </div>
      <HUDBottom player={player} currentTile={currentTile} />
      <QuestionModal />
    </>
  );
}

export default function App() {
  const view = useGameStore(s => s.view);
  return (
    <div className="flex flex-col h-full w-full bg-bg" style={{ position: "relative", zIndex: 1 }}>
      {view === "landing" ? <LandingPage /> : <GameView />}
    </div>
  );
}
