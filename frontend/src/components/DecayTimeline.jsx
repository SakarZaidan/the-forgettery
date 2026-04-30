import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useGameStore } from "../store";

export default function DecayTimeline() {
  const { decay } = useGameStore((s) => s.ml);

  if (decay.length < 2) {
    return (
      <div className="h-[120px] flex items-center justify-center text-[10px] text-wine border border-dark/20 rounded-lg">
        Calibrating Trend Analysis...
      </div>
    );
  }

  const data = decay.map((d) => ({
    time: new Date(d.t * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    probability: d.mean_recall,
  }));

  return (
    <div className="h-[120px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="time" hide />
          <YAxis domain={[0, 1]} hide />
          <Tooltip 
            contentStyle={{ backgroundColor: "#0a0014", border: "1px solid #7df9ff33", fontSize: "10px" }}
            itemStyle={{ color: "#7df9ff" }}
          />
          <Line
            type="monotone"
            dataKey="probability"
            stroke="#7df9ff"
            strokeWidth={2}
            dot={false}
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
