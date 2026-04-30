import { useGameStore } from "../store";

export default function UncertaintyHeatmap() {
  const { uncertainty } = useGameStore((s) => s.ml);
  const gridSize = useGameStore((s) => s.gridSize);
  
  const BOX_SIZE = 14;

  if (uncertainty.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 border border-dark/20 rounded-lg">
        <div className="w-full h-24 bg-dark/10 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <svg 
        width={gridSize * BOX_SIZE} 
        height={gridSize * BOX_SIZE} 
        className="bg-black/40 rounded border border-ruby/10"
      >
        {uncertainty.map((t) => {
          // Normalize std to opacity
          const opacity = Math.min(1, t.std * 2);
          return (
            <rect
              key={t.concept_key}
              x={t.x * BOX_SIZE}
              y={t.y * BOX_SIZE}
              width={BOX_SIZE - 1}
              height={BOX_SIZE - 1}
              fill={`rgba(140, 120, 220, ${opacity})`}
              className="transition-all duration-1000"
            />
          );
        })}
      </svg>
      <div className="w-full flex justify-between mt-2 text-[8px] text-ruby uppercase font-bold tracking-tighter">
        <span>Mastery Verified</span>
        <span>High Uncertainty</span>
      </div>
    </div>
  );
}
