import { useEffect } from "react";
import { useGameStore } from "../store";
import {
  getMLHalflives,
  getMLUncertainty,
  getMLCompass,
  getMLProfile,
  getMLDecayHistory,
} from "../api/client";

/**
 * Hook to manage background polling of ML internal states.
 * Lower frequency than game state (every 2-5 seconds).
 */
export function useML() {
  const { playerId, setML } = useGameStore();

  useEffect(() => {
    if (!playerId) return;

    const pollML = async () => {
      try {
        // Parallel fetching for high-performance dashboarding
        const [hl, un, cp, dh, pr] = await Promise.all([
          getMLHalflives(playerId),
          getMLUncertainty(playerId),
          getMLCompass(playerId),
          getMLDecayHistory(playerId),
          getMLProfile(playerId).catch(() => ({ ready: false })), // Phase 12 Profile
        ]);

        setML({
          halflives: hl.rows,
          uncertainty: un.tiles,
          compass: cp,
          decay: dh.history,
          profile: pr,
        });
      } catch (err) {
        console.warn("ML Insight Sync Failed - Retrying...");
      }
    };

    // Initial poll
    pollML();

    // Poll every 3 seconds
    const interval = setInterval(pollML, 3000);
    
    return () => clearInterval(interval);
  }, [playerId, setML]);
}
