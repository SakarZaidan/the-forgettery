import { useEffect, useRef } from "react";
import { useGameStore } from "../store";
import { drawTile, drawPlayer, drawFog } from "../utils/tileRenderer";

const TILE_SIZE = 48;

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const { tiles, player, gridSize, ml, subject, isConnected, connectionError } = useGameStore();
  
  // High-performance render loop using requestAnimationFrame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d", { alpha: false }); // Optimize for non-transparent canvas
    let raf;
    
    const render = (time) => {
      // 1. Clear with Background
      ctx.fillStyle = "#0a0014"; // void color
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 2. Render Tiles
      tiles.forEach((tile) => {
        drawTile(ctx, tile, TILE_SIZE, time);
      });
      
      // 3. Render Fog (ML Uncertainty)
      // We map uncertainty tiles to their grid positions
      const uncertaintyMap = new Map(
        ml.uncertainty.map(u => [`${u.x},${u.y}`, u.std])
      );
      
      tiles.forEach((tile) => {
        const std = uncertaintyMap.get(`${tile.x},${tile.y}`) || 0;
        // Only show fog if never exposed and uncertainty is high
        if (tile.n_exposures === 0 && std > 0.15) {
          drawFog(ctx, { ...tile, std }, TILE_SIZE, time);
        }
      });
      
      // 4. Render Player
      drawPlayer(ctx, player, TILE_SIZE, time);
      
      raf = requestAnimationFrame(render);
    };
    
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [tiles, player, ml.uncertainty]);

  return (
    <div className="relative group p-4 bg-void border border-dark/30 rounded-2xl shadow-2xl shadow-ruby/10 transition-all hover:border-ruby/30">
      <canvas
        ref={canvasRef}
        width={gridSize * TILE_SIZE}
        height={gridSize * TILE_SIZE}
        className="rounded-lg cursor-none"
      />
      
      {/* HUD overlay for subject */}
      <div className="absolute top-8 left-8 pointer-events-none">
        <div className="text-[10px] text-red uppercase tracking-[0.2em] mb-1">Subject Vector</div>
        <div className="text-xl font-bold text-yellow tracking-wider drop-shadow-sm">
          {subject || (connectionError ? "LINK OFFLINE" : "Initializing..")}
        </div>
      </div>

      {/* Connection Error Overlay */}
      {connectionError && (
        <div className="absolute inset-0 flex items-center justify-center bg-void/60 backdrop-blur-md rounded-lg z-10">
          <div className="p-6 border-2 border-red-500/50 bg-black/80 rounded-xl text-center max-w-xs shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <div className="text-red-500 font-black uppercase tracking-tighter mb-2 italic">Neural Disconnect</div>
            <p className="text-xs text-bright-yellow/70 mb-4">{connectionError}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 text-[10px] uppercase font-bold tracking-widest rounded hover:bg-red-500 hover:text-bright-yellow transition-all"
            >
              Re-attempt Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
