import { useGameStore } from "../store";

export default function Compass() {
  const compass = useGameStore(s => s.ml.compass);
  const player  = useGameStore(s => s.player);

  if (!compass) return null;

  const dx = compass.target_x - player.x;
  const dy = compass.target_y - player.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <div style={{
      position: "absolute",
      top: 12, right: 12,
      background: "rgba(10,14,28,0.85)",
      border: "1px solid rgba(0,229,255,0.15)",
      borderRadius: 10,
      padding: "10px 14px",
      backdropFilter: "blur(10px)",
      zIndex: 20,
      minWidth: 180,
    }}>
      <div className="font-mono text-[9px] text-text3 uppercase tracking-[0.2em] mb-2">
        Neural Guidance
      </div>
      <div className="flex items-center gap-3">
        <div style={{
          width: 36, height: 36,
          background: "rgba(0,229,255,0.08)",
          border: "1px solid rgba(0,229,255,0.2)",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          transform: `rotate(${angle}deg)`,
          transition: "transform 0.6s ease",
          flexShrink: 0,
        }}>
          <span style={{ color: "#00e5ff", fontSize: 16 }}>➤</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[8px] text-text3 uppercase mb-0.5">Target Sector</div>
          <div className="font-mono text-[11px] font-bold text-cyan truncate uppercase tracking-wider">
            {compass.recommended_region.replace(/_/g, " ")}
          </div>
          <div style={{
            display: "inline-block",
            padding: "1px 6px",
            marginTop: 3,
            background: compass.reason === "High Urgency" ? "rgba(239,68,68,0.15)" : "rgba(168,85,247,0.15)",
            border: `1px solid ${compass.reason === "High Urgency" ? "rgba(239,68,68,0.3)" : "rgba(168,85,247,0.3)"}`,
            borderRadius: 4,
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 8,
            color: compass.reason === "High Urgency" ? "#ef4444" : "#a855f7",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}>
            {compass.reason}
          </div>
        </div>
      </div>
    </div>
  );
}
