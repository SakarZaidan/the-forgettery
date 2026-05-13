import { useMemo, useState, useRef, useEffect } from "react";
import { useGameStore } from "../store";

// ── Category colour helper (mirrors IsometricGrid) ──
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

// ── Tile Inspector ──
function TileInspector({ tile }) {
  if (!tile) {
    return (
      <div className="panel">
        <div className="panel-label">TILE INSPECTOR</div>
        <p className="text-[11px] text-text3 italic">Navigate to a tile to inspect it</p>
      </div>
    );
  }
  const state = tile.n_exposures === 0 ? "fog"
    : tile.recall_probability > 0.8 ? "healthy"
    : tile.recall_probability > 0.2 ? "decaying"
    : "void";
  const stateLabel = { healthy: "STABLE", decaying: "DECAYING", void: "VOID", fog: "UNCHARTED" }[state];
  const stateColor = { healthy: "#00e5ff", decaying: "#f59e0b", void: "#ef4444", fog: "#6b7294" }[state];
  const catColor   = getCategoryColor(tile.category);

  return (
    <div className="panel">
      <div className="panel-label">TILE INSPECTOR</div>
      <div className="flex items-center gap-2 mb-1.5">
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: catColor, boxShadow: `0 0 6px ${catColor}`, flexShrink: 0, display: "inline-block" }} />
        <span className="text-text1 font-semibold text-[14px] truncate">{tile.name}</span>
      </div>
      <div className="flex justify-between items-center mb-2.5">
        <span className="font-mono text-[10px] tracking-[0.1em]" style={{ color: catColor }}>
          {tile.category.replace(/_/g, " ").toUpperCase()}
        </span>
        <span className="font-mono text-[10px] font-bold tracking-[0.15em]" style={{ color: stateColor }}>
          {stateLabel}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <BarRow label="RECALL" pct={tile.recall_probability * 100} color={stateColor} value={`${(tile.recall_probability * 100).toFixed(0)}%`} />
        <BarRow
          label="HALF-LIFE"
          pct={Math.min(100, (tile.half_life / 300) * 100)}
          color="#a855f7"
          value={tile.half_life < 60 ? `${tile.half_life.toFixed(0)}s` : `${(tile.half_life / 60).toFixed(1)}m`}
        />
      </div>
      <div className="mt-2 font-mono text-[9px] text-text3 tracking-[0.08em]">
        [{tile.y},{tile.x}] · DIFF {tile.difficulty}/5 · n={tile.n_exposures}
      </div>
    </div>
  );
}

