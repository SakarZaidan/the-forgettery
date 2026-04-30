import { Navigation } from "lucide-react";
import { useGameStore } from "../store";

export default function Compass() {
  const { compass } = useGameStore((s) => s.ml);
  const { player } = useGameStore();

  if (!compass) return null;

  // Calculate rotation toward target
  const dx = compass.target_x - player.x;
  const dy = compass.target_y - player.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <div className="absolute top-8 right-8 w-64 p-4 bg-void/90 border border-ruby/30 rounded-2xl shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] text-red uppercase tracking-widest font-black">
          Neural Guidance
        </div>
        <div className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold ${
          compass.reason === "High Urgency" ? "bg-red-500/20 text-red-400" : "bg-yellow/20 text-yellow"
        }`}>
          {compass.reason}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div 
          className="p-3 bg-dark/30 rounded-full border border-ruby/20 transition-transform duration-1000 ease-out"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <Navigation className="w-6 h-6 text-yellow fill-yellow/20" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-ruby uppercase font-bold tracking-tighter">Target Sector</div>
          <div className="text-sm font-black text-bright-yellow truncate uppercase tracking-wider">
            {compass.recommended_region.replace("_", " ")}
          </div>
          <div className="text-[9px] text-yellow/60 truncate italic">
            → {compass.target_name}
          </div>
        </div>
      </div>
    </div>
  );
}
