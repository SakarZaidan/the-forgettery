import { BrainCircuit, Activity, Zap, CheckCircle2 } from "lucide-react";
import { useGameStore } from "../store";

export default function DebuggerProfile() {
  const { profile } = useGameStore((s) => s.ml);

  if (!profile || !profile.ready) {
    return (
      <div className="p-4 border border-dark/30 rounded-xl bg-void/20 text-center">
        <Activity className="w-6 h-6 text-wine mx-auto mb-2 animate-pulse" />
        <div className="text-[10px] text-red uppercase tracking-widest font-bold">
          Profiling in Progress
        </div>
        <div className="text-[9px] text-wine mt-1">
          {profile ? `Samples: ${profile.n_visited}/5` : "Connecting to Neural Core..."}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-yellow/20 rounded-xl bg-yellow/5">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-yellow/10 rounded-lg">
          <BrainCircuit className="w-5 h-5 text-yellow" />
        </div>
        <div>
          <div className="text-xs font-black text-yellow uppercase tracking-wider">
            {profile.label}
          </div>
          <div className="text-[8px] text-red uppercase font-bold">
            Behavioral Archetype
          </div>
        </div>
      </div>

      <p className="text-[10px] text-yellow leading-relaxed mb-4 italic">
        "{profile.description}"
      </p>

      <div className="grid grid-cols-3 gap-2">
        <MetricIcon 
          icon={<CheckCircle2 className="w-3 h-3 text-green-400" />} 
          label="Accuracy" 
          val={`${(profile.features.accuracy * 100).toFixed(0)}%`} 
        />
        <MetricIcon 
          icon={<Zap className="w-3 h-3 text-yellow-400" />} 
          label="Recall" 
          val={`${profile.features.response_time.toFixed(1)}s`} 
        />
        <MetricIcon 
          icon={<Activity className="w-3 h-3 text-red" />} 
          label="Consistency" 
          val={`${(profile.features.consistency * 100).toFixed(0)}%`} 
        />
      </div>
    </div>
  );
}

function MetricIcon({ icon, label, val }) {
  return (
    <div className="flex flex-col items-center p-2 bg-black/40 rounded-lg border border-bright-yellow/5">
      {icon}
      <div className="text-[7px] text-bright-yellow/40 uppercase mt-1">{label}</div>
      <div className="text-[10px] font-bold text-bright-yellow mt-0.5 font-mono">{val}</div>
    </div>
  );
}
