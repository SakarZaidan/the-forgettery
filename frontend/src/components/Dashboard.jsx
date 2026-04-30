import { useState } from "react";
import { Brain, ChevronLeft, ChevronRight, BarChart3, Map as MapIcon, UserCircle } from "lucide-react";
import HalfLifeTable from "./HalfLifeTable";
import DecayTimeline from "./DecayTimeline";
import UncertaintyHeatmap from "./UncertaintyHeatmap";
import DebuggerProfile from "./DebuggerProfile";

export default function Dashboard() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-1/2 -translate-y-1/2 z-50 p-2 bg-void/90 border border-ruby text-yellow rounded-r-xl transition-all duration-300 ${
          isOpen ? "left-[320px]" : "left-0"
        }`}
      >
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-[320px] bg-void/95 border-r border-ruby backdrop-blur-xl z-40 transition-transform duration-300 overflow-hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Scanning Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-yellow/20 shadow-[0_0_15px_rgba(125,249,255,0.5)] z-50 animate-scan pointer-events-none opacity-40" />

        <div className="p-6 h-full overflow-y-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-wine rounded-lg shadow-[0_0_15px_var(--color-wine)]">
              <img src="/f-logo.svg" alt="Brain" className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-yellow-yellow uppercase tracking-tighter leading-none">
                Neural Dashboard
              </h1>
              <div className="text-[10px] text-orange font-bold uppercase tracking-widest mt-1">
                Live ML Feedback
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <Section icon={<BarChart3 size={14} />} title="Spaced Repetition Stats">
              <HalfLifeTable />
            </Section>

            <Section icon={<ActivityIcon size={14} />} title="Aggregate Decay Trend">
              <DecayTimeline />
            </Section>

            <Section icon={<MapIcon size={14} />} title="Knowledge Uncertainty">
              <UncertaintyHeatmap />
            </Section>

            <Section icon={<UserCircle size={14} />} title="Learner Profiling">
              <DebuggerProfile />
            </Section>
          </div>
        </div>
      </aside>
    </>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-yellow opacity-60">{icon}</span>
        <h2 className="text-[10px] font-black text-red uppercase tracking-[0.2em]">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function ActivityIcon({ size }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
