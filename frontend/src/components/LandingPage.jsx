import { useState } from "react";
import { Brain, Sparkles, Zap, ArrowRight } from "lucide-react";
import { useGameStore } from "../store";
import { startGame, getState } from "../api/client";

export default function LandingPage() {
  const [topic, setTopic] = useState("");
  const { isGenerating, setGenerating, setPlayerId, setState, setView, setConnectionError } = useGameStore();

  const handleStart = async (e) => {
    e.preventDefault();
    if (!topic.trim() || isGenerating) return;

    setGenerating(true);
    try {
      // 1. Trigger Gemini Curriculum Generation
      const session = await startGame({ topic });
      setPlayerId(session.player_id);

      // 2. Fetch the initial state
      const state = await getState(session.player_id);
      setState(state);

      // 3. Enter Game
      setView("game");
    } catch (err) {
      console.error(err);
      setConnectionError("Neural Sync Failed. Gemini might be overloaded or your API key is invalid.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl px-6 animate-in fade-in duration-1000">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-12 text-center">
        <div className="p-4 bg-wine rounded-2xl shadow-[0_0_50px_var(--color-wine)] mb-6 animate-pulse">
          <img src="/f-logo.svg" alt="Brain" className="w-12 h-12" />
        </div>
        <h1 className="text-5xl font-black text-yellow-yellow uppercase tracking-tighter mb-2">
          The Forgettery
        </h1>
        <p className="text-red font-mono text-sm tracking-widest uppercase opacity-70">
          Spatio-Temporal Memory Cartography
        </p>
      </div>

      {/* Input Box */}
      <form onSubmit={handleStart} className="w-full relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-wine to-yellow rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative bg-void border border-ruby rounded-2xl p-2 flex flex-col md:flex-row gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isGenerating}
            placeholder="What sector of knowledge shall we map? (e.g. Quantum Physics, History)"
            className="flex-1 bg-transparent px-6 py-4 outline-none text-yellow-yellow font-mono text-lg placeholder:text-dark/50"
          />
          <button
            type="submit"
            disabled={!topic.trim() || isGenerating}
            className="bg-yellow text-void font-black uppercase tracking-widest px-8 py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                Syncing..
              </>
            ) : (
              <>
                Initialize
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Status Terminal */}
      {isGenerating && (
        <div className="mt-8 w-full font-mono text-[10px] text-orange space-y-1 animate-pulse">
          <div className="flex justify-between">
            <span>&gt; HANDSHAKING WITH GEMINI NEURAL CORE...</span>
            <span>[OK]</span>
          </div>
          <div className="flex justify-between">
            <span>&gt; GENERATING SPATIAL CURRICULUM GRID...</span>
            <span>[WAIT]</span>
          </div>
          <div className="flex justify-between border-t border-dark/20 pt-1">
            <span>&gt; MAPPING TEMPORAL DECAY VECTORS...</span>
            <span>[PENDING]</span>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-12 grid grid-cols-3 gap-8 w-full border-t border-dark/20 pt-8 opacity-40">
        <Feature icon={<Zap size={14}/>} label="HLR DECAY" desc="Real-time knowledge erosion"/>
        <Feature icon={<Brain size={14}/>} label="GAUSSIAN FOG" desc="Uncertainty visualization"/>
        <Feature icon={<Sparkles size={14}/>} label="GEMINI-POWERED" desc="Procedural MCQs"/>
      </div>
    </div>
  );
}

function Feature({ icon, label, desc }) {
  return (
    <div className="text-center">
      <div className="flex justify-center text-yellow mb-1">{icon}</div>
      <div className="text-[10px] font-black text-yellow-yellow uppercase tracking-widest mb-1">{label}</div>
      <div className="text-[8px] text-red uppercase leading-tight">{desc}</div>
    </div>
  );
}
