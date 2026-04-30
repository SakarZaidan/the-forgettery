import { useEffect } from "react";
import { useGameStore } from "../store";
import { startGame, getState } from "../api/client";

/**
 * Main game loop hook that syncs frontend state with the backend ML models.
 */
export function useGameLoop() {
  const { playerId, setState, setConnectionError, setConnected } = useGameStore();

  // 1. Initial state load on component mount (after LandingPage sets playerId)
  useEffect(() => {
    if (playerId) {
      getState(playerId)
        .then((state) => {
          setState(state);
          setConnected(true);
        })
        .catch((err) => {
          console.error("Initial sync failed:", err);
          setConnectionError("Neural Link Core Unreachable.");
        });
    }
  }, [playerId, setState, setConnectionError, setConnected]);

  // 2. Poll for state updates (decaying recall probabilities)
  useEffect(() => {
    if (!playerId) return;

    const tick = async () => {
      try {
        const state = await getState(playerId);
        setState(state);
      } catch (err) {
        console.error("State sync failed:", err);
      }
    };

    // Poll every 1 second (Day 1 strategy)
    // Professional Note: In a production app, we might use WebSockets or 
    // client-side interpolation for even smoother updates.
    const interval = setInterval(tick, 1000);
    
    return () => clearInterval(interval);
  }, [playerId, setState]);
}