function BarRow({ label, pct, color, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[8px] text-text3 tracking-[0.15em] w-[52px] shrink-0">{label}</span>
      <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div style={{ width: `${Math.max(0,Math.min(100,pct))}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.3s ease" }} />
      </div>
      <span className="font-mono text-[10px] text-text2 w-9 text-right shrink-0">{value}</span>
    </div>
  );
}

// ── Decay Curves chart ──
function DecayCurves({ tiles }) {
  const W = 258, H = 120, P = { l: 26, r: 8, t: 8, b: 22 };
  const pw = W - P.l - P.r, ph = H - P.t - P.b;

  const shown = useMemo(() => {
    const visited = tiles.filter(t => t.n_exposures > 0 && t.recall_probability > 0.05);
    if (!visited.length) return [];
    const sorted = [...visited].sort((a, b) => b.recall_probability - a.recall_probability);
    const picks = [], seen = new Set();
    for (const t of sorted) {
      if (picks.length >= 4) break;
      if (!seen.has(t.category) || picks.length < 2) { picks.push(t); seen.add(t.category); }
    }
    return picks;
  }, [tiles]);

  return (
    <div className="panel">
      <div className="panel-label">DECAY CURVES</div>
      <svg width={W} height={H} style={{ display: "block", width: "100%" }}>
        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <line key={v} x1={P.l} y1={P.t+(1-v)*ph} x2={P.l+pw} y2={P.t+(1-v)*ph}
            stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        ))}
        {/* Void threshold */}
        <line x1={P.l} y1={P.t+0.8*ph} x2={P.l+pw} y2={P.t+0.8*ph}
          stroke="rgba(239,68,68,0.3)" strokeWidth="1" strokeDasharray="3 3" />
        <text x={P.l+pw+2} y={P.t+0.8*ph+3} fill="rgba(239,68,68,0.5)" fontSize="7" fontFamily="JetBrains Mono">VOID</text>
        {shown.map((tile, i) => {
          const pts = [];
          for (let h = 0; h <= 72; h += 2) {
            const s = tile.recall_probability * Math.pow(0.5, h / Math.max(1, tile.half_life / 60));
            pts.push(`${P.l+(h/72)*pw},${P.t+(1-s)*ph}`);
          }
          return (
            <polyline key={i} points={pts.join(" ")} fill="none"
              stroke={getCategoryColor(tile.category)} strokeWidth="2"
              opacity="1" strokeLinecap="round" />
          );
        })}
        <text x={P.l}    y={H-2} fill="rgba(255,255,255,0.35)" fontSize="8" fontFamily="JetBrains Mono">0h</text>
        <text x={P.l+pw} y={H-2} fill="rgba(255,255,255,0.35)" fontSize="8" fontFamily="JetBrains Mono" textAnchor="end">72h</text>
        <text x={P.l-4}  y={P.t+6} fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="JetBrains Mono" textAnchor="end">1.0</text>
        <text x={P.l-4}  y={P.t+ph+2} fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="JetBrains Mono" textAnchor="end">0</text>
      </svg>
      {shown.length > 0 && (
        <div className="flex flex-wrap gap-x-2.5 gap-y-1 mt-1.5 pt-1.5 border-t border-white/5">
          {shown.map((t, i) => (
            <span key={i} className="flex items-center gap-1">
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: getCategoryColor(t.category), flexShrink: 0, display: "inline-block" }} />
              <span className="font-mono text-[8px] text-text2 truncate max-w-[80px]">{t.name.slice(0, 12)}</span>
            </span>
          ))}
        </div>
      )}
      {!shown.length && <p className="text-[10px] text-text3 italic">Visit tiles to begin tracking.</p>}
    </div>
  );
}

// ── Mastery Distribution histogram ──
function MasteryDist({ tiles }) {
  const W = 258, H = 90, P = { l: 8, r: 8, t: 8, b: 22 };
  const pw = W - P.l - P.r, ph = H - P.t - P.b;
  const labels = ["VOID","WEAK","FAIR","GOOD","MASTER"];
  const colors = ["#ef4444","#f59e0b","#eab308","#10b981","#00e5ff"];

  const buckets = useMemo(() => {
    const b = [0,0,0,0,0];
    tiles.forEach(t => {
      if (t.n_exposures === 0) return;
      b[Math.min(4, Math.floor(t.recall_probability * 5))]++;
    });
    return b;
  }, [tiles]);

  const maxB = Math.max(...buckets, 1);
  const gap = 4, barW = (pw - gap * 4) / 5;

  return (
    <div className="panel">
      <div className="panel-label">MASTERY DISTRIBUTION</div>
      <svg width={W} height={H} style={{ display: "block", width: "100%" }}>
        {buckets.map((count, i) => {
          const bh = (count / maxB) * ph;
          const bx = P.l + i * (barW + gap);
          const by = P.t + ph - bh;
          return (
            <g key={i}>
              <rect x={bx} y={by} width={barW} height={bh} fill={colors[i]} opacity="0.85" rx="2" />
              {count > 0 && (
                <text x={bx+barW/2} y={by-3} fill="rgba(255,255,255,0.7)" fontSize="9"
                  fontFamily="JetBrains Mono" textAnchor="middle">{count}</text>
              )}
              <text x={bx+barW/2} y={H-4} fill="rgba(255,255,255,0.4)" fontSize="7"
                fontFamily="JetBrains Mono" textAnchor="middle">{labels[i]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Neural Speed gauge ──
function NeuralSpeed({ reviewsPerMin }) {
  const pct = Math.min(100, (reviewsPerMin / 8) * 100);
  const bg = pct > 70 ? "linear-gradient(90deg,#00e5ff,#a855f7)"
    : pct > 30 ? "linear-gradient(90deg,#10b981,#00e5ff)"
    : "linear-gradient(90deg,#6b7294,#10b981)";
  return (
    <div className="panel panel-compact">
      <div className="panel-label">NEURAL SPEED</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: bg, transition: "width 0.4s ease", borderRadius: 4 }} />
        </div>
        <span className="font-mono text-[12px] font-bold text-text1 w-10 text-right shrink-0">
          {reviewsPerMin.toFixed(1)}/m
        </span>
      </div>
    </div>
  );
}

// ── Session Stats 2×2 grid ──
function SessionStats({ stats }) {
  const cells = [
    { label: "REVIEWED",  value: stats.reviewed,  color: "#00e5ff" },
    { label: "MASTERED",  value: stats.mastered,  color: "#10b981" },
    { label: "LOST",      value: stats.lost,      color: "#ef4444" },
    { label: "EXPLORED",  value: `${stats.explored}%`, color: "#a855f7" },
  ];
  return (
    <div className="panel panel-compact grid grid-cols-2 gap-1.5">
      {cells.map(({ label, value, color }) => (
        <div key={label} className="flex flex-col items-center py-1 rounded" style={{ background: "rgba(255,255,255,0.015)" }}>
          <span className="font-mono text-[16px] font-bold" style={{ color, fontFamily: "Orbitron, sans-serif" }}>{value}</span>
          <span className="font-mono text-[7px] text-text3 tracking-[0.2em] mt-0.5">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Knowledge regions legend ──
function RegionLegend({ tiles }) {
  const regions = useMemo(() => {
    const seen = new Map();
    tiles.forEach(t => {
      if (!seen.has(t.category)) seen.set(t.category, getCategoryColor(t.category));
    });
    return [...seen.entries()];
  }, [tiles]);

  if (!regions.length) return null;
  return (
    <div className="panel panel-compact">
      <div className="panel-label">KNOWLEDGE REGIONS</div>
      <div className="flex flex-wrap gap-x-2.5 gap-y-1.5">
        {regions.map(([cat, color]) => (
          <span key={cat} className="flex items-center gap-1.5">
            <span style={{ width: 6, height: 6, borderRadius: 2, background: color, display: "inline-block" }} />
            <span className="text-[10px] text-text2">{cat.replace(/_/g, " ")}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── ML Profile ──
function MLProfile({ profile }) {
  if (!profile || !profile.ready) {
    const remaining = 5 - (profile?.n_visited || 0);
    return (
      <div className="panel panel-compact">
        <div className="panel-label">LEARNER PROFILE</div>
        <p className="text-[10px] text-text3 italic">
          {remaining > 0 ? `Visit ${remaining} more tile${remaining > 1 ? "s" : ""} to profile.` : "Profiling..."}
        </p>
      </div>
    );
  }
  return (
    <div className="panel panel-compact">
      <div className="panel-label">LEARNER PROFILE</div>
      <div className="text-[14px] font-bold text-cyan mb-1" style={{ fontFamily: "Orbitron, sans-serif" }}>
        {profile.label}
      </div>
      <p className="text-[10px] text-text3 leading-relaxed mb-2">{profile.description}</p>
      <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
        <span>Acc: <span className="text-emerald">{(profile.features.accuracy * 100).toFixed(0)}%</span></span>
        <span>RT:  <span className="text-amber">{profile.features.response_time.toFixed(1)}s</span></span>
        <span>Cons: <span className="text-cyan">{profile.features.consistency.toFixed(2)}</span></span>
      </div>
    </div>
  );
}

// ── Main Dashboard (right sidebar, 290px) ──
export default function Dashboard({ currentTile, sessionTime }) {
  const { tiles, ml } = useGameStore();

  const totalN = useMemo(() => tiles.reduce((s, t) => s + t.n_exposures, 0), [tiles]);
  const prevRef = useRef({ n: 0, t: Date.now() });
  const [reviewsPerMin, setReviewsPerMin] = useState(0);

  useEffect(() => {
    const now = Date.now();
    const deltaT = (now - prevRef.current.t) / 60000;
    const deltaN = totalN - prevRef.current.n;
    if (deltaT > 0.05) {
      setReviewsPerMin(prev => Math.max(0, deltaT > 0 ? deltaN / deltaT : prev));
      prevRef.current = { n: totalN, t: now };
    }
  }, [totalN]);

  const stats = useMemo(() => ({
    reviewed: totalN,
    mastered: tiles.filter(t => t.n_exposures > 0 && t.recall_probability > 0.9).length,
    lost:     tiles.filter(t => t.n_exposures > 0 && t.recall_probability <= 0.2).length,
    explored: `${tiles.length ? Math.round((tiles.filter(t => t.n_exposures > 0).length / tiles.length) * 100) : 0}`,
  }), [tiles, totalN]);

  return (
    <aside
      className="flex flex-col gap-0.5 overflow-y-auto"
      style={{
        width: 290,
        flexShrink: 0,
        background: "rgba(6,6,15,0.6)",
        borderLeft: "1px solid rgba(0,229,255,0.06)",
        padding: 8,
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255,255,255,0.06) transparent",
      }}
    >
      {/* Scanning line decoration */}
      <div className="w-full h-0.5 pointer-events-none opacity-30 animate-scan shrink-0"
        style={{ background: "rgba(0,229,255,0.3)", boxShadow: "0 0 12px rgba(0,229,255,0.4)" }} />

      <TileInspector tile={currentTile} />
      <DecayCurves tiles={tiles} />
      <MasteryDist tiles={tiles} />
      <NeuralSpeed reviewsPerMin={reviewsPerMin} />
      <SessionStats stats={stats} />
      <RegionLegend tiles={tiles} />
      <MLProfile profile={ml.profile} />
    </aside>
  );
}
