import GameCanvas from "./components/GameCanvas";
import QuestionModal from "./components/QuestionModal";
import Dashboard from "./components/Dashboard";
import Compass from "./components/Compass";
import LandingPage from "./components/LandingPage";
import { useGameStore } from "./store";
import { useGameLoop } from "./hooks/useGameLoop";
import { usePlayerMovement } from "./hooks/usePlayerMovement";
import { useML } from "./hooks/useML";

export default function App() {
  const view = useGameStore((s) => s.view);

  return (
    <main className="w-full h-full flex items-center justify-center bg-void relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,186,8,0.05)_0%,_transparent_70%)] pointer-events-none" />
      
      {view === "landing" ? (
        <LandingPage />
      ) : (
        <GameView />
      )}
      
      {/* Static HUD Decoration */}
      <div className="absolute bottom-8 right-8 text-right pointer-events-none flex items-center gap-4">
        <div className="text-right">
          <div className="text-[10px] text-bright-yellow uppercase tracking-[0.3em] font-bold">Neural Engine v0.1.0</div>
          <div className="text-[8px] text-orange uppercase tracking-[0.2em]">Spaced Repetition Active // Spatio-Temporal Mapping Engaged</div>
        </div>
        <div className="w-12 h-12">
            <img src="/f-logo.svg" alt="Logo" className="w-full h-full"/>
        </div>
      </div>
    </main>
  );
}

function GameView() {
  // Initialize game systems only when entering game view
  useGameLoop();
  usePlayerMovement();
  useML();

  return (
    <>
      <GameCanvas />
      <QuestionModal />
      <Dashboard />
      <Compass />
      
      {/* Controls Hint */}
      <div className="absolute bottom-8 left-8 pointer-events-none opacity-60">
        <div className="flex gap-4 items-center">
          <div className="flex flex-col gap-1 items-center">
            <div className="flex gap-1">
              <Key cap="W" />
            </div>
            <div className="flex gap-1">
              <Key cap="A" />
              <Key cap="S" />
              <Key cap="D" />
            </div>
          </div>
          <div className="text-[10px] text-bright-yellow uppercase tracking-widest leading-none">
            Use WASD or Arrows<br/>to Navigate the Grid
          </div>
        </div>
      </div>
    </>
  );
}

function Key({ cap }) {
  return (
    <div className="w-6 h-6 border border-bright-yellow/30 rounded flex items-center justify-center text-[10px] text-bright-yellow font-bold bg-dark/40">
      {cap}
    </div>
  );
}
