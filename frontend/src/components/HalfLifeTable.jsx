import { useGameStore } from "../store";

export default function HalfLifeTable() {
  const { halflives } = useGameStore((s) => s.ml);

  if (halflives.length === 0) {
    return (
      <div className="text-[10px] text-ruby italic p-4 text-center border border-dashed border-dark/30 rounded-lg">
        Waiting for initial neural signatures...
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-ruby/10 rounded-lg bg-black/20">
      <table className="w-full text-left text-[10px] border-collapse">
        <thead className="bg-dark/20 text-red uppercase tracking-widest font-bold">
          <tr>
            <th className="px-3 py-2">Concept</th>
            <th className="px-3 py-2 text-right">P(Recall)</th>
            <th className="px-3 py-2 text-right">H-Life</th>
          </tr>
        </thead>
        <tbody>
          {halflives.slice(0, 10).map((row) => (
            <tr key={row.concept_key} className="border-t border-ruby/5 hover:bg-yellow/5 transition-colors">
              <td className="px-3 py-2 text-yellow font-medium truncate max-w-[100px]">{row.name}</td>
              <td className="px-3 py-2 text-right">
                <span className={`font-mono ${row.recall_probability < 0.4 ? "text-red-400" : "text-green-400"}`}>
                  {(row.recall_probability * 100).toFixed(0)}%
                </span>
              </td>
              <td className="px-3 py-2 text-right text-yellow/70 font-mono">
                {row.half_life < 60 ? `${row.half_life.toFixed(0)}s` : `${(row.half_life / 60).toFixed(1)}m`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
