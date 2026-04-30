import { create } from "zustand";

export const useGameStore = create((set) => ({
  // Core game state
  playerId: null,
  player: { x: 0, y: 0 },
  tiles: [],
  subject: "",
  gridSize: 12,
  
  // UI state
  view: "landing", // "landing" | "game"
  isGenerating: false,
  question: null,
  isMoving: false,
  isConnected: false,
  connectionError: null,
  
  // ML state
  ml: {
    halflives: [],
    uncertainty: [],
    compass: null,
    profile: null,
    decay: [],
  },

  // Actions
  setView: (view) => set({ view }),
  setGenerating: (status) => set({ isGenerating: status }),
  setPlayerId: (id) => set({ playerId: id }),
  setConnected: (status) => set({ isConnected: status, connectionError: null }),
  setConnectionError: (err) => set({ connectionError: err, isConnected: false }),
  
  setState: (s) => set({ 
    player: s.player, 
    tiles: s.tiles, 
    subject: s.subject,
    gridSize: s.grid_size || 12,
    isConnected: true,
    connectionError: null
  }),
  
  setQuestion: (q) => set({ question: q }),
  
  clearQuestion: () => set({ question: null }),
  
  setML: (mlUpdate) => set((state) => ({ 
    ml: { ...state.ml, ...mlUpdate } 
  })),
  
  updatePlayerPos: (x, y) => set((state) => ({
    player: { ...state.player, x, y }
  })),
}));
