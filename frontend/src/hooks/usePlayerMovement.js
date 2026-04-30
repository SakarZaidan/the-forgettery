import { useEffect, useCallback } from "react";
import { useGameStore } from "../store";
import { movePlayer, getQuestion } from "../api/client";

const MOVEMENT_KEYS = {
  ArrowUp: [0, -1],    w: [0, -1], W: [0, -1],
  ArrowDown: [0, 1],   s: [0, 1],  S: [0, 1],
  ArrowLeft: [-1, 0],  a: [-1, 0], A: [-1, 0],
  ArrowRight: [1, 0],  d: [1, 0],  D: [1, 0],
};

export function usePlayerMovement() {
  const { 
    playerId, 
    player, 
    tiles, 
    gridSize, 
    setQuestion, 
    question,
    updatePlayerPos 
  } = useGameStore();

  const handleMove = useCallback(async (dx, dy) => {
    if (!playerId || question) return; // Block movement if answering a question
    
    const nx = player.x + dx;
    const ny = player.y + dy;
    
    // 1. Boundary Check
    if (nx < 0 || ny < 0 || nx >= gridSize || ny >= gridSize) return;
    
    // 2. Void Check (Client-side prediction)
    const targetTile = tiles.find(t => t.x === nx && t.y === ny);
    if (targetTile && targetTile.recall_probability < 0.2) {
      console.warn("Entered the Void - Movement Blocked");
      return;
    }
    
    try {
      // 3. Backend Sync
      await movePlayer({ player_id: playerId, x: nx, y: ny });
      updatePlayerPos(nx, ny);
      
      // 4. Trigger Question if tile exists
      if (targetTile) {
        const qData = await getQuestion(playerId, targetTile.key);
        setQuestion({ ...qData, started_at: Date.now() });
      }
    } catch (err) {
      console.error("Movement sync failed:", err);
    }
  }, [playerId, player, tiles, gridSize, question, setQuestion, updatePlayerPos]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const delta = MOVEMENT_KEYS[e.key];
      if (delta) {
        e.preventDefault();
        handleMove(delta[0], delta[1]);
      }
    };
    
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleMove]);
}
