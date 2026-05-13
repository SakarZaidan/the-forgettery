import { useMemo, useState, useCallback } from "react";
import { useGameStore } from "../store";
import { movePlayer, getQuestion } from "../api/client";

const TILE_W = 48;
const TILE_H = TILE_W / 2;      // 24
const TILE_DEPTH = 7;
const HALF_W = TILE_W / 2;      // 24
const HALF_H = TILE_H / 2;      // 12
const GRID_SIZE = 12;

// Category → accent colour (fallback palette for Gemini-generated topics)
const KNOWN_COLORS = {
  basics:          "#00e5ff",
  control_flow:    "#a855f7",
  data_structures: "#f59e0b",
  functions:       "#10b981",
  oop:             "#f472b6",
  advanced:        "#ef4444",
};
const PALETTE = ["#00e5ff","#a855f7","#f59e0b","#10b981","#f472b6","#ef4444"];

function getCategoryColor(cat) {
  if (KNOWN_COLORS[cat]) return KNOWN_COLORS[cat];
  let h = 0;
  for (const c of cat) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return PALETTE[h % PALETTE.length];
}

function blendHex(h1, h2, t) {
  const p = (h) => [
    parseInt(h.slice(1,3),16),
    parseInt(h.slice(3,5),16),
    parseInt(h.slice(5,7),16),
  ];
  const [r1,g1,b1] = p(h1), [r2,g2,b2] = p(h2);
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[r1*(1-t)+r2*t, g1*(1-t)+g2*t, b1*(1-t)+b2*t]
    .map(v => clamp(v).toString(16).padStart(2,"0")).join("")}`;
}

// Convert grid (col, row) → isometric screen offset from grid centre
function isoPos(col, row) {
  return {
    x: (col - row) * HALF_W,
    y: (col + row) * HALF_H,
  };
}

// tile.n_exposures === 0 → fog; otherwise P(recall) thresholds
function getTileState(tile) {
  if (tile.n_exposures === 0) return "fog";
  const p = tile.recall_probability;
  if (p > 0.8) return "healthy";
  if (p > 0.2) return "decaying";
  return "void";
}

// ── Crack lines drawn over decaying tile faces ──
function CrackLines({ severity }) {
  if (severity < 0.05) return null;
  const hw = TILE_W / 2, hh = TILE_H / 2;
  const o = Math.min(1, severity) * 0.85;
  return (
    <g opacity={o} stroke="#ef4444" strokeLinecap="round">
      <line x1={hw} y1={3}        x2={hw}      y2={hh}           strokeWidth="1.4" />
      <line x1={hw} y1={hh}       x2={hw - 10} y2={TILE_H - 5}   strokeWidth="1" />
      <line x1={hw} y1={hh}       x2={hw + 13} y2={TILE_H - 7}   strokeWidth="0.9" />
      {severity > 0.4 && <>
        <line x1={7}           y1={hh - 3} x2={hw}     y2={hh + 2} strokeWidth="0.8" />
        <line x1={TILE_W - 7}  y1={hh - 1} x2={hw + 2} y2={hh + 3} strokeWidth="0.7" />
      </>}
      {severity > 0.7 && <>
        <line x1={hw - 6} y1={4} x2={4}          y2={hh - 2} strokeWidth="0.6" />
        <line x1={hw + 8} y1={5} x2={TILE_W - 5} y2={hh + 1} strokeWidth="0.6" />
      </>}
    </g>
  );
}

// ── Single isometric diamond tile ──
function TileDiamond({ tile, screenX, screenY, isProbe, isHovered, fogLevel, onHover, onClick }) {
  const state  = getTileState(tile);
  const color  = getCategoryColor(tile.category);
  const p      = tile.recall_probability;
  const hw = TILE_W / 2, hh = TILE_H / 2;

  const crackLevel = state === "decaying"
    ? Math.max(0, Math.min(1, (0.5 - p) / 0.3))
    : 0;

  const depth = state === "healthy" ? TILE_DEPTH
    : state === "decaying" ? TILE_DEPTH * Math.max(0.3, p)
    : state === "void"     ? 1
    : TILE_DEPTH * 0.25;

  let topFill, leftFill, rightFill;
  if (state === "healthy") {
    topFill   = color;
    leftFill  = blendHex(color, "#000000", 0.55);
    rightFill = blendHex(color, "#000000", 0.65);
  } else if (state === "decaying") {
    topFill   = blendHex(color, "#f59e0b", 0.2 + crackLevel * 0.2);
    leftFill  = blendHex(color, "#7c4a00", 0.5);
    rightFill = blendHex(color, "#5c3500", 0.6);
  } else if (state === "void") {
    topFill = "#18182e"; leftFill = "#101024"; rightFill = "#0c0c1e";
  } else {
    // fog — dimmed category colour so the map is readable from the start
    topFill   = blendHex(color, "#06060f", 0.70);
    leftFill  = blendHex(color, "#030308", 0.82);
    rightFill = blendHex(color, "#020205", 0.88);
  }

  const totalH     = TILE_H + depth;
  const fogBlur    = 0;
  const fogOpacity = state === "fog" ? 0.6 + fogLevel * 0.35 : 1;

  // Diamond points
  const topPts   = `${hw},0 ${TILE_W},${hh} ${hw},${TILE_H} 0,${hh}`;
  const leftPts  = `0,${hh} ${hw},${TILE_H} ${hw},${TILE_H + depth} 0,${hh + depth}`;
  const rightPts = `${TILE_W},${hh} ${hw},${TILE_H} ${hw},${TILE_H + depth} ${TILE_W},${hh + depth}`;

  const zIndex = (tile.y + tile.x) * 2 + (isProbe ? 150 : 0);

  return (
    <div
      style={{
        position: "absolute",
        left: screenX - hw,
        top:  screenY - hh - depth,
        width:  TILE_W,
        height: Math.ceil(totalH),
        zIndex,
        cursor: "pointer",
        filter:  fogBlur > 0 ? `blur(${fogBlur}px)` : "none",
        opacity: fogOpacity,
        transition: "filter 0.5s ease, opacity 0.5s ease",
      }}
      onClick={() => onClick(tile)}
      onMouseEnter={() => onHover(tile.key)}
      onMouseLeave={() => onHover(null)}
    >
      <svg
        width={TILE_W}
        height={Math.ceil(totalH)}
        viewBox={`0 0 ${TILE_W} ${totalH}`}
        style={{ display: "block", overflow: "visible" }}
      >
        {state === "fog" && (
          <polygon points={topPts} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.7" />
        )}
        {state === "healthy" && (
          <polygon points={topPts} fill={color} opacity="0.25" filter="url(#tileGlow)" />
        )}
        {depth > 1 && <>
          <polygon points={leftPts}  fill={leftFill} />
          <polygon points={rightPts} fill={rightFill} />
        </>}
        <polygon
          points={topPts}
          fill={topFill}
          stroke={state === "healthy" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.04)"}
          strokeWidth={state === "healthy" ? 0.8 : 0.4}
        />
        {state === "healthy" && (
          <polygon points={topPts} fill="url(#innerShine)" opacity="0.3" />
        )}
        {state === "decaying" && <CrackLines severity={crackLevel} />}
        {state === "void" && <>
          <polygon points={topPts} fill="none"
            stroke="rgba(239,68,68,0.35)" strokeWidth="1.5" strokeDasharray="3 2" />
          <polygon points={topPts} fill="#ef4444" opacity="0.06" className="void-flicker" />
        </>}
        {isHovered && state !== "void" && (
          <polygon points={topPts} fill="rgba(255,255,255,0.08)" />
        )}
      </svg>
    </div>
  );
}

// ── Neural Probe indicator (cyan diamond ring) ──
function NeuralProbe({ screenX, screenY }) {
  const pad = 6;
  const pw = TILE_W + pad * 2, ph = TILE_H + pad * 2;
  const phw = pw / 2, phh = ph / 2;
  const pts = `${phw},0 ${pw},${phh} ${phw},${ph} 0,${phh}`;
  return (
    <div style={{
      position: "absolute",
      left: screenX - phw,
      top:  screenY - phh,
      width: pw, height: ph,
      zIndex: 300,
      pointerEvents: "none",
      transition: "left 0.14s cubic-bezier(.25,.46,.45,.94), top 0.14s cubic-bezier(.25,.46,.45,.94)",
    }}>
      <svg width={pw} height={ph} style={{ overflow: "visible" }}>
        <defs>
          <filter id="probeGlow">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <polygon points={pts} fill="none" stroke="#00e5ff" strokeWidth="2"
          filter="url(#probeGlow)" className="probe-ring" />
        <polygon points={pts} fill="rgba(0,229,255,0.06)" />
        <circle cx={phw} cy={phh} r="3" fill="#00e5ff" opacity="0.9" />
      </svg>
    </div>
  );
}

// ── Main isometric grid ──
export default function IsometricGrid() {
  const { tiles, player, subject, connectionError, playerId, question, setQuestion, updatePlayerPos } = useGameStore();
  const [hoveredKey, setHoveredKey] = useState(null);

  const handleTileClick = useCallback(async (tile) => {
    if (!playerId || question) return;
    // Block void tiles that have been visited and forgotten
    if (tile.n_exposures > 0 && tile.recall_probability < 0.2) return;
    // Already standing here — just re-show the question
    if (tile.x === player.x && tile.y === player.y) {
      try {
        const qData = await getQuestion(playerId, tile.key);
        setQuestion({ ...qData, started_at: Date.now() });
      } catch (err) {
        console.error("Question fetch failed:", err);
      }
      return;
    }
    try {
      await movePlayer({ player_id: playerId, x: tile.x, y: tile.y });
      updatePlayerPos(tile.x, tile.y);
      const qData = await getQuestion(playerId, tile.key);
      setQuestion({ ...qData, started_at: Date.now() });
    } catch (err) {
      console.error("Click-move failed:", err);
    }
  }, [playerId, player, question, setQuestion, updatePlayerPos]);

  const gridW = GRID_SIZE * TILE_W + TILE_W;          // 624
  const gridH = GRID_SIZE * TILE_H + TILE_DEPTH + TILE_H; // 319

  // GP-inspired Gaussian fog map: unvisited tiles near explored ones get less blur
  const fogMap = useMemo(() => {
    const SIGMA = 2.8;
    const map = {};
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        let conf = 0;
        for (const t of tiles) {
          if (t.n_exposures === 0) continue;
          const d2 = (row - t.y) ** 2 + (col - t.x) ** 2;
          conf += Math.exp(-d2 / (2 * SIGMA * SIGMA)) * t.recall_probability;
        }
        map[`${row}-${col}`] = Math.min(1, conf / 2.5);
      }
    }
    return map;
  }, [tiles]);

  // Painter's algorithm: back tiles first
  const sorted = useMemo(
    () => [...tiles].sort((a, b) => (a.y + a.x) - (b.y + b.x)),
    [tiles]
  );

  const getScreenPos = useCallback((col, row) => {
    const iso = isoPos(col, row);
    return { x: iso.x + gridW / 2, y: iso.y + HALF_H + TILE_DEPTH };
  }, [gridW]);

  const probeScreen = getScreenPos(player.x, player.y);

  return (
    <div className="relative flex flex-col items-center gap-2">
      {/* Subject label */}
      <div className="text-center pointer-events-none">
        <div className="text-[9px] text-text3 font-mono uppercase tracking-[0.2em] mb-1">Subject Vector</div>
        <div className="text-lg font-bold text-cyan tracking-wider drop-shadow" style={{ fontFamily: "Orbitron, sans-serif" }}>
          {subject || "—"}
        </div>
      </div>

      {/* Grid container */}
      <div className="relative" style={{ width: gridW, height: gridH }}>
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <filter id="tileGlow"><feGaussianBlur stdDeviation="5" /></filter>
            <linearGradient id="innerShine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="white" stopOpacity="0.4" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {sorted.map(tile => {
          const { x: sx, y: sy } = getScreenPos(tile.x, tile.y);
          const isProbe = tile.x === player.x && tile.y === player.y;
          return (
            <TileDiamond
              key={tile.key}
              tile={tile}
              screenX={sx}
              screenY={sy}
              isProbe={isProbe}
              isHovered={hoveredKey === tile.key}
              fogLevel={fogMap[`${tile.y}-${tile.x}`] || 0}
              onHover={setHoveredKey}
              onClick={handleTileClick}
            />
          );
        })}

        <NeuralProbe screenX={probeScreen.x} screenY={probeScreen.y} />

        {/* Ground reflection */}
        <div style={{
          position: "absolute",
          left: "50%", bottom: -40,
          width: gridW * 0.6, height: 60,
          transform: "translateX(-50%)",
          background: "radial-gradient(ellipse, rgba(0,229,255,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
      </div>

      {/* Connection error overlay */}
      {connectionError && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/70 backdrop-blur-md z-50 rounded">
          <div className="p-6 border border-danger/50 bg-bg2 rounded-xl text-center max-w-xs">
            <div className="text-danger font-black uppercase tracking-tighter text-sm mb-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
              Neural Disconnect
            </div>
            <p className="text-text3 text-xs mb-4">{connectionError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-danger/20 border border-danger/50 text-danger text-[10px] uppercase font-bold tracking-widest rounded hover:bg-danger hover:text-white transition-all"
            >
              Re-attempt Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
